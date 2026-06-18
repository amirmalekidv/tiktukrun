import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const BACKUP_DIR = '/storage/backups';
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
   * Create database backup using pg_dump + gzip
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
    const filename = `backup-${timestamp}.sql.gz`;
    const filepath = path.join(BACKUP_DIR, filename);

    // Create running flag
    fs.writeFileSync(BACKUP_RUNNING_FLAG, timestamp);

    return new Promise((resolve, reject) => {
      // FIX: Use a single settled flag to prevent resolve/reject being called multiple times
      // (race condition between output 'finish' and pgDump 'close' with non-zero exit code)
      let settled = false;
      const settle = (fn: () => void) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        fn();
      };

      // FIX: Track pgDump exit code; output 'finish' must wait for pgDump to close cleanly
      let pgDumpExitCode: number | null = null;
      let outputFinished = false;

      const tryResolve = () => {
        // Only resolve when BOTH pgDump has closed with code 0 AND output has finished writing
        if (pgDumpExitCode === null || !outputFinished) return;
        if (pgDumpExitCode !== 0) return; // already rejected in pgDump.on('close')
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
        const pgDump = spawn('pg_dump', [
          process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/tiktakrun',
          '--no-password',
          '--format=plain',
        ]);

        const gzip = spawn('gzip', ['-9', '-c']);
        const output = fs.createWriteStream(filepath);

        pgDump.stdout.pipe(gzip.stdin);
        gzip.stdout.pipe(output);

        // FIX: On pg_dump spawn error, properly reject with cleanup
        pgDump.on('error', (err) => {
          this.logger.error(`pg_dump error: ${err.message}`);
          settle(() => {
            this.cleanup(filepath);
            reject(new Error(`pg_dump spawn error: ${err.message}`));
          });
        });

        // FIX: On gzip error, properly reject with cleanup
        gzip.on('error', (err) => {
          this.logger.error(`gzip error: ${err.message}`);
          settle(() => {
            this.cleanup(filepath);
            reject(new Error(`gzip error: ${err.message}`));
          });
        });

        output.on('finish', () => {
          // FIX: Do NOT resolve here immediately — wait for pgDump exit code too
          outputFinished = true;
          tryResolve();
        });

        output.on('error', (err) => {
          settle(() => {
            this.cleanup(filepath);
            reject(err);
          });
        });

        pgDump.on('close', (code) => {
          pgDumpExitCode = code ?? 1;
          if (pgDumpExitCode !== 0) {
            // FIX: pg_dump failed — reject regardless of whether output finished
            settle(() => {
              this.cleanup(filepath);
              reject(new Error(`pg_dump exited with code ${pgDumpExitCode}`));
            });
          } else {
            // pg_dump OK — check if output already finished
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
      .filter((f) => f.endsWith('.sql.gz') || f.endsWith('.tar.gz'))
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
