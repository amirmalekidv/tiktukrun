import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import {
  getStorageDir,
  resolveUploadPath,
  toPublicUploadUrl,
} from '../../common/utils/storage-path';

const ALLOWED_MIME = new Set([
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
  'video/x-msvideo',
]);

@Injectable()
export class PlatformIntroVideoService {
  private readonly logger = new Logger(PlatformIntroVideoService.name);

  async process(file: Express.Multer.File): Promise<string> {
    if (!file) {
      throw new BadRequestException('فایل ویدیو الزامی است');
    }

    const mime = file.mimetype?.toLowerCase() ?? '';
    const ext = (path.extname(file.originalname) || '').toLowerCase();
    const looksLikeVideo =
      mime.startsWith('video/') ||
      ALLOWED_MIME.has(mime) ||
      ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.m4v'].includes(ext);

    if (!looksLikeVideo) {
      this.deleteTemp(file.path);
      throw new BadRequestException('فقط فایل ویدیو قابل آپلود است (mp4, webm, …)');
    }

    const dir = getStorageDir('platform-intro');
    const safeExt = ext || '.mp4';
    const filename = `intro-${Date.now()}-${Math.random().toString(36).slice(2)}${safeExt}`;
    const outPath = path.join(dir, filename);

    fs.renameSync(file.path, outPath);
    this.logger.log(`Platform intro video stored: ${outPath}`);
    return toPublicUploadUrl(`platform-intro/${filename}`);
  }

  delete(publicPath?: string | null) {
    if (!publicPath || !publicPath.includes('/uploads/')) return;
    try {
      const abs = resolveUploadPath(publicPath);
      if (fs.existsSync(abs)) fs.unlinkSync(abs);
    } catch (err) {
      this.logger.warn(`Could not delete platform intro video: ${publicPath}`, err);
    }
  }

  private deleteTemp(filePath?: string) {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
}
