import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import {
  CreateLandingSectionDto,
  UpdateLandingSectionDto,
} from './dto/landing-section.dto';
import { LandingSectionFilterType } from '@prisma/client';
import {
  attachAvailableSlotCounts,
  getAvailabilityDayStart,
} from '../games/utils/availability';

const GAME_PUBLIC_INCLUDE = {
  category: true,
  branch: { include: { city: true } },
  images: { take: 3, orderBy: { displayOrder: 'asc' as const } },
};

@Injectable()
export class LandingSectionsService {
  constructor(
    private prisma: PrismaService,
    private settings: SettingsService,
  ) {}

  private async getMaxConcurrent() {
    return Math.max(
      1,
      Number(await this.settings.get('booking.maxConcurrent', '1')) || 1,
    );
  }

  private async withAvailableSlots<T extends { id: string; durationMinutes: number }>(games: T[]) {
    if (games.length === 0) return [];

    const dayStart = getAvailabilityDayStart();
    const gameIds = [...new Set(games.map((game) => game.id))];
    const [maxConcurrent, existingBookings] = await Promise.all([
      this.getMaxConcurrent(),
      this.prisma.booking.findMany({
        where: {
          gameId: { in: gameIds },
          slotDateTime: {
            gte: dayStart.toJSDate(),
            lte: dayStart.endOf('day').toJSDate(),
          },
          status: { in: ['PENDING' as any, 'CONFIRMED' as any] },
        },
        select: { gameId: true, slotDateTime: true },
      }),
    ]);

    return attachAvailableSlotCounts(games, existingBookings, maxConcurrent, dayStart);
  }

  async findAllActive() {
    return this.prisma.landingSection.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async findAll() {
    return this.prisma.landingSection.findMany({
      orderBy: { displayOrder: 'asc' },
      include: {
        manualGames: {
          orderBy: { displayOrder: 'asc' },
          include: { game: { select: { id: true, title: true, slug: true } } },
        },
      },
    });
  }

  async findByKey(key: string) {
    const section = await this.prisma.landingSection.findUnique({ where: { key } });
    if (!section) throw new NotFoundException('سکشن یافت نشد');
    return section;
  }

  async findActiveWithGames() {
    const sections = await this.findAllActive();
    return Promise.all(
      sections.map(async (section) => ({
        ...section,
        games: await this.resolveGames(section),
      })),
    );
  }

  async findGamesByKey(key: string) {
    const section = await this.prisma.landingSection.findUnique({ where: { key } });
    if (!section || !section.isActive) {
      throw new BadRequestException('سکشن نامعتبر است');
    }
    return this.resolveGames(section);
  }

  async resolveGames(section: {
    id: string;
    filterType: LandingSectionFilterType;
    categorySlug?: string | null;
    categorySlugs?: string[];
    citySlug?: string | null;
    tagFilter?: string | null;
  }) {
    if (section.filterType === LandingSectionFilterType.MANUAL) {
      const links = await this.prisma.landingSectionGame.findMany({
        where: { sectionId: section.id },
        orderBy: { displayOrder: 'asc' },
        include: { game: { include: GAME_PUBLIC_INCLUDE } },
      });
      const games = links
        .map((l) => l.game)
        .filter((g) => g.isActive);
      return this.withAvailableSlots(games);
    }

    if (section.filterType === LandingSectionFilterType.POPULAR_THIS_WEEK) {
      return this.findPopularThisWeek();
    }

    const where: Record<string, unknown> = { isActive: true };

    switch (section.filterType) {
      case LandingSectionFilterType.WEEKLY_DISCOUNT:
        where.weeklyDiscountPercent = { gt: 0 };
        break;
      case LandingSectionFilterType.FEATURED:
        where.isFeatured = true;
        break;
      case LandingSectionFilterType.CATEGORY:
        if (!section.categorySlug) throw new BadRequestException('categorySlug الزامی است');
        where.category = { slug: section.categorySlug };
        break;
      case LandingSectionFilterType.CATEGORY_CITY:
        if (!section.categorySlug || !section.citySlug) {
          throw new BadRequestException('categorySlug و citySlug الزامی هستند');
        }
        where.category = { slug: section.categorySlug };
        where.branch = { city: { slug: section.citySlug } };
        break;
      case LandingSectionFilterType.MULTI_CATEGORY:
        if (!section.categorySlugs?.length) {
          throw new BadRequestException('categorySlugs الزامی است');
        }
        where.category = { slug: { in: section.categorySlugs } };
        break;
      default:
        throw new BadRequestException('نوع فیلتر نامعتبر است');
    }

    if (section.tagFilter === 'horror') {
      where.tags = { has: 'ترسناک' };
    } else if (section.tagFilter === 'non-horror') {
      where.NOT = { tags: { has: 'ترسناک' } };
    }

    const games = await this.prisma.game.findMany({
      where,
      take: 20,
      orderBy: { siteRank: 'desc' },
      include: GAME_PUBLIC_INCLUDE,
    });
    return this.withAvailableSlots(games);
  }

  private async findPopularThisWeek() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    const orderBy = { siteRank: 'desc' as const };

    try {
      const topGameIds = await (this.prisma.booking as any).groupBy({
        by: ['gameId'],
        where: {
          createdAt: { gte: sevenDaysAgo },
          status: { in: ['CONFIRMED', 'COMPLETED'] },
        },
        _count: { id: true },
        orderBy: { _count: { gameId: 'desc' } },
        take: 20,
      });
      const ids = topGameIds.map((g: { gameId: string }) => g.gameId);
      if (ids.length === 0) {
        const games = await this.prisma.game.findMany({
          where: { isActive: true },
          include: GAME_PUBLIC_INCLUDE,
          take: 20,
          orderBy,
        });
        return this.withAvailableSlots(games);
      }
      const games = await this.prisma.game.findMany({
        where: { id: { in: ids }, isActive: true },
        include: GAME_PUBLIC_INCLUDE,
      });
      return this.withAvailableSlots(games);
    } catch {
      const games = await this.prisma.game.findMany({
        where: { isActive: true },
        include: GAME_PUBLIC_INCLUDE,
        take: 20,
        orderBy,
      });
      return this.withAvailableSlots(games);
    }
  }

