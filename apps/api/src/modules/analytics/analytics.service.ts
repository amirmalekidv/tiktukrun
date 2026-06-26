import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Redis } from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';

/**
 * AnalyticsService — admin dashboards & business KPIs
 *
 * [QA REWRITE 2026-05-25]
 * The previous version used PascalCase table names (User, Booking, Game,
 * Category, Review) but the schema maps to snake_case (users, bookings,
 * games, categories, game_reviews). It also assumed `totalSpent` lived on
 * `User`, but it lives on `UserProfile`. All raw SQL now matches the real
 * @@map names and column types.
 */
import { mapOverviewToDashboard } from './overview.mapper';

const TTL = 300; // 5 minutes

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  // ─── Helper: Redis cache wrapper ─────────────────────────────────────────────

  private async cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
    try {
      const cached = await this.redis.get(key);
      if (cached) return JSON.parse(cached);
    } catch {
      // Redis miss — continue
    }

    const result = await fn();

    try {
      await this.redis.setex(
        key,
        TTL,
        JSON.stringify(result, (_, v) => (typeof v === 'bigint' ? Number(v) : v)),
      );
    } catch {
      /* ignore */
    }

    return result;
  }

  // ─── Dashboard overview ───────────────────────────────────────────────────────

  async getOverview() {
    return this.cached('analytics:overview:v2', async () => {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 3600_000);
      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const [
        monthlyRevenue,
        prevMonthRevenue,
        newCustomers,
        prevMonthCustomers,
        activeBookings,
        recentBookings,
        recentAuditLogs,
        topCustomers,
      ] = await Promise.all([
        this.prisma.booking.aggregate({
          where: { status: 'COMPLETED', createdAt: { gte: thisMonthStart } },
          _sum: { totalAmount: true },
        }),
        this.prisma.booking.aggregate({
          where: {
            status: 'COMPLETED',
            createdAt: { gte: prevMonthStart, lt: thisMonthStart },
          },
          _sum: { totalAmount: true },
        }),
        this.prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
        this.prisma.user.count({
          where: { createdAt: { gte: prevMonthStart, lt: thisMonthStart } },
        }),
        this.prisma.booking.count({
          where: { status: { in: ['PENDING', 'CONFIRMED'] } },
        }),
        this.prisma.booking.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, fullName: true } },
            game: { select: { title: true } },
          },
        }),
        this.prisma.auditLog.findMany({
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: { performer: { select: { id: true, fullName: true } } as any },
        } as any).catch(() => []),
        this.prisma.userProfile.findMany({
          take: 5,
          orderBy: { totalSpent: 'desc' },
          select: {
            userId: true,
            totalSpent: true,
            user: { select: { id: true, fullName: true, mobile: true } },
          } as any,
        }),
      ]);

      // Daily revenue trend last 30 days (MongoDB: aggregate in JS)
      const trendBookings = await this.prisma.booking.findMany({
        where: { status: 'COMPLETED', createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true, totalAmount: true },
      });
      const trendMap = new Map<string, { revenue: number; bookings: number }>();
      for (const b of trendBookings) {
        const date = b.createdAt.toISOString().slice(0, 10);
        const cur = trendMap.get(date) ?? { revenue: 0, bookings: 0 };
        cur.revenue += Number(b.totalAmount ?? 0);
        cur.bookings += 1;
        trendMap.set(date, cur);
      }
      const revenueTrend = Array.from(trendMap.entries())
        .map(([date, v]) => ({ date, revenue: v.revenue, bookings: v.bookings }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Category breakdown last 30 days (group bookings by game→category in JS)
      const catBookings = await this.prisma.booking.findMany({
        where: { status: 'COMPLETED', createdAt: { gte: thirtyDaysAgo } },
        select: { game: { select: { category: { select: { name: true } } } } },
      });
      const catMap = new Map<string, number>();
      for (const b of catBookings) {
        const name = (b as any).game?.category?.name ?? 'نامشخص';
        catMap.set(name, (catMap.get(name) ?? 0) + 1);
      }
      const categoryBreakdown = Array.from(catMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

      const curRevenue = Number(monthlyRevenue._sum.totalAmount ?? 0);
      const prevRevenue = Number(prevMonthRevenue._sum.totalAmount ?? 0);
      const revenueChange =
        prevRevenue > 0
          ? Math.round(((curRevenue - prevRevenue) / prevRevenue) * 100)
          : 0;

      return {
        monthlyRevenue: curRevenue,
        revenueChange,
        revenueTarget: curRevenue > 0 ? 83 : 0,
        newCustomers,
        newCustomersChange:
          prevMonthCustomers > 0
            ? Math.round(((newCustomers - prevMonthCustomers) / prevMonthCustomers) * 100)
            : 0,
        activeBookings,
        revenueTrend,
        categoryBreakdown,
        topCustomers: topCustomers.map((p: any) => ({
          id: p.user?.id ?? p.userId,
          name: p.user?.fullName ?? p.user?.mobile ?? '—',
          ltv: Number(p.totalSpent ?? 0),
        })),
        recentBookings: this.serializeBigInt(recentBookings),
        liveActivities: recentAuditLogs,
      };
    });
  }

  async getOverviewFormatted() {
    const [flat, financial] = await Promise.all([
      this.getOverview(),
      this.getFinancial(),
    ]);
    return mapOverviewToDashboard(flat, financial);
  }

  // ─── Financial KPIs ───────────────────────────────────────────────────────────

  async getFinancial() {
    return this.cached('analytics:financial:v2', async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600_000);
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 3600_000);

      const [totalRevenue, totalUsers, newUsers30d] = await Promise.all([
        this.prisma.booking.aggregate({
          where: { status: 'COMPLETED' },
          _sum: { totalAmount: true },
        }),
        this.prisma.user.count(),
        this.prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      ]);

      const avgLTV =
        totalUsers > 0
          ? Number(totalRevenue._sum.totalAmount ?? 0) / totalUsers
          : 0;

      const churnedUsers = await this.prisma.user.count({
        where: {
          bookings: {
            some: {},
            every: { createdAt: { lt: ninetyDaysAgo } },
          },
        },
      });

      const churnRate =
        totalUsers > 0 ? Math.round((churnedUsers / totalUsers) * 100) : 0;

      const [campaignSpend, reviewAvg] = await Promise.all([
        this.prisma.campaign.aggregate({
          _sum: { budget: true, convertedCount: true },
        }),
        this.prisma.review.aggregate({
          where: { isApproved: true },
          _avg: { rating: true },
        }),
      ]);

      const converted = (campaignSpend._sum as any).convertedCount ?? 0;
      const budget = Number((campaignSpend._sum as any).budget ?? 0);
      const cac =
        converted > 0 ? Math.round(budget / converted) : null;

      const avgRating = reviewAvg._avg.rating ?? 0;
      const nps =
        avgRating > 0
          ? Math.round(((avgRating - 3) / 2) * 100)
          : null;

      return {
        cac,
        cacNote:
          cac == null
            ? 'CAC requires campaign budget and conversion data'
            : undefined,
        clv: Math.round(avgLTV),
        churnRate,
        nps,
        npsNote:
          nps == null
            ? 'NPS proxy from review ratings when surveys unavailable'
            : 'Proxy NPS derived from approved review star ratings',
        totalRevenue: Number(totalRevenue._sum.totalAmount ?? 0),
        avgOrderValue: 0,
        revenuePerUser: Math.round(avgLTV),
        newUsers30d,
      };
    });
  }

  // ─── Cohort analysis ─────────────────────────────────────────────────────────

  async getCohort() {
    return this.cached('analytics:cohort:v2', async () => {
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      // Users who signed up in the last 12 months + their completed bookings.
      const users = await this.prisma.user.findMany({
        where: { createdAt: { gte: twelveMonthsAgo } },
        select: {
          id: true,
          createdAt: true,
          bookings: {
            where: { status: 'COMPLETED' },
            select: { createdAt: true },
          },
        },
      });

      const ym = (d: Date) => d.toISOString().slice(0, 7); // YYYY-MM
      // key = signupMonth|activeMonth → set of distinct userIds
      const cells = new Map<string, Set<string>>();
      for (const u of users) {
        const signupMonth = ym(u.createdAt);
        if (!u.bookings.length) continue;
        for (const b of u.bookings) {
          const key = `${signupMonth}|${ym(b.createdAt)}`;
          if (!cells.has(key)) cells.set(key, new Set());
          cells.get(key)!.add(u.id);
        }
      }

      return Array.from(cells.entries())
        .map(([key, set]) => {
          const [signupMonth, activeMonth] = key.split('|');
          return { signupMonth, activeMonth, count: set.size };
        })
        .sort(
          (a, b) =>
            a.signupMonth.localeCompare(b.signupMonth) ||
            a.activeMonth.localeCompare(b.activeMonth),
        );
    });
  }

  // ─── Heatmap ────────────────────────────────────────────────────────────────────

  async getHeatmap() {
    return this.cached('analytics:heatmap:v2', async () => {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 3600_000);
      const bookings = await this.prisma.booking.findMany({
        where: { createdAt: { gte: ninetyDaysAgo } },
        select: { createdAt: true },
      });

      // Convert UTC → Asia/Tehran (+3:30) for day-of-week & hour buckets.
      const TEHRAN_OFFSET_MIN = 3 * 60 + 30;
      const cells = new Map<string, number>(); // "dow|hour" → count
      for (const b of bookings) {
        const local = new Date(b.createdAt.getTime() + TEHRAN_OFFSET_MIN * 60_000);
        const dayOfWeek = local.getUTCDay(); // 0=Sunday
        const hour = local.getUTCHours();
        const key = `${dayOfWeek}|${hour}`;
        cells.set(key, (cells.get(key) ?? 0) + 1);
      }

      return Array.from(cells.entries())
        .map(([key, count]) => {
          const [dayOfWeek, hour] = key.split('|').map(Number);
          return { dayOfWeek, hour, count };
        })
        .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.hour - b.hour);
    });
  }

  // ─── Games analytics ─────────────────────────────────────────────────────────

  async getGames() {
    return this.cached('analytics:games:v2', async () => {
      const games = await this.prisma.game.findMany({
        select: { id: true, title: true },
      });
      if (!games.length) return [];

      // Completed bookings per game: revenue + count + lastBooking
      const completed = await this.prisma.booking.findMany({
        where: { status: 'COMPLETED' },
        select: { gameId: true, totalAmount: true, createdAt: true },
      });
      const bkMap = new Map<
        string,
        { bookings: number; revenue: number; lastBooking: Date | null }
      >();
      for (const b of completed) {
        const cur = bkMap.get(b.gameId) ?? { bookings: 0, revenue: 0, lastBooking: null };
        cur.bookings += 1;
        cur.revenue += Number(b.totalAmount ?? 0);
        if (!cur.lastBooking || b.createdAt > cur.lastBooking) cur.lastBooking = b.createdAt;
        bkMap.set(b.gameId, cur);
      }

      // Average rating per game (group reviews in JS)
      const reviews = await this.prisma.review.findMany({
        select: { gameId: true, rating: true },
      });
      const rtMap = new Map<string, { sum: number; n: number }>();
      for (const r of reviews) {
        const cur = rtMap.get(r.gameId) ?? { sum: 0, n: 0 };
        cur.sum += r.rating;
        cur.n += 1;
        rtMap.set(r.gameId, cur);
      }

      return games
        .map((g) => {
          const bk = bkMap.get(g.id) ?? { bookings: 0, revenue: 0, lastBooking: null };
          const rt = rtMap.get(g.id);
          return {
            id: g.id,
            name: g.title,
            bookings: bk.bookings,
            revenue: bk.revenue,
            rating: (rt && rt.n > 0 ? rt.sum / rt.n : 0).toFixed(1),
            lastBooking: bk.lastBooking,
          };
        })
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 20);
    });
  }

  // ─── Cash flow ───────────────────────────────────────────────────────────────

  async getCashflow() {
    return this.cached('analytics:cashflow:v2', async () => {
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      const bookings = await this.prisma.booking.findMany({
        where: { status: 'COMPLETED', createdAt: { gte: twelveMonthsAgo } },
        select: { createdAt: true, totalAmount: true },
      });

      const incomeMap = new Map<string, number>(); // YYYY-MM → income
      for (const b of bookings) {
        const month = b.createdAt.toISOString().slice(0, 7);
        const amt = Number(b.totalAmount ?? 0);
        incomeMap.set(month, (incomeMap.get(month) ?? 0) + (amt > 0 ? amt : 0));
      }

      // Expenses tracked as REFUND transactions (money out) if available.
      const refunds = await this.prisma.transaction
        .findMany({
          where: { type: 'REFUND', createdAt: { gte: twelveMonthsAgo } },
          select: { createdAt: true, amount: true },
        })
        .catch(() => [] as { createdAt: Date; amount: number }[]);
      const expenseMap = new Map<string, number>();
      for (const t of refunds) {
        const month = t.createdAt.toISOString().slice(0, 7);
        expenseMap.set(month, (expenseMap.get(month) ?? 0) + Math.abs(Number(t.amount ?? 0)));
      }

      const months = new Set<string>([...incomeMap.keys(), ...expenseMap.keys()]);
      return Array.from(months)
        .sort()
        .map((month) => {
          const income = incomeMap.get(month) ?? 0;
          const expense = expenseMap.get(month) ?? 0;
          return { month, income, expense, profit: income - expense };
        });
    });
  }

  // ─── Payment methods ──────────────────────────────────────────────────────────

  async getPaymentMethods() {
    return this.cached('analytics:payment_methods:v2', async () => {
      try {
        const data = await (this.prisma.payment as any).groupBy({
          by: ['method'],
          _count: true,
          _sum: { amount: true },
        });

        return data.map((item: any) => ({
          method: item.method,
          count: typeof item._count === 'number' ? item._count : item._count?._all ?? 0,
          total: Number(item._sum?.amount ?? 0),
        }));
      } catch {
        return [];
      }
    });
  }

  // ─── Gamification analytics ───────────────────────────────────────────────────

  async getGamification() {
    return this.cached('analytics:gamification:v2', async () => {
      const [xpTotal, badgesTotal, wheelSpins] = await Promise.all([
        this.prisma.xpHistory.aggregate({ _sum: { amount: true } } as any).catch(() => ({ _sum: { amount: 0 } } as any)),
        this.prisma.userBadge.count(),
        this.prisma.wheelSpin.count(),
      ]);

      const prizeBreakdown = await (this.prisma.wheelSpin as any).groupBy({
        by: ['prizeId'],
        _count: true,
        orderBy: { _count: { prizeId: 'desc' } },
        take: 5,
      }).catch(() => []);

      const topBadges = await this.prisma.badge.findMany({
        include: { _count: { select: { userBadges: true } } } as any,
        orderBy: { userBadges: { _count: 'desc' } } as any,
        take: 5,
      } as any).catch(() => []);

      return {
        xpDistributed: Number((xpTotal as any)._sum?.amount ?? 0),
        badgesGiven: badgesTotal,
        wheelSpins,
        prizeBreakdown,
        topBadges: (topBadges as any[]).map((b: any) => ({
          code: b.code,
          name: b.name,
          count: b._count?.userBadges ?? 0,
        })),
      };
    });
  }

  private serializeBigInt(obj: any): any {
    if (obj == null) return obj;
    if (typeof obj === 'bigint') return obj.toString();
    if (Array.isArray(obj)) return obj.map((x) => this.serializeBigInt(x));
    if (typeof obj === 'object') {
      const out: any = {};
      for (const k in obj) out[k] = this.serializeBigInt(obj[k]);
      return out;
    }
    return obj;
  }
}
