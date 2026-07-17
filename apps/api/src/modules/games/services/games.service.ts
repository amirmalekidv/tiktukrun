import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { GameQueryDto, GameSortBy } from '../dto/game-query.dto';
import { parsePagination, buildPaginatedResponse } from '../../../common/helpers/pagination.helper';
import { SettingsService } from '../../settings/settings.service';
import { LandingSectionsService } from '../../landing-sections/landing-sections.service';
import {
  attachAvailableSlotCounts,
  buildAvailabilitySlots,
  getAvailabilityDayStart,
} from '../utils/availability';

const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;

const GAME_PUBLIC_INCLUDE = {
  category: true,
  branch:   { include: { city: true } },
  images:   { take: 3, orderBy: { displayOrder: 'asc' as const } },
};

const GAME_FULL_INCLUDE = {
  category: true,
  branch:   { include: { city: true } },
  images:   { orderBy: { displayOrder: 'asc' as const } },
  reviews: {
    where:   { isApproved: true },
    take:    10,
    orderBy: { createdAt: 'desc' as const },
    include: { user: { select: { id: true, fullName: true, avatarUrl: true } } },
  },
};

@Injectable()
export class GamesService {
  private readonly logger = new Logger(GamesService.name);

  constructor(
    private prisma: PrismaService,
    private settings: SettingsService,
    private landingSections: LandingSectionsService,
  ) {}