  async create(dto: CreateLandingSectionDto) {
    const exists = await this.prisma.landingSection.findUnique({ where: { key: dto.key } });
    if (exists) throw new ConflictException('کلید سکشن تکراری است');

    return this.prisma.landingSection.create({
      data: {
        key: dto.key,
        title: dto.title,
        description: dto.description,
        icon: dto.icon ?? 'fas fa-star',
        displayOrder: dto.displayOrder ?? 0,
        isActive: dto.isActive ?? true,
        filterType: dto.filterType,
        categorySlug: dto.categorySlug,
        categorySlugs: dto.categorySlugs ?? [],
        citySlug: dto.citySlug,
        tagFilter: dto.tagFilter,
      },
    });
  }

  async update(id: string, dto: UpdateLandingSectionDto) {
    await this.ensureExists(id);
    return this.prisma.landingSection.update({
      where: { id },
      data: dto as any,
    });
  }

  async setManualGames(id: string, gameIds: string[]) {
    const section = await this.ensureExists(id);
    if (section.filterType !== LandingSectionFilterType.MANUAL) {
      throw new BadRequestException('فقط سکشن‌های دستی قابل انتخاب بازی هستند');
    }

    await this.prisma.landingSectionGame.deleteMany({ where: { sectionId: id } });
    if (gameIds.length === 0) return { count: 0 };

    await this.prisma.landingSectionGame.createMany({
      data: gameIds.map((gameId, index) => ({
        sectionId: id,
        gameId,
        displayOrder: index,
      })),
    });

    return { count: gameIds.length };
  }

  private async ensureExists(id: string) {
    const section = await this.prisma.landingSection.findUnique({ where: { id } });
    if (!section) throw new NotFoundException('سکشن یافت نشد');
    return section;
  }
}
