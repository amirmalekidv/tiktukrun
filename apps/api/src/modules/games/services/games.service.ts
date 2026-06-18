import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { GameQueryDto, GameSortBy } from '../dto/game-query.dto';
import { parsePagination, buildPaginatedResponse } from '../../../common/helpers/pagination.helper';
import { DateTime } from 'luxon';

// سلوت‌های روزانه: ساعت ۹ تا ۲۳ با فاصله ۱ ساعت
const SLOT_HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
const TEHRAN_TZ  = 'Asia/Tehran';

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

  constructor(private prisma: PrismaService) {}

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
      case GameSortBy.RATING:     return { userRankCached: { sort: 'desc', nulls: 'last' } };
      case GameSortBy.PRICE_ASC:  return { pricePerPerson: 'asc' };
      case GameSortBy.PRICE_DESC: return { pricePerPerson: 'desc' };
      case GameSortBy.POPULAR:
      default:                    return { siteRank: 'desc' };
    }
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

    return buildPaginatedResponse(items, total, page, limit);
  }

  // ─── Game by slug ─────────────────────────────────────────────────────────────
  async findBySlug(slug: string) {
    const game = await this.prisma.game.findFirst({
      where:   { slug, isActive: true },
      include: GAME_FULL_INCLUDE,
    });
    if (!game) throw new NotFoundException('بازی یافت نشد');

    // Similar games
    const similar = await this.prisma.game.findMany({
      where:   { categoryId: game.categoryId, isActive: true, NOT: { id: game.id } },
      take:    4,
      include: { images: { take: 1 }, category: true, branch: true },
    });

    return { ...game, similarGames: similar };
  }

  // ─── Featured hero ────────────────────────────────────────────────────────────
  async findFeaturedHero() {
    const game = await this.prisma.game.findFirst({
      where:   { isFeatured: true, isActive: true },
      orderBy: { updatedAt: 'desc' },
      include: GAME_PUBLIC_INCLUDE,
    });
    if (!game) throw new NotFoundException('بازی ویژه یافت نشد');
    return game;
  }

  // ─── By section ──────────────────────────────────────────────────────────────
  async findBySection(section: string) {
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
      'stories':            { isFeatured: true },
      'leaderboard':        {},
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
          return this.prisma.game.findMany({
            where:   { isActive: true },
            include: GAME_PUBLIC_INCLUDE,
            take: 10,
            orderBy,
          });
        }
        return this.prisma.game.findMany({
          where:   { id: { in: ids }, isActive: true },
          include: GAME_PUBLIC_INCLUDE,
        });
      } catch (e) {
        return this.prisma.game.findMany({
          where: { isActive: true },
          include: GAME_PUBLIC_INCLUDE,
          take: 10,
          orderBy,
        });
      }
    }

    return this.prisma.game.findMany({
      where:   { ...sectionWhere, isActive: true },
      take:    20,
      orderBy,
      include: GAME_PUBLIC_INCLUDE,
    });
  }

  // ─── Availability ─────────────────────────────────────────────────────────────
  async getAvailability(gameId: string, dateStr: string) {
    const gid = gameId;
    if (!Number.isFinite(gid)) throw new NotFoundException('بازی یافت نشد');
    const game = await this.prisma.game.findFirst({
      where: { id: gid, isActive: true },
    });
    if (!game) throw new NotFoundException('بازی یافت نشد');

    // خواندن maxConcurrent از Settings (default 1)
    const maxConcurrent = 1;

    // تبدیل تاریخ ISO
    const dayStart = DateTime.fromISO(dateStr, { zone: TEHRAN_TZ }).startOf('day');
    const dayEnd   = dayStart.endOf('day');

    // رزروهای موجود آن روز
    const existingBookings = await this.prisma.booking.findMany({
      where: {
        gameId: gid,
        slotDateTime: {
          gte: dayStart.toJSDate(),
          lte: dayEnd.toJSDate(),
        },
        status: { in: ['PENDING' as any, 'CONFIRMED' as any] },
      },
      select: { slotDateTime: true, playersCount: true, status: true },
    });

    const slots = SLOT_HOURS.map((hour) => {
      const slotTime   = dayStart.set({ hour, minute: 0, second: 0, millisecond: 0 });
      const slotJSDate = slotTime.toJSDate();

      const bookingsInSlot = existingBookings.filter(
        (b) => Math.abs(b.slotDateTime.getTime() - slotJSDate.getTime()) < 1000,
      );

      const bookedCount = bookingsInSlot.length;
      // مقایسه با timezone یکسان (Asia/Tehran)
      const available   = bookedCount < maxConcurrent && slotTime > DateTime.now().setZone(TEHRAN_TZ);

      return {
        slotDateTime:  slotJSDate.toISOString(),
        hour,
        available,
        bookedCount,
        remainingSlots: Math.max(0, maxConcurrent - bookedCount),
      };
    });

    return { gameId, date: dateStr, slots };
  }
}
