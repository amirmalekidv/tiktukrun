import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const BACKUP_DIR =
  process.env.BACKUP_PATH ||
  path.resolve(process.cwd(), '../../storage/backups');
const BACKUP_RUNNING_FLAG = '/tmp/.backup_running';
const BACKUP_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);

  constructor() {
    // Ensure backup directory exists
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
  }

  /**
   * Create database backup using mongodump (gzip-compressed archive).
   *
   * MongoDB migration: replaced the old pg_dump|gzip pipeline with
   * `mongodump --uri=<DATABASE_URL> --archive --gzip`, which streams a single
   * self-contained, already-compressed archive to stdout. We pipe that
   * straight to disk — no separate gzip process needed.
   *
   * Restore with: `mongorestore --uri=<DATABASE_URL> --archive=<file> --gzip`
   */
  async createBackup(): Promise<{ filename: string; size: number }> {
    // Check if backup is already running
    if (fs.existsSync(BACKUP_RUNNING_FLAG)) {
      throw new ConflictException(
        'یک پشتیبان‌گیری در حال اجرا است. لطفاً صبر کنید',
      );
    }

    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
      .slice(0, 19);
    const filename = `backup-${timestamp}.archive.gz`;
    const filepath = path.join(BACKUP_DIR, filename);
    const dbUri =
      process.env.DATABASE_URL ??
      'mongodb://localhost:27017/tiktakrun?replicaSet=rs0&directConnection=true';

    // Create running flag
    fs.writeFileSync(BACKUP_RUNNING_FLAG, timestamp);

    return new Promise((resolve, reject) => {
      // Single settled flag prevents resolve/reject being called twice
      // (race between output 'finish' and mongodump 'close').
      let settled = false;
      const settle = (fn: () => void) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        fn();
      };

      let dumpExitCode: number | null = null;
      let outputFinished = false;

      const tryResolve = () => {
        // Resolve only when mongodump exited 0 AND the file finished writing.
        if (dumpExitCode === null || !outputFinished) return;
        if (dumpExitCode !== 0) return; // already rejected in close handler
        settle(() => {
          try {
            if (fs.existsSync(BACKUP_RUNNING_FLAG)) {
              fs.unlinkSync(BACKUP_RUNNING_FLAG);
            }
            const stats = fs.statSync(filepath);
            this.logger.log(`Backup created: ${filename} (${stats.size} bytes)`);
            resolve({ filename, size: stats.size });
          } catch (err) {
            reject(err);
          }
        });
      };

      const timeout = setTimeout(() => {
        settle(() => {
          this.cleanup(filepath);
          reject(new Error('Backup timed out after 30 minutes'));
        });
      }, BACKUP_TIMEOUT_MS);

      try {
        const mongodump = spawn('mongodump', [
          `--uri=${dbUri}`,
          '--archive',
          '--gzip',
        ]);

        const output = fs.createWriteStream(filepath);
        mongodump.stdout.pipe(output);

        // Capture stderr for diagnostics (mongodump logs progress there).
        let stderrTail = '';
        mongodump.stderr.on('data', (chunk) => {
          stderrTail = (stderrTail + chunk.toString()).slice(-2000);
        });

        mongodump.on('error', (err) => {
          this.logger.error(`mongodump error: ${err.message}`);
          settle(() => {
            this.cleanup(filepath);
            reject(
              new Error(
                `mongodump spawn error: ${err.message} — آیا ابزار mongodump (mongodb-database-tools) نصب است؟`,
              ),
            );
          });
        });

        output.on('finish', () => {
          outputFinished = true;
          tryResolve();
        });

        output.on('error', (err) => {
          settle(() => {
            this.cleanup(filepath);
            reject(err);
          });
        });

        mongodump.on('close', (code) => {
          dumpExitCode = code ?? 1;
          if (dumpExitCode !== 0) {
            this.logger.error(`mongodump failed: ${stderrTail}`);
            settle(() => {
              this.cleanup(filepath);
              reject(new Error(`mongodump exited with code ${dumpExitCode}`));
            });
          } else {
            tryResolve();
          }
        });
      } catch (err) {
        settle(() => {
          this.cleanup(filepath);
          reject(err);
        });
      }
    });
  }

  /**
   * List backup files
   */
  listBackups(): { filename: string; size: number; createdAt: Date }[] {
    if (!fs.existsSync(BACKUP_DIR)) return [];

    const files = fs
      .readdirSync(BACKUP_DIR)
      .filter(
        (f) =>
          f.endsWith('.archive.gz') ||
          f.endsWith('.sql.gz') ||
          f.endsWith('.tar.gz'),
      )
      .map((filename) => {
        const filepath = path.join(BACKUP_DIR, filename);
        const stats = fs.statSync(filepath);
        return {
          filename,
          size: stats.size,
          createdAt: stats.mtime,
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return files;
  }

  /**
   * Get full path for download
   */
  getBackupPath(filename: string): string {
    // Sanitize filename — no path traversal
    const safe = path.basename(filename);
    const filepath = path.join(BACKUP_DIR, safe);

    if (!fs.existsSync(filepath)) {
      throw new NotFoundException(`فایل ${filename} یافت نشد`);
    }

    return filepath;
  }

  /**
   * Delete a backup file
   */
  deleteBackup(filename: string): void {
    const safe = path.basename(filename);
    const filepath = path.join(BACKUP_DIR, safe);

    if (!fs.existsSync(filepath)) {
      throw new NotFoundException(`فایل ${filename} یافت نشد`);
    }

    fs.unlinkSync(filepath);
    this.logger.log(`Deleted backup: ${filename}`);
  }

  /**
   * Restore database from a backup archive.
   * Requires confirmToken === filename for safety.
   */
  async restoreBackup(
    filename: string,
    confirmToken: string,
  ): Promise<{ restored: string; preRestoreBackup?: string }> {
    if (confirmToken !== filename) {
      throw new ConflictException(
        'confirmToken باید دقیقاً برابر نام فایل پشتیبان باشد',
      );
    }

    if (fs.existsSync(BACKUP_RUNNING_FLAG)) {
      throw new ConflictException('عملیات پشتیبان‌گیری/بازیابی دیگری در حال اجراست');
    }

    const safe = path.basename(filename);
    const filepath = this.getBackupPath(safe);
    const dbUri =
      process.env.DATABASE_URL ??
      'mongodb://localhost:27017/tiktakrun?replicaSet=rs0&directConnection=true';

    let preRestoreBackup: string | undefined;
    try {
      const pre = await this.createBackup();
      preRestoreBackup = pre.filename;
    } catch (err) {
      this.logger.warn(`Pre-restore backup skipped: ${(err as Error).message}`);
    }

    fs.writeFileSync(BACKUP_RUNNING_FLAG, `restore-${Date.now()}`);

    return new Promise((resolve, reject) => {
      let settled = false;
      const settle = (fn: () => void) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        fn();
      };

      const timeout = setTimeout(() => {
        settle(() => {
          this.cleanupFlag();
          reject(new Error('Restore timed out after 30 minutes'));
        });
      }, BACKUP_TIMEOUT_MS);

      const mongorestore = spawn('mongorestore', [
        `--uri=${dbUri}`,
        `--archive=${filepath}`,
        '--gzip',
        '--drop',
      ]);

      let stderrTail = '';
      mongorestore.stderr.on('data', (chunk) => {
        stderrTail = (stderrTail + chunk.toString()).slice(-2000);
      });

      mongorestore.on('error', (err) => {
        settle(() => {
          this.cleanupFlag();
          reject(new Error(`mongorestore spawn error: ${err.message}`));
        });
      });

      mongorestore.on('close', (code) => {
        settle(() => {
          this.cleanupFlag();
          if (code !== 0) {
            this.logger.error(`mongorestore failed: ${stderrTail}`);
            reject(new Error(`mongorestore exited with code ${code}`));
            return;
          }
          this.logger.log(`Restored backup: ${safe}`);
          resolve({ restored: safe, preRestoreBackup });
        });
      });
    });
  }

  private cleanupFlag(): void {
    try {
      if (fs.existsSync(BACKUP_RUNNING_FLAG)) {
        fs.unlinkSync(BACKUP_RUNNING_FLAG);
      }
    } catch { /* ignore */ }
  }

  private cleanup(filepath: string): void {
    try {
      if (fs.existsSync(BACKUP_RUNNING_FLAG)) {
        fs.unlinkSync(BACKUP_RUNNING_FLAG);
      }
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    } catch { /* ignore */ }
  }
}
