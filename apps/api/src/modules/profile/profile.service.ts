import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { LevelingService } from '../users/leveling.service';
import { BadgeService } from './badge.service';
import { serializeBigInts } from '../../common/utils/bigint';
import { TransactionCurrency } from '@tiktakrun/shared-types';
import { TransactionType } from '@prisma/client';

const LEADERBOARD_CACHE_TTL = 300; // 5 minutes

/**
 * ProfileService
 * [QA Fix 2026-05-25]
 *   - prisma.profile → prisma.userProfile (model is UserProfile)
 *   - profile.level → profile.levelId
 *   - user include badges → userBadges (with awardedAt instead of createdAt)
 *   - User.isDeleted → User.deletedAt
 *   - UserProfile fields: levelId, xp, totalBookings, successfulBookings, fearLevel, avatarUrl
 */
@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly levelingService: LevelingService,
    private readonly badgeService: BadgeService,
  ) {}

  /**
   * Get current user's stats
   */
  async getMyStats(userId: string) {
    const uid = userId;
    const [profile, wallet, badgesCount] = await Promise.all([
      this.prisma.userProfile.findUnique({ where: { userId: uid } }) as any,
      this.prisma.wallet.findUnique({ where: { userId: uid } }),
      this.prisma.userBadge.count({ where: { userId: uid } }),
    ]);

    if (!profile) throw new NotFoundException('پروفایل یافت نشد');

    const xp = (profile as any).xp ?? 0;
    const levelId = (profile as any).levelId ?? 1;
    const xpToNextLevel = this.levelingService.getXpToNextLevel(xp);
    const levelProgress = this.levelingService.getLevelProgress(xp);

    // Calculate total spent from transactions (DEBIT TOMAN)
    const totalSpentResult = wallet
      ? await this.prisma.transaction.aggregate({
          where: {
            walletId: wallet.id,
            type: TransactionType.BOOKING_PAYMENT,
            currency: TransactionCurrency.TOMAN as any,
          },
          _sum: { amount: true },
        })
      : null;

    const totalSpent = totalSpentResult?._sum?.amount ?? 0n;

    return serializeBigInts({
      totalBookings: (profile as any).totalBookings ?? 0,
      successfulBookings: (profile as any).successfulBookings ?? 0,
      totalSpent,
      averageRating: '0.0',
      badgesCount,
      currentLevel: levelId,
      currentXp: xp,
      xpToNextLevel,
      levelProgress,
      fearLevel: (profile as any).fearLevel ?? 0,
    });
  }

  /**
   * Get public profile for a user
   */
  async getPublicProfile(userId: string) {
    const uid = userId;
    const user = await this.prisma.user.findFirst({
      where: { id: uid, deletedAt: null } as any,
      include: {
        profile: {
          select: {
            levelId: true,
            xp: true,
            fearLevel: true,
            totalBookings: true,
            settings: true,
          } as any,
        },
        userBadges: {
          include: { badge: true },
          orderBy: { awardedAt: 'desc' },
          take: 6,
        } as any,
      } as any,
    }) as any;

    if (!user) throw new NotFoundException('کاربر یافت نشد');

    // Check privacy settings
    const settings = (user.profile?.settings as any) || {};
    const showProfile = settings?.privacy?.showProfile !== false;

    if (!showProfile) {
      return {
        id: user.id,
        nickname: user.nickname,
        profile: {
          level: user.profile?.levelId,
          avatarUrl: user.avatarUrl,
        },
        isPrivate: true,
      };
    }

    return {
      id: user.id,
      nickname: user.nickname,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      profile: user.profile,
      badges: (user.userBadges || []).map((ub: any) => ub.badge),
      totalBookings: user.profile?.totalBookings || 0,
    };
  }

  /**
   * Get leaderboard with Redis caching (TTL 5min)
   */
  async getLeaderboard(query: {
    type?: string;
    period?: string;
    limit?: number;
    page?: number;
  }) {
    const type = (query.type as 'xp' | 'bookings' | 'spent') || 'xp';
    const period = (query.period as 'week' | 'month' | 'all') || 'all';
    const limit = Math.min(parseInt(String(query.limit || 10)), 100);

    const cacheKey = `leaderboard:${type}:${period}:${limit}`;

    // Try cache first
    const cached = await this.redis.getJson<any[]>(cacheKey);
    if (cached) return cached;

    let startDate: Date | undefined;
    if (period === 'week') {
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === 'month') {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    let result: any[] = [];

    switch (type) {
      case 'xp': {
        const profiles: any[] = await this.prisma.userProfile.findMany({
          where: startDate ? { updatedAt: { gte: startDate } } : {},
          orderBy: { xp: 'desc' },
          take: limit,
          include: {
            user: {
              select: { id: true, nickname: true, fullName: true, avatarUrl: true },
            },
          },
        } as any);
        result = profiles.map((p: any, i: number) => ({
          rank: i + 1,
          userId: p.userId,
          nickname: p.user.nickname || p.user.fullName || 'کاربر',
          level: p.levelId,
          xp: p.xp,
          avatarUrl: p.user.avatarUrl,
        }));
        break;
      }

      case 'bookings': {
        const profiles: any[] = await this.prisma.userProfile.findMany({
          orderBy: { totalBookings: 'desc' },
          take: limit,
          include: {
            user: {
              select: { id: true, nickname: true, fullName: true, avatarUrl: true },
            },
          },
        } as any);
        result = profiles.map((p: any, i: number) => ({
          rank: i + 1,
          userId: p.userId,
          nickname: p.user.nickname || p.user.fullName || 'کاربر',
          level: p.levelId,
          totalBookings: p.totalBookings,
          avatarUrl: p.user.avatarUrl,
        }));
        break;
      }

      case 'spent': {
        const wallets: any[] = await this.prisma.wallet.findMany({
          take: limit * 3,
          include: {
            user: {
              select: {
                id: true,
                nickname: true,
                fullName: true,
                deletedAt: true,
                avatarUrl: true,
                profile: { select: { levelId: true } as any },
              } as any,
            },
          },
        });

        const spendData = await (this.prisma.transaction as any).groupBy({
          by: ['walletId'],
          where: { type: TransactionType.BOOKING_PAYMENT, currency: TransactionCurrency.TOMAN as any },
          _sum: { amount: true },
          orderBy: { _sum: { amount: 'desc' } },
          take: limit,
        });

        const walletMap = new Map<any, any>(wallets.map((w: any) => [w.id, w]));

        result = spendData
          .filter((s: any) => {
            const wallet = walletMap.get(s.walletId);
            return wallet && !wallet.user.deletedAt;
          })
          .map((s: any, i: number) => {
            const wallet = walletMap.get(s.walletId)!;
            return serializeBigInts({
              rank: i + 1,
              userId: wallet.userId,
              nickname: wallet.user.nickname || wallet.user.fullName || 'کاربر',
              level: wallet.user.profile?.levelId || 1,
              avatarUrl: wallet.user.avatarUrl,
              totalSpent: s._sum.amount || 0n,
            });
          });
        break;
      }

      default:
        result = [];
    }

    // Cache result for 5 minutes
    await this.redis.setJson(cacheKey, result, LEADERBOARD_CACHE_TTL);

    return result;
  }
}
