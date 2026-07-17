import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLandingBannerDto, UpdateLandingBannerDto } from './dto/landing-banner.dto';
import { LandingBannerImageService } from './landing-banner-image.service';

function cleanOptionalString(value: string | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

@Injectable()
export class LandingBannersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly imageService: LandingBannerImageService,
  ) {}

  findActive() {
    return this.prisma.landingBanner.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  findAll() {
    return this.prisma.landingBanner.findMany({
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async create(dto: CreateLandingBannerDto, file?: Express.Multer.File) {
    const imageUrl = file
      ? await this.imageService.process(file)
      : cleanOptionalString(dto.imageUrl);

    if (!imageUrl) {
      throw new BadRequestException('تصویر بنر الزامی است');
    }

    const displayOrder =
      dto.displayOrder ?? (await this.prisma.landingBanner.count());

    try {
      return await this.prisma.landingBanner.create({
        data: {
          title: cleanOptionalString(dto.title),
          altText: cleanOptionalString(dto.altText),
          href: cleanOptionalString(dto.href),
          imageUrl,
          displayOrder,
          isActive: dto.isActive ?? true,
        },
      });
    } catch (error) {
      if (file) this.imageService.delete(imageUrl);
      throw error;
    }
  }

  async update(id: string, dto: UpdateLandingBannerDto, file?: Express.Multer.File) {
    const current = await this.ensureExists(id);
    const data: Record<string, unknown> = {};

    if (dto.title !== undefined) data.title = cleanOptionalString(dto.title);
    if (dto.altText !== undefined) data.altText = cleanOptionalString(dto.altText);
    if (dto.href !== undefined) data.href = cleanOptionalString(dto.href);
    if (dto.displayOrder !== undefined) data.displayOrder = dto.displayOrder;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    const explicitImageUrl = cleanOptionalString(dto.imageUrl);
    let processedImageUrl: string | undefined;
    if (file) {
      processedImageUrl = await this.imageService.process(file);
      data.imageUrl = processedImageUrl;
    } else if (explicitImageUrl) {
      data.imageUrl = explicitImageUrl;
    }

    let updated;
    try {
      updated = await this.prisma.landingBanner.update({
        where: { id },
        data: data as any,
      });
    } catch (error) {
      if (processedImageUrl) this.imageService.delete(processedImageUrl);
      throw error;
    }

    if (data.imageUrl && data.imageUrl !== current.imageUrl) {
      this.imageService.delete(current.imageUrl);
    }

    return updated;
  }

  async reorder(ids: string[]) {
    await Promise.all(
      ids.map((id, index) =>
        this.prisma.landingBanner.update({
          where: { id },
          data: { displayOrder: index },
        }),
      ),
    );
    return this.findAll();
  }

  async delete(id: string) {
    const banner = await this.ensureExists(id);
    const deleted = await this.prisma.landingBanner.delete({ where: { id } });
    this.imageService.delete(banner.imageUrl);
    return deleted;
  }

  private async ensureExists(id: string) {
    const banner = await this.prisma.landingBanner.findUnique({ where: { id } });
    if (!banner) throw new NotFoundException('بنر یافت نشد');
    return banner;
  }
}
