import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER }              from '@nestjs/cache-manager';
import { Cache }                      from 'cache-manager';
import { PrismaService }              from '../../prisma/prisma.service';

const CACHE_TTL = 3600; // 1 hour (seconds)

@Injectable()
export class TopService {
  private readonly logger = new Logger(TopService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {}

  // ─── Top Games ─────────────────────────────────────────────────────────────
  async topGames(period: 'week' | 'month' | 'all', limit = 10) {
    const cacheKey = `top:games:${period}:${limit}`;

    const cached = await this.cache.get<any[]>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit: ${cacheKey}`);
      return cached;
    }

    const since = this.getPeriodStart(period);

    // محاسبه تعداد bookings در بازه + میانگین rating
    const bookingCounts = await this.prisma.booking.groupBy({
      by:      ['gameId'],
      where: {
        status:    { in: ['CONFIRMED', 'COMPLETED'] },
        ...(since ? { createdAt: { gte: since } } : {}),
      },
      _count:  { id: true },
      orderBy: { _count: { id: 'desc' } },
      take:    limit,
    });

    const gameIds = bookingCounts.map((b) => b.gameId);
    const games   = await this.prisma.game.findMany({
      where:   { id: { in: gameIds }, isActive: true },
      include: {
        images:   { take: 1 },
        category: true,
        branch:   { include: { city: true } },
      },
    });

    // ترتیب‌دهی بر اساس bookingCounts
    const countMap = new Map(bookingCounts.map((b) => [b.gameId, b._count.id]));
    const ranked   = games
      .map((g) => ({ ...g, periodBookings: countMap.get(g.id) ?? 0 }))
      .sort((a, b) => b.periodBookings - a.periodBookings);

    await this.cache.set(cacheKey, ranked, CACHE_TTL);
    return ranked;
  }

  // ─── Top Players ───────────────────────────────────────────────────────────
  async topPlayers(period: 'week' | 'month' | 'all', limit = 10) {
    const cacheKey = `top:players:${period}:${limit}`;

    const cached = await this.cache.get<any[]>(cacheKey);
    if (cached) return cached;

    const since = this.getPeriodStart(period);

    // بر اساس XP کسب‌شده (از PlayerRating در بازه یا کل XP در profile)
    const players = await this.prisma.userProfile.findMany({
      take:    limit,
      orderBy: { xp: 'desc' },
      include: {
        user: {
          select: { id: true, fullName: true, avatarUrl: true, mobile: true },
        },
      },
    });

    const result = players.map((p, i) => ({
      rank:      i + 1,
      userId:    p.userId,
      name:      p.user?.fullName ?? 'ناشناس',
      avatarUrl: p.user?.avatarUrl,
      xp:        p.xp,
      level:     p.levelId,
      totalBookings: p.totalBookings,
    }));

    await this.cache.set(cacheKey, result, CACHE_TTL);
    return result;
  }

  // ─── Top Teams ─────────────────────────────────────────────────────────────
  async topTeams(period: 'week' | 'month' | 'all', limit = 10) {
    const cacheKey = `top:teams:${period}:${limit}`;
    const cached = await this.cache.get<any[]>(cacheKey);
    if (cached) return cached;

    // stub: teams می‌توانند در فاز بعدی پیاده‌سازی شوند
    // فعلاً بر اساس totalSpent گروه‌بندی
    const topSpenders = await this.prisma.userProfile.findMany({
      take:    limit,
      orderBy: { totalSpent: 'desc' },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });

    const result = topSpenders.map((p, i) => ({
      rank:       i + 1,
      userId:     p.userId,
      name:       p.user?.fullName ?? 'ناشناس',
      totalSpent: p.totalSpent?.toString() ?? '0',
      totalBookings: p.totalBookings,
    }));

    await this.cache.set(cacheKey, result, CACHE_TTL);
    return result;
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────
  private getPeriodStart(period: string): Date | null {
    if (period === 'week')  return new Date(Date.now() - 7  * 24 * 3600 * 1000);
    if (period === 'month') return new Date(Date.now() - 30 * 24 * 3600 * 1000);
    return null;
  }
}
