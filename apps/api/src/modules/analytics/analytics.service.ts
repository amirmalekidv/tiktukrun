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

export interface AnalyticsScope {
  branchFilter?: string | { in: string[] };
}

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

  private scopeKey(scope?: AnalyticsScope) {
    const filter = scope?.branchFilter;
    if (!filter) return 'global';
    if (typeof filter === 'string') return `branch:${filter}`;
    return `branch:${[...filter.in].sort().join(',')}`;
  }

  private bookingWhere(base: Record<string, any> = {}, scope?: AnalyticsScope) {
    return scope?.branchFilter ? { ...base, branchId: scope.branchFilter } : base;
  }

  private gameWhere(base: Record<string, any> = {}, scope?: AnalyticsScope) {
    return scope?.branchFilter ? { ...base, branchId: scope.branchFilter } : base;
  }

  private paymentWhere(scope?: AnalyticsScope) {
    if (!scope?.branchFilter) return {};
    return { booking: { is: { branchId: scope.branchFilter } } };
  }

  // ─── Dashboard overview ───────────────────────────────────────────────────────

  async getOverview(scope?: AnalyticsScope) {
    const scopeKey = this.scopeKey(scope);
    return this.cached(`analytics:overview:v3:${scopeKey}`, async () => {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 3600_000);
      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const completedThisMonth = this.bookingWhere({
        status: 'COMPLETED',
        createdAt: { gte: thisMonthStart },
      }, scope);
      const completedPrevMonth = this.bookingWhere({
        status: 'COMPLETED',
        createdAt: { gte: prevMonthStart, lt: thisMonthStart },
      }, scope);
      const activeBookingWhere = this.bookingWhere({
        status: { in: ['PENDING', 'CONFIRMED'] },
      }, scope);

      const [
        monthlyRevenue,
        prevMonthRevenue,
        activeBookings,
        recentBookings,
        recentAuditLogs,
      ] = await Promise.all([
        this.prisma.booking.aggregate({
          where: completedThisMonth,
          _sum: { totalAmount: true },
        }),
        this.prisma.booking.aggregate({
          where: completedPrevMonth,
          _sum: { totalAmount: true },
        }),
        this.prisma.booking.count({ where: activeBookingWhere }),
        this.prisma.booking.findMany({
          where: this.bookingWhere({}, scope),
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, fullName: true } },
            game: { select: { title: true } },
            branch: { select: { id: true, name: true } },
          },
        }),
        this.prisma.auditLog.findMany({
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: { performer: { select: { id: true, fullName: true } } as any },
        } as any).catch(() => []),
      ]);

      let newCustomers = 0;
      let prevMonthCustomers = 0;
      let topCustomers: Array<{ id: string; name: string; ltv: number }> = [];
      if (scope?.branchFilter) {
        const [newCustomerBookings, prevCustomerBookings, customerBookings] = await Promise.all([
          this.prisma.booking.findMany({
            where: this.bookingWhere({ createdAt: { gte: thirtyDaysAgo } }, scope),
            select: { userId: true },
          }),
          this.prisma.booking.findMany({
            where: this.bookingWhere({ createdAt: { gte: prevMonthStart, lt: thisMonthStart } }, scope),
            select: { userId: true },
          }),
          this.prisma.booking.findMany({
            where: this.bookingWhere({ status: 'COMPLETED' }, scope),
            select: {
              userId: true,
              totalAmount: true,
              user: { select: { id: true, fullName: true, mobile: true } },
            },
          }),
        ]);
        newCustomers = new Set(newCustomerBookings.map((b) => b.userId)).size;
        prevMonthCustomers = new Set(prevCustomerBookings.map((b) => b.userId)).size;
        const customerMap = new Map<string, { id: string; name: string; ltv: number }>();
        for (const booking of customerBookings as any[]) {
          const current = customerMap.get(booking.userId) ?? {
            id: booking.user?.id ?? booking.userId,
            name: booking.user?.fullName ?? booking.user?.mobile ?? '—',
            ltv: 0,
          };
          current.ltv += Number(booking.totalAmount ?? 0);
          customerMap.set(booking.userId, current);
        }
        topCustomers = Array.from(customerMap.values())
          .sort((a, b) => b.ltv - a.ltv)
          .slice(0, 5);
      } else {
        const [currentCustomers, previousCustomers, profiles] = await Promise.all([
          this.prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
          this.prisma.user.count({
            where: { createdAt: { gte: prevMonthStart, lt: thisMonthStart } },
          }),
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
        newCustomers = currentCustomers;
        prevMonthCustomers = previousCustomers;
        topCustomers = profiles.map((p: any) => ({
          id: p.user?.id ?? p.userId,
          name: p.user?.fullName ?? p.user?.mobile ?? '—',
          ltv: Number(p.totalSpent ?? 0),
        }));
      }

      // Daily revenue trend last 30 days (MongoDB: aggregate in JS)
      const trendBookings = await this.prisma.booking.findMany({
        where: this.bookingWhere({ status: 'COMPLETED', createdAt: { gte: thirtyDaysAgo } }, scope),
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
        where: this.bookingWhere({ status: 'COMPLETED', createdAt: { gte: thirtyDaysAgo } }, scope),
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
        topCustomers,
        recentBookings: this.serializeBigInt(recentBookings),
        liveActivities: recentAuditLogs,
        scope: scopeKey,
      };
    });
  }

  async getOverviewFormatted(scope?: AnalyticsScope) {
    const [flat, financial] = await Promise.all([
      this.getOverview(scope),
      this.getFinancial(scope),
    ]);
    return mapOverviewToDashboard(flat, financial);
  }

  // ─── Financial KPIs ───────────────────────────────────────────────────────────

  async getFinancial(scope?: AnalyticsScope) {
    const scopeKey = this.scopeKey(scope);
    return this.cached(`analytics:financial:v3:${scopeKey}`, async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600_000);
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 3600_000);

      const [totalRevenue, bookingUsers, newBookingUsers] = await Promise.all([
        this.prisma.booking.aggregate({
          where: this.bookingWhere({ status: 'COMPLETED' }, scope),
          _sum: { totalAmount: true },
        }),
        this.prisma.booking.findMany({
          where: this.bookingWhere({}, scope),
          select: { userId: true },
        }),
        this.prisma.booking.findMany({
          where: this.bookingWhere({ createdAt: { gte: thirtyDaysAgo } }, scope),
          select: { userId: true },
        }),
      ]);
      const totalUsers = scope?.branchFilter
        ? new Set(bookingUsers.map((b) => b.userId)).size
        : await this.prisma.user.count();
      const newUsers30d = scope?.branchFilter
        ? new Set(newBookingUsers.map((b) => b.userId)).size
        : await this.prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } });

      const avgLTV =
        totalUsers > 0
          ? Number(totalRevenue._sum.totalAmount ?? 0) / totalUsers
          : 0;

      const churnedUsers = scope?.branchFilter
        ? new Set(
            (await this.prisma.booking.findMany({
              where: this.bookingWhere({ createdAt: { lt: ninetyDaysAgo } }, scope),
              select: { userId: true },
            })).map((b) => b.userId),
          ).size
        : await this.prisma.user.count({
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
        scope: scopeKey,
      };
    });
  }

  // ─── Cohort analysis ─────────────────────────────────────────────────────────

  async getCohort(scope?: AnalyticsScope) {
    const scopeKey = this.scopeKey(scope);
    return this.cached(`analytics:cohort:v3:${scopeKey}`, async () => {
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      if (scope?.branchFilter) {
        const bookings = await this.prisma.booking.findMany({
          where: this.bookingWhere({ status: 'COMPLETED', createdAt: { gte: twelveMonthsAgo } }, scope),
          select: {
            createdAt: true,
            user: { select: { id: true, createdAt: true } },
          },
        });
        const ym = (d: Date) => d.toISOString().slice(0, 7);
        const cells = new Map<string, Set<string>>();
        for (const b of bookings as any[]) {
          if (!b.user?.createdAt) continue;
          const key = `${ym(b.user.createdAt)}|${ym(b.createdAt)}`;
          if (!cells.has(key)) cells.set(key, new Set());
          cells.get(key)!.add(b.user.id);
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
      }

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

  async getHeatmap(scope?: AnalyticsScope) {
    const scopeKey = this.scopeKey(scope);
    return this.cached(`analytics:heatmap:v3:${scopeKey}`, async () => {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 3600_000);
      const bookings = await this.prisma.booking.findMany({
        where: this.bookingWhere({ createdAt: { gte: ninetyDaysAgo } }, scope),
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

  async getGames(scope?: AnalyticsScope) {
    const scopeKey = this.scopeKey(scope);
    return this.cached(`analytics:games:v3:${scopeKey}`, async () => {
      const games = await this.prisma.game.findMany({
        where: this.gameWhere({}, scope),
        select: {
          id: true,
          title: true,
          branch: { select: { id: true, name: true, city: { select: { id: true, name: true } } } },
        },
      });
      if (!games.length) return [];

      // Completed bookings per game: revenue + count + lastBooking
      const completed = await this.prisma.booking.findMany({
        where: this.bookingWhere({ status: 'COMPLETED' }, scope),
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
            branch: (g as any).branch,
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

  async getCashflow(scope?: AnalyticsScope) {
    const scopeKey = this.scopeKey(scope);
    return this.cached(`analytics:cashflow:v3:${scopeKey}`, async () => {
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      const bookings = await this.prisma.booking.findMany({
        where: this.bookingWhere({ status: 'COMPLETED', createdAt: { gte: twelveMonthsAgo } }, scope),
        select: { id: true, createdAt: true, totalAmount: true },
      });

      const incomeMap = new Map<string, number>(); // YYYY-MM → income
      for (const b of bookings) {
        const month = b.createdAt.toISOString().slice(0, 7);
        const amt = Number(b.totalAmount ?? 0);
        incomeMap.set(month, (incomeMap.get(month) ?? 0) + (amt > 0 ? amt : 0));
      }

      // Expenses tracked as REFUND transactions (money out) if available.
      const bookingIds = bookings.map((b) => b.id);
      const refunds = await this.prisma.transaction
        .findMany({
          where: {
            type: 'REFUND',
            createdAt: { gte: twelveMonthsAgo },
            ...(scope?.branchFilter ? { refId: { in: bookingIds } } : {}),
          },
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

  async getPaymentMethods(scope?: AnalyticsScope) {
    const scopeKey = this.scopeKey(scope);
    return this.cached(`analytics:payment_methods:v3:${scopeKey}`, async () => {
      try {
        if (scope?.branchFilter) {
          const payments = await this.prisma.payment.findMany({
            where: this.paymentWhere(scope),
            select: { method: true, amount: true },
          });
          const map = new Map<string, { method: string; count: number; total: number }>();
          for (const payment of payments as any[]) {
            const key = String(payment.method);
            const current = map.get(key) ?? { method: key, count: 0, total: 0 };
            current.count += 1;
            current.total += Number(payment.amount ?? 0);
            map.set(key, current);
          }
          return Array.from(map.values());
        }

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

  async getGamification(scope?: AnalyticsScope) {
    const scopeKey = this.scopeKey(scope);
    return this.cached(`analytics:gamification:v3:${scopeKey}`, async () => {
      if (scope?.branchFilter) {
        return {
          xpDistributed: 0,
          badgesGiven: 0,
          wheelSpins: 0,
          prizeBreakdown: [],
          topBadges: [],
          scope: scopeKey,
          scopeNote: 'Gamification analytics are platform-wide and are hidden for branch-scoped access.',
        };
      }

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
        scope: scopeKey,
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
