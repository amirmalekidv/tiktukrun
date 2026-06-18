import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService }   from '../../../prisma/prisma.service';
import { GameImageService } from './game-image.service';
import { CreateGameDto, UpdateGameDto, WeeklyDiscountDto } from '../dto/create-game.dto';
import { parsePagination, buildPaginatedResponse } from '../../../common/helpers/pagination.helper';
import { UserRole } from '../../../common/interfaces/phase3-stubs.interface';
import { slugify } from '../../../common/helpers/slugify.helper';

/**
 * Map a numeric difficulty (legacy 1..5 from DTO) or string to the
 * GameDifficulty enum used by the MongoDB schema.
 */
const DIFFICULTY_BY_NUM = [
  'EASY',
  'EASY',
  'MEDIUM',
  'HARD',
  'VERY_HARD',
  'LEGENDARY',
] as const;
function mapDifficulty(value: number | string | undefined): any {
  if (value === undefined || value === null) return 'MEDIUM';
  if (typeof value === 'string') {
    const upper = value.toUpperCase();
    if (DIFFICULTY_BY_NUM.includes(upper as any)) return upper;
    return 'MEDIUM';
  }
  const idx = Math.max(0, Math.min(5, Math.round(value)));
  return DIFFICULTY_BY_NUM[idx] ?? 'MEDIUM';
}

@Injectable()
export class GamesAdminService {
  private readonly logger = new Logger(GamesAdminService.name);

  constructor(
    private prisma:      PrismaService,
    private imageService: GameImageService,
  ) {}

  async findAll(
    query: any,
    userRole: UserRole,
    userBranchId?: string,
  ) {
    const { skip, take, page, limit } = parsePagination(query);
    const where: any = {};

    if (userRole === UserRole.BRANCH_MANAGER && userBranchId) {
      where.branchId = userBranchId;
    }

    if (query.branchId)   where.branchId   = query.branchId;
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.isActive !== undefined) {
      where.isActive = query.isActive === 'true';
    }

