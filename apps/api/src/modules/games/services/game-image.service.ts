import {
  Injectable,
  Logger,
} from '@nestjs/common';
import * as path  from 'path';
import * as fs    from 'fs';
import sharp from 'sharp';
import { getStorageDir, resolveUploadPath, toPublicUploadUrl } from '../../../common/utils/storage-path';

export interface ProcessedImage {
  original:  string; // public URL
  thumbnail: string; // public URL (400x225)
}

@Injectable()
export class GameImageService {
  private readonly logger = new Logger(GameImageService.name);

  async processCover(file: Express.Multer.File, gameId: string): Promise<string> {
    const dir = getStorageDir('games', gameId);

    const filename = `cover-${Date.now()}.webp`;
    const outPath  = path.join(dir, filename);

    await sharp(file.path)
      .resize(1280, 720, { fit: 'cover' })
      .webp({ quality: 85 })
      .toFile(outPath);

    // حذف فایل موقت multer
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);

    this.logger.log(`Cover processed: ${outPath}`);
    return toPublicUploadUrl(`games/${gameId}/${filename}`);
  }

  async processGalleryImage(
    file: Express.Multer.File,
    gameId: string,
    index: number,
  ): Promise<ProcessedImage> {
    const dir = getStorageDir('games', gameId);

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
      original:  toPublicUploadUrl(`games/${gameId}/${mainFile}`),
      thumbnail: toPublicUploadUrl(`games/${gameId}/${thumbFile}`),
    };
  }

  async processTeaserVideo(file: Express.Multer.File, gameId: string): Promise<string> {
    const dir = getStorageDir('games', gameId, 'teasers');

    const ext      = path.extname(file.originalname) || '.mp4';
    const filename = `teaser-${Date.now()}${ext}`;
    const outPath  = path.join(dir, filename);

    // در production از FFmpeg استفاده می‌شود — فعلاً فایل را منتقل می‌کنیم
    fs.renameSync(file.path, outPath);
    this.logger.log(`Teaser stored: ${outPath}`);
    return toPublicUploadUrl(`games/${gameId}/teasers/${filename}`);
  }

  deleteFile(publicPath: string) {
    try {
      const abs = resolveUploadPath(publicPath);
      if (fs.existsSync(abs)) fs.unlinkSync(abs);
    } catch (err) {
      this.logger.warn(`Could not delete file: ${publicPath}`, err);
    }
  }
}