  // ─── Build Prisma where ──────────────────────────────────────────────────────
  private buildWhere(q: GameQueryDto, adminMode = false): any {
    // adminMode=true → نمایش همه بازی‌ها؛ adminMode=false → فقط فعال
    const where: any = {};
    if (!adminMode) where.isActive = true;

    if (q.branchId)     where.branchId     = q.branchId;
    if (q.categoryId)   where.categoryId   = q.categoryId;
    if (q.featured)     where.isFeatured   = true;
    if (q.weeklyDiscount) where.weeklyDiscountPercent = { gt: 0 };

    // categorySlug و cityId هر دو به relation برمی‌گردند — باید جداگانه مدیریت شوند
    if (q.categorySlug) where.category = { slug: q.categorySlug };
    if (q.cityId) {
      // اگر categorySlug هم باشد، branch را مجزا نگه دار (conflict با category نیست)
      where.branch = { ...(where.branch ?? {}), cityId: q.cityId };
    }

    if (q.minFear !== undefined || q.maxFear !== undefined) {
      where.fearLevel = {};
      if (q.minFear !== undefined) where.fearLevel.gte = q.minFear;
      if (q.maxFear !== undefined) where.fearLevel.lte = q.maxFear;
    }

    if (q.minPrice !== undefined || q.maxPrice !== undefined) {
      where.pricePerPerson = {};
      // pricePerPerson در Prisma از نوع BigInt است — باید BigInt ارسال شود
      if (q.minPrice !== undefined) where.pricePerPerson.gte = BigInt(Math.round(q.minPrice));
      if (q.maxPrice !== undefined) where.pricePerPerson.lte = BigInt(Math.round(q.maxPrice));
    }

    if (q.minPlayers !== undefined) where.maxPlayers = { gte: q.minPlayers };
    if (q.maxPlayers !== undefined) where.minPlayers  = { lte: q.maxPlayers };

    if (q.tags) {
      const tagArr = q.tags.split(',').map((t) => t.trim()).filter(Boolean);
      if (tagArr.length) where.tags = { hasSome: tagArr };
    }

    if (q.q) {
      where.OR = [
        { title:       { contains: q.q, mode: 'insensitive' } },
        { subtitle:    { contains: q.q, mode: 'insensitive' } },
        { description: { contains: q.q, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private buildOrderBy(sortBy?: GameSortBy): any {
    // [QA Fix 2026-05-25] فیلدهای moved: averageRating→userRankCached, totalBookings→siteRank
    // Game model در schema فعلی این فیلدها رو نداره
    switch (sortBy) {
      case GameSortBy.NEWEST:     return { createdAt: 'desc' };
      case GameSortBy.RATING:     return { siteRank: 'desc' };
      case GameSortBy.PRICE_ASC:  return { pricePerPerson: 'asc' };
      case GameSortBy.PRICE_DESC: return { pricePerPerson: 'desc' };
      case GameSortBy.POPULAR:
      default:                    return { siteRank: 'desc' };
    }
  }

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

  // ─── Public findMany ─────────────────────────────────────────────────────────
  async findMany(query: GameQueryDto) {
    const { skip, take, page, limit } = parsePagination(query);
    const where   = this.buildWhere(query);
    const orderBy = this.buildOrderBy(query.sortBy);

    const [items, total] = await Promise.all([
      this.prisma.game.findMany({
        where,
        orderBy,
        skip,
        take,
        include: GAME_PUBLIC_INCLUDE,
      }),
      this.prisma.game.count({ where }),
    ]);

    return buildPaginatedResponse(
      await this.withAvailableSlots(items),
      total,
      page,
      limit,
    );
  }

  // ─── Game by slug ─────────────────────────────────────────────────────────────
  async findBySlug(slug: string) {
    const where = OBJECT_ID_REGEX.test(slug)
      ? { isActive: true, OR: [{ slug }, { id: slug }] }
      : { slug, isActive: true };

    const game = await this.prisma.game.findFirst({
      where,
      include: GAME_FULL_INCLUDE,
    });
    if (!game) throw new NotFoundException('بازی یافت نشد');

    // Similar games
    const similar = await this.prisma.game.findMany({
      where:   { categoryId: game.categoryId, isActive: true, NOT: { id: game.id } },
      take:    4,
      include: { images: { take: 1 }, category: true, branch: true },
    });

    const [gameWithSlots] = await this.withAvailableSlots([game]);
    const similarWithSlots = await this.withAvailableSlots(similar);

    return { ...gameWithSlots, similarGames: similarWithSlots };
  }

  // ─── Featured hero ────────────────────────────────────────────────────────────
  async findFeaturedHero() {
    const game = await this.prisma.game.findFirst({
      where:   { isFeatured: true, isActive: true },
      orderBy: { updatedAt: 'desc' },
      include: GAME_PUBLIC_INCLUDE,
    });
    if (!game) throw new NotFoundException('بازی ویژه یافت نشد');
    const [gameWithSlots] = await this.withAvailableSlots([game]);
    return gameWithSlots;
  }

  // ─── By section ──────────────────────────────────────────────────────────────
  async findBySection(section: string) {
    const dbSection = await this.prisma.landingSection.findUnique({
      where: { key: section },
    });
    if (dbSection?.isActive) {
      return this.landingSections.resolveGames(dbSection);
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);

    const sectionWhereMap: Record<string, any> = {
      'weekly-discount':    { weeklyDiscountPercent: { gt: 0 } },
      'cinema-horror':      { category: { slug: 'cinema-horror' } },
      'board-games':        { category: { slug: 'board-games' } },
      'board-game':         { category: { slug: 'board-games' } },
      'mafia':              { category: { slug: 'mafia' } },
      'lasertag':           { category: { slug: 'lasertag' } },
      'laser-tag':          { category: { slug: 'lasertag' } },
      'vr':                 { category: { slug: 'vr' } },
      'paintball':          { category: { slug: 'paintball' } },
      'tehran':             { branch:   { city: { slug: 'tehran' } } },
      'karaj':              { branch:   { city: { slug: 'karaj' } } },
      // [QA Fix 2026-05-25] فیلد genre حذف شده، از tag-based filtering استفاده می‌کنیم
      'horror':             { tags: { has: 'ترسناک' } },
      'non-horror':         { NOT: { tags: { has: 'ترسناک' } } },
      'featured':           { isFeatured: true },
      'popular-this-week':  {},
    };

    const sectionWhere = sectionWhereMap[section];
    if (!sectionWhere) throw new BadRequestException('سکشن نامعتبر است');

    // Game has no `totalBookings` scalar — use siteRank as the safest sort.
    const orderBy: any = { siteRank: 'desc' };

    if (section === 'popular-this-week') {
      // واقعی‌ترین حالت: بر اساس bookings در ۷ روز اخیر
      try {
        const topGameIds = await (this.prisma.booking as any).groupBy({
          by:      ['gameId'],
          where:   { createdAt: { gte: sevenDaysAgo }, status: { in: ['CONFIRMED' as any, 'COMPLETED' as any] } },
          _count:  { id: true },
          orderBy: { _count: { gameId: 'desc' } } as any,
          take:    10,
        });
        const ids = topGameIds.map((g: any) => g.gameId);
        if (ids.length === 0) {
          const games = await this.prisma.game.findMany({
            where:   { isActive: true },
            include: GAME_PUBLIC_INCLUDE,
            take: 10,
            orderBy,
          });
          return this.withAvailableSlots(games);
        }
        const games = await this.prisma.game.findMany({
          where:   { id: { in: ids }, isActive: true },
          include: GAME_PUBLIC_INCLUDE,
        });
        return this.withAvailableSlots(games);
      } catch (e) {
        const games = await this.prisma.game.findMany({
          where: { isActive: true },
          include: GAME_PUBLIC_INCLUDE,
          take: 10,
          orderBy,
        });
        return this.withAvailableSlots(games);
      }
    }

    const games = await this.prisma.game.findMany({
      where:   { ...sectionWhere, isActive: true },
      take:    20,
      orderBy,
      include: GAME_PUBLIC_INCLUDE,
    });
    return this.withAvailableSlots(games);
  }

  // ─── Availability ─────────────────────────────────────────────────────────────
  async getAvailability(gameId: string, dateStr: string) {
    const game = await this.prisma.game.findFirst({
      where: { id: gameId, isActive: true },
    });
    if (!game) throw new NotFoundException('بازی یافت نشد');

    const dayStart = getAvailabilityDayStart(dateStr);
    if (!dayStart.isValid) {
      throw new BadRequestException('تاریخ نامعتبر است');
    }
    const dayEnd   = dayStart.endOf('day');
    const maxConcurrent = await this.getMaxConcurrent();

    // رزروهای موجود آن روز
    const existingBookings = await this.prisma.booking.findMany({
      where: {
        gameId,
        slotDateTime: {
          gte: dayStart.toJSDate(),
          lte: dayEnd.toJSDate(),
        },
        status: { in: ['PENDING' as any, 'CONFIRMED' as any] },
      },
      select: { slotDateTime: true },
    });

    const slots = buildAvailabilitySlots(game, existingBookings, maxConcurrent, dayStart);

    return {
      gameId,
      date: dateStr,
      slots,
    };
  }
}