    const [items, total] = await Promise.all([
      this.prisma.game.findMany({
        where,
        skip,
        take,
        include: { category: true, branch: { include: { city: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.game.count({ where }),
    ]);

    return buildPaginatedResponse(items, total, page, limit);
  }

  async findOne(id: string, userRole: UserRole, userBranchId?: string) {
    const game = await this.prisma.game.findUnique({
      where:   { id },
      include: {
        category: true,
        branch:   { include: { city: true } },
        images:   { orderBy: { displayOrder: 'asc' } },
        reviews:  { where: { isApproved: true } },
        _count:   { select: { bookings: true } },
      },
    });
    if (!game) throw new NotFoundException('بازی یافت نشد');

    if (userRole === UserRole.BRANCH_MANAGER && userBranchId !== game.branchId) {
      throw new NotFoundException('بازی یافت نشد');
    }

    // Stats
    const revenue = await this.prisma.payment.aggregate({
      where:  { booking: { gameId: id }, status: 'SUCCESS' },
      _sum:   { amount: true },
    });
    const avgRating = await this.prisma.review.aggregate({
      where:  { gameId: id, isApproved: true },
      _avg:   { rating: true },
    });

    return {
      ...game,
      stats: {
        totalBookings: game._count.bookings,
        totalRevenue:  (revenue._sum.amount ?? 0n).toString(),
        avgRating:     avgRating._avg.rating ?? 0,
      },
    };
  }

  async create(
    dto: CreateGameDto,
    files?: {
      cover?:   Express.Multer.File[];
      gallery?: Express.Multer.File[];
      teaser?:  Express.Multer.File[];
    },
  ) {
    const slug = slugify(dto.title) + '-' + Date.now();

    const game = await this.prisma.game.create({
      data: {
        title:                dto.title,
        subtitle:             dto.subtitle,
        slug,
        categoryId:           dto.categoryId,
        branchId:             dto.branchId,
        description:          dto.description ?? '',
        scenario:             dto.scenario,
        fearLevel:            dto.fearLevel ?? 0,
        difficulty:           mapDifficulty(dto.difficulty),
        tier:                 (dto.tier as any) ?? undefined,
        minPlayers:           dto.minPlayers,
        maxPlayers:           dto.maxPlayers,
        durationMinutes:      dto.durationMinutes,
        pricePerPerson:       Math.round(dto.pricePerPerson),
        tags:                 dto.tags ?? [],
        isFeatured:           dto.isFeatured ?? false,
        isActive:             dto.isActive ?? true,
        weeklyDiscountPercent: dto.weeklyDiscountPercent ?? 0,
      },
    });

    // Process cover
    if (files?.cover?.[0]) {
      const coverUrl = await this.imageService.processCover(files.cover[0], game.id);
      await this.prisma.game.update({
        where: { id: game.id },
        data:  { coverImage: coverUrl },
      });
    }

    // Process gallery
    if (files?.gallery?.length) {
      for (let i = 0; i < Math.min(files.gallery.length, 10); i++) {
        const processed = await this.imageService.processGalleryImage(
          files.gallery[i],
          game.id,
          i,
        );
        await this.prisma.gameImage.create({
          data: {
            gameId:       game.id,
            url:          processed.original,
            displayOrder: i,
          },
        });
      }
    }

    // Process teaser
    if (files?.teaser?.[0]) {
      const teaserUrl = await this.imageService.processTeaserVideo(files.teaser[0], game.id);
      await this.prisma.game.update({
        where: { id: game.id },
        data:  { teaserUrl },
      });
    }

    return this.findOne(game.id, UserRole.ADMIN);
  }

  async update(id: string, dto: UpdateGameDto) {
    const game = await this.prisma.game.findUnique({ where: { id } });
    if (!game) throw new NotFoundException('بازی یافت نشد');

    const data: any = { ...dto };
    // `genre` exists on the DTO but not on the MongoDB Game schema.
    delete data.genre;
    if (dto.pricePerPerson !== undefined) {
      data.pricePerPerson = Math.round(dto.pricePerPerson);
    }
    if (dto.difficulty !== undefined) {
      data.difficulty = mapDifficulty(dto.difficulty);
    }

    return this.prisma.game.update({ where: { id }, data });
  }

  async addImages(
    gameId: string,
    files: Express.Multer.File[],
  ) {
    const game = await this.prisma.game.findUnique({ where: { id: gameId } });
    if (!game) throw new NotFoundException('بازی یافت نشد');

    const existing = await this.prisma.gameImage.count({ where: { gameId } });
    const results: any[] = [];

    for (let i = 0; i < Math.min(files.length, 10 - existing); i++) {
      const processed = await this.imageService.processGalleryImage(files[i], gameId, existing + i);
      const img = await this.prisma.gameImage.create({
        data: {
          gameId,
          url:          processed.original,
          displayOrder: existing + i,
        },
      });
      results.push(img);
    }

    return results;
  }

  async deleteImage(gameId: string, imageId: string) {
    const img = await this.prisma.gameImage.findFirst({
      where: { id: imageId, gameId },
    });
    if (!img) throw new NotFoundException('تصویر یافت نشد');

    this.imageService.deleteFile(img.url);

    return this.prisma.gameImage.delete({ where: { id: imageId } });
  }

  async toggleFeatured(id: string) {
    const game = await this.prisma.game.findUnique({ where: { id } });
    if (!game) throw new NotFoundException('بازی یافت نشد');
    return this.prisma.game.update({
      where: { id },
      data:  { isFeatured: !game.isFeatured },
    });
  }

  /** تنظیم سطح‌بندی (tier) بازی: STANDARD/SILVER/GOLD/PLATINUM/DIAMOND */
  async setTier(id: string, tier: string) {
    const VALID = ['STANDARD', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'];
    const upper = (tier ?? '').toUpperCase();
    if (!VALID.includes(upper)) {
      throw new NotFoundException('سطح نامعتبر است');
    }
    const game = await this.prisma.game.findUnique({ where: { id } });
    if (!game) throw new NotFoundException('بازی یافت نشد');
    return this.prisma.game.update({
      where: { id },
      data:  { tier: upper as any },
    });
  }

  async toggleActive(id: string) {
    const game = await this.prisma.game.findUnique({ where: { id } });
    if (!game) throw new NotFoundException('بازی یافت نشد');
    return this.prisma.game.update({
      where: { id },
      data:  { isActive: !game.isActive },
    });
  }

  async softDelete(id: string) {
    const game = await this.prisma.game.findUnique({ where: { id } });
    if (!game) throw new NotFoundException('بازی یافت نشد');
    return this.prisma.game.update({ where: { id }, data: { isActive: false } });
  }

  async setWeeklyDiscount(id: string, dto: WeeklyDiscountDto) {
    const game = await this.prisma.game.findUnique({ where: { id } });
    if (!game) throw new NotFoundException('بازی یافت نشد');
    return this.prisma.game.update({
      where: { id },
      data:  { weeklyDiscountPercent: dto.percent },
    });
  }

  async recomputeRank(gameId: string) {
    const agg = await this.prisma.review.aggregate({
      where:  { gameId, isApproved: true },
      _avg:   { rating: true },
      _count: { rating: true },
    });

    const avgRating     = agg._avg.rating ?? 0;
    const reviewsCount  = agg._count.rating;

    // Wilson score — تقریبی
    const rank = reviewsCount > 0
      ? avgRating * Math.log(reviewsCount + 1)
      : 0;

    return this.prisma.game.update({
      where: { id: gameId },
      data:  { siteRank: avgRating, totalReviews: reviewsCount, userRankCached: rank },
    });
  }
}
