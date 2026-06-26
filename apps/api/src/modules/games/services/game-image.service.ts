import {
  Injectable,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import * as path  from 'path';
import * as fs    from 'fs';
import sharp from 'sharp';

const UPLOAD_BASE = path.resolve(process.cwd(), 'storage/uploads/games');

export interface ProcessedImage {
  original:  string; // relative path
  thumbnail: string; // relative path (400x225)
}

@Injectable()
export class GameImageService {
  private readonly logger = new Logger(GameImageService.name);

  private ensureDir(dir: string) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  async processCover(file: Express.Multer.File, gameId: string): Promise<string> {
    const dir      = path.join(UPLOAD_BASE, gameId);
    this.ensureDir(dir);

    const filename = `cover-${Date.now()}.webp`;
    const outPath  = path.join(dir, filename);

    await sharp(file.path)
      .resize(1280, 720, { fit: 'cover' })
      .webp({ quality: 85 })
      .toFile(outPath);

    // حذف فایل موقت multer
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);

    this.logger.log(`Cover processed: ${outPath}`);
    return `/uploads/games/${gameId}/${filename}`;
  }

  async processGalleryImage(
    file: Express.Multer.File,
    gameId: string,
    index: number,
  ): Promise<ProcessedImage> {
    const dir      = path.join(UPLOAD_BASE, gameId);
    this.ensureDir(dir);

    const ts        = Date.now();
    const mainFile  = `gallery-${ts}-${index}.webp`;
    const thumbFile = `thumb-${ts}-${index}.webp`;

    await sharp(file.path)
      .resize(1280, 720, { fit: 'cover' })
      .webp({ quality: 85 })
      .toFile(path.join(dir, mainFile));

    await sharp(file.path)
      .resize(400, 225, { fit: 'cover' })
      .webp({ quality: 80 })
      .toFile(path.join(dir, thumbFile));

    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);

    this.logger.log(`Gallery image processed: ${mainFile}`);
    return {
      original:  `/uploads/games/${gameId}/${mainFile}`,
      thumbnail: `/uploads/games/${gameId}/${thumbFile}`,
    };
  }

  async processTeaserVideo(file: Express.Multer.File, gameId: string): Promise<string> {
    const dir      = path.join(UPLOAD_BASE, gameId, 'teasers');
    this.ensureDir(dir);

    const ext      = path.extname(file.originalname) || '.mp4';
    const filename = `teaser-${Date.now()}${ext}`;
    const outPath  = path.join(dir, filename);

    // در production از FFmpeg استفاده می‌شود — فعلاً فایل را منتقل می‌کنیم
    fs.renameSync(file.path, outPath);
    this.logger.log(`Teaser stored: ${outPath}`);
    return `/uploads/games/${gameId}/teasers/${filename}`;
  }

  deleteFile(relativePath: string) {
    try {
      // relativePath مثلاً: /uploads/games/{gameId}/cover.webp
      // فایل در storage/uploads/games/{gameId}/cover.webp ذخیره است
      // پس باید پیشوند /uploads را با storage/uploads جایگزین کنیم
      const normalizedPath = relativePath.startsWith('/')
        ? relativePath.slice(1) // حذف slash ابتدایی
        : relativePath;
      const abs = path.join(process.cwd(), 'storage', normalizedPath);
      if (fs.existsSync(abs)) fs.unlinkSync(abs);
    } catch (err) {
      this.logger.warn(`Could not delete file: ${relativePath}`, err);
    }
  }
}
