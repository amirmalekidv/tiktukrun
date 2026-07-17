import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import {
  getStorageDir,
  resolveUploadPath,
  toPublicUploadUrl,
} from '../../common/utils/storage-path';

@Injectable()
export class LandingBannerImageService {
  private readonly logger = new Logger(LandingBannerImageService.name);

  async process(file: Express.Multer.File): Promise<string> {
    if (!file.mimetype?.startsWith('image/')) {
      this.deleteTemp(file.path);
      throw new BadRequestException('فقط فایل تصویر قابل آپلود است');
    }

    const dir = getStorageDir('landing-banners');
    const filename = `banner-${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
    const outPath = path.join(dir, filename);

    await sharp(file.path)
      .resize(1920, 468, { fit: 'cover' })
      .webp({ quality: 88 })
      .toFile(outPath);

    this.deleteTemp(file.path);
    this.logger.log(`Landing banner processed: ${outPath}`);
    return toPublicUploadUrl(`landing-banners/${filename}`);
  }

  delete(publicPath?: string | null) {
    if (!publicPath || !publicPath.includes('/uploads/')) return;
    try {
      const abs = resolveUploadPath(publicPath);
      if (fs.existsSync(abs)) fs.unlinkSync(abs);
    } catch (err) {
      this.logger.warn(`Could not delete landing banner file: ${publicPath}`, err);
    }
  }

  private deleteTemp(filePath?: string) {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
}
