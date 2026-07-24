import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { notSoftDeletedWhere } from '../../common/utils/prisma-mongo';

/**
 * CustomersService — admin-side CRM for users
 *
 * [QA REWRITE 2026-05-25]
 * The previous version assumed many fields on `User` that actually live on
 * `UserProfile` (totalSpent, level/levelId, statsCache) or simply do not exist
 * in this schema (isVip, lastActiveAt, deletedAt-on-user). It is rewritten
 * here to match the real Prisma schema so all 500s on admin/customers/* go
 * away.
 *
 * Schema reality:
 *  - User: id Int, mobile, email?, fullName?, isActive, isBanned, lastLoginAt,
 *          deletedAt? (added by us), createdAt
 *  - UserProfile: levelId, xp, totalBookings, successfulBookings, totalSpent BigInt
 *  - Level: id, name
 *  - Wallet: tomanBalance, coinsBalance, diamondsBalance
 *  - CrmNote: userId, body (string), authorId (NOT createdById)
 */
@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filter: any, page = 1, limit = 20) {
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);
    // Prisma MongoDB: unset deletedAt is not matched by `deletedAt: null`
    const and: any[] = [notSoftDeletedWhere()];
    const query = String(filter.q ?? '').trim();

    if (query) {
      and.push({
        OR: [
          { fullName: { contains: query, mode: 'insensitive' } },
          { mobile: { contains: query } },
          { email: { contains: query, mode: 'insensitive' } },
          { nickname: { contains: query, mode: 'insensitive' } },
        ],
      });
    }

    if (filter.segmentId) {
      and.push({ userSegments: { some: { segmentId: filter.segmentId } } });
    }

    if (filter.ltvMin || filter.ltvMax) {
      const totalSpent: Record<string, number> = {};
      if (filter.ltvMin) totalSpent.gte = Number(filter.ltvMin);
      if (filter.ltvMax) totalSpent.lte = Number(filter.ltvMax);
      and.push({ profile: { is: { totalSpent } } });
    }

    if (filter.status) {
      const statusWhere = this.buildStatusWhere(String(filter.status));
      if (statusWhere) and.push(statusWhere);
    }

    if (filter.tier) {
      const tierWhere = this.buildTierWhere(String(filter.tier));
      if (tierWhere) and.push(tierWhere);
    }

    if (filter.city) {
      and.push({
        profile: {
          is: {
            city: {
              is: {
                name: { contains: String(filter.city).trim(), mode: 'insensitive' },
              },
            },
          },
        },
      });
    }

    const where: any = { AND: and };

    // Ordering — fields are on User unless they live on UserProfile
    const orderBy: any = {};
    if (filter.sortBy === 'ltv') {
      orderBy.profile = { totalSpent: 'desc' };
    } else if (filter.sortBy === 'level') {
      orderBy.profile = { levelId: 'desc' };
    } else if (filter.sortBy === 'recent') {
      orderBy.lastLoginAt = 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          profile: {
            include: {
              level: { select: { id: true, name: true, requiredXp: true } },
              city: { select: { id: true, name: true } },
            },
          },
          wallet: true,
          invitedBy: { select: { id: true, fullName: true, mobile: true } },
          userSegments: {
            include: { segment: { select: { id: true, name: true } } },
          } as any,
          _count: { select: { bookings: true, invitees: true } },
        } as any,
      }),
      this.prisma.user.count({ where }),
    ]);

    const data = users.map((u: any) => this.formatCustomer(u));
    return { data, total };
  }

  async findOne(id: string) {
    const userId = String(id);
    const user: any = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: { include: { level: true, city: true } },
        wallet: true,
        bookings: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { game: { select: { title: true } } },
        },
        invitedBy: { select: { id: true, fullName: true, mobile: true } },
        _count: { select: { bookings: true, invitees: true } },
        userBadges: { include: { badge: true } } as any,
        userSegments: { include: { segment: true } } as any,
        crmNotesAboutMe: { orderBy: { createdAt: 'desc' } } as any,
      } as any,
    });
    if (!user) throw new NotFoundException('کاربر یافت نشد');

    const stats = await this.getCustomerStats(userId);
    return this.serializeBigInt({ ...this.formatCustomer(user), raw: user, stats });
  }

  private async getCustomerStats(userId: string) {
    const [totalBookings, completedBookings, totalSpent, avgRating] = await Promise.all([
      this.prisma.booking.count({ where: { userId } }),
      this.prisma.booking.count({ where: { userId, status: 'COMPLETED' } }),
      this.prisma.booking.aggregate({
        where: { userId, status: 'COMPLETED' },
        _sum: { totalAmount: true },
      }),
      this.prisma.review.aggregate({
        where: { userId },
        _avg: { rating: true },
      }),
    ]);

    return {
      totalBookings,
      completedBookings,
      ltv: String(totalSpent._sum.totalAmount ?? 0n),
      avgRating: avgRating._avg.rating ?? 0,
    };
  }

  private formatCustomer(user: any) {
    const profile = user.profile ?? {};
    const level = profile.level ?? {};
    const wallet = user.wallet ?? {};
    const ltv = Number(profile.totalSpent ?? 0);
    const totalBookings = Number(user._count?.bookings ?? profile.totalBookings ?? 0);
    const levelRequiredXp = Math.max(Number(level.requiredXp ?? 1000), 1);
    const xp = Number(profile.xp ?? 0);

    return {
      id: user.id,
      name: user.fullName ?? user.nickname ?? user.mobile,
      mobile: user.mobile,
      phone: user.mobile,
      email: user.email,
      avatar: user.avatarUrl,
      tier: this.getCustomerTier(user),
      status: this.getCustomerStatus(user),
      level: level.id ?? profile.levelId ?? 1,
      levelName: level.name,
      xp,
      xpForNextLevel: Math.max(levelRequiredXp - Math.min(xp, levelRequiredXp), 0),
      ltv,
      bookings: totalBookings,
      totalBookings,
      avgRating: Number(profile.averageRating ?? 0),
      city: profile.city?.name,
      tags: Array.isArray(user.userSegments)
        ? user.userSegments
            .map((entry: any) => entry?.segment?.name)
            .filter(Boolean)
        : [],
      segment: Array.isArray(user.userSegments)
        ? user.userSegments
            .map((entry: any) => entry?.segment?.name)
            .filter(Boolean)
        : [],
      walletBalance: Number(wallet.tomanBalance ?? 0),
      coins: Number(wallet.coinsBalance ?? 0),
      referredBy: user.invitedBy
        ? user.invitedBy.fullName ?? user.invitedBy.mobile
        : undefined,
      totalReferrals: Number(user._count?.invitees ?? 0),
      isActive: user.isActive,
      isBanned: user.isBanned,
      lastActiveAt: user.lastLoginAt ?? user.createdAt,
      registeredAt: user.createdAt,
      createdAt: user.createdAt,
    };
  }

  async createCustomer(dto: any) {
    // Generate a unique invite code
    const inviteCode = (dto.inviteCode || Math.random().toString(36).slice(2, 10)).toUpperCase();
    return this.prisma.user.create({
      data: {
        mobile: dto.mobile || dto.phone,
        email: dto.email,
        fullName: dto.fullName || dto.name,
        inviteCode,
        wallet: { create: {} },
        profile: { create: { levelId: 1 } } as any,
      } as any,
    });
  }

  async updateCustomer(id: string, dto: any) {
    const userId = String(id);
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.fullName && { fullName: dto.fullName }),
        ...(dto.name && { fullName: dto.name }),
        ...(dto.email && { email: dto.email }),
        ...(dto.nickname && { nickname: dto.nickname }),
        ...(dto.isActive !== undefined && { isActive: !!dto.isActive }),
        ...(dto.isBanned !== undefined && { isBanned: !!dto.isBanned }),
      },
    });
  }

  async getStats() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600_000);
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 3600_000);
    const alive = notSoftDeletedWhere();

    const [total, active, platinum, activeLast30] = await Promise.all([
      this.prisma.user.count({ where: alive as any }),
      this.prisma.user.count({ where: { isActive: true, ...alive } as any }),
      this.prisma.user.count({
        where: {
          ...alive,
          profile: { totalSpent: { gte: BigInt(10_000_000) } },
        } as any,
      }),
      this.prisma.user.count({
        where: { lastLoginAt: { gte: thirtyDaysAgo }, ...alive } as any,
      }),
    ]);

    // Churning: at least one booking AND last booking > 90 days ago
    const churning = await this.prisma.user.count({
      where: {
        ...alive,
        bookings: {
          some: {},
          every: { createdAt: { lt: ninetyDaysAgo } },
        },
      } as any,
    });

    return { total, vip: active, platinum, activeLast30, churning };
  }

  async addNote(customerId: string, text: string, adminId: string) {
    return this.prisma.crmNote.create({
      data: {
        userId: String(customerId),
        body: text,
        authorId: String(adminId),
      } as any,
    });
  }

  async getCustomerBookings(customerId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.booking.findMany({
        where: { userId: customerId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { game: { select: { title: true } } },
      }),
      this.prisma.booking.count({ where: { userId: customerId } }),
    ]);
    return { data: this.serializeBigInt(data), total };
  }

  async getCustomerTransactions(customerId: string, page = 1, limit = 20) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId: customerId },
    });
    if (!wallet) return { data: [], total: 0 };

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { walletId: wallet.id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.transaction.count({ where: { walletId: wallet.id } }),
    ]);
    return { data: this.serializeBigInt(data), total };
  }

  async getCustomerReviews(customerId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { userId: customerId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { game: { select: { title: true } } },
      }),
      this.prisma.review.count({ where: { userId: customerId } }),
    ]);
    return { data, total };
  }

  async getCustomerNotes(customerId: string) {
    const data = await this.prisma.crmNote.findMany({
      where: { userId: customerId },
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, fullName: true } },
      } as any,
    });
    return { data };
  }

  async getTopLtv(limit = 10) {
    const users: any[] = await this.prisma.user.findMany({
      where: { ...notSoftDeletedWhere(), profile: { isNot: null } } as any,
      orderBy: { profile: { totalSpent: 'desc' } } as any,
      take: Number(limit),
      include: {
        profile: {
          include: {
            level: { select: { id: true, name: true, requiredXp: true } },
            city: { select: { id: true, name: true } },
          },
        },
        wallet: true,
        invitedBy: { select: { id: true, fullName: true, mobile: true } },
        userSegments: {
          include: { segment: { select: { id: true, name: true } } },
        } as any,
        _count: { select: { bookings: true, invitees: true } },
      } as any,
    });
    return users.map((u: any) => this.formatCustomer(u));
  }

  private buildStatusWhere(status: string) {
    switch (status) {
      case 'ACTIVE':
        return { isActive: true, isBanned: false };
      case 'INACTIVE':
        return { isActive: false, isBanned: false };
      case 'BANNED':
        return { isBanned: true };
      case 'SUSPENDED':
        return { isMuted: true };
      default:
        return null;
    }
  }

  private buildTierWhere(tier: string) {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 3600_000);

    switch (tier) {
      case 'PLATINUM':
        return { profile: { is: { totalSpent: { gte: 30_000_000 } } } };
      case 'VIP':
        return {
          profile: { is: { totalSpent: { gte: 10_000_000, lt: 30_000_000 } } },
        };
      case 'GOLD':
        return {
          profile: { is: { totalSpent: { gte: 5_000_000, lt: 10_000_000 } } },
        };
      case 'SILVER':
        return {
          profile: { is: { totalSpent: { gte: 1_000_000, lt: 5_000_000 } } },
        };
      case 'BRONZE':
        return {
          AND: [
            { profile: { is: { totalSpent: { gt: 0, lt: 1_000_000 } } } },
            { bookings: { some: {} } },
          ],
        };
      case 'AT_RISK':
        return {
          AND: [{ bookings: { some: {} } }, { lastLoginAt: { lt: ninetyDaysAgo } }],
        };
      case 'NEWCOMER':
        return {
          AND: [
            { bookings: { none: {} } },
            { profile: { is: { totalSpent: 0 } } },
          ],
        };
      default:
        return null;
    }
  }

  private getCustomerStatus(user: any) {
    if (user.isBanned) return 'BANNED';
    if (!user.isActive) return 'INACTIVE';
    return 'ACTIVE';
  }

  private getCustomerTier(user: any) {
    const totalSpent = Number(user?.profile?.totalSpent ?? 0);
    const totalBookings = Number(user?._count?.bookings ?? user?.profile?.totalBookings ?? 0);
    const lastLoginAt = user?.lastLoginAt ? new Date(user.lastLoginAt) : null;
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 3600_000);

    if (totalBookings > 0 && lastLoginAt && lastLoginAt < ninetyDaysAgo) return 'AT_RISK';
    if (totalSpent >= 30_000_000) return 'PLATINUM';
    if (totalSpent >= 10_000_000) return 'VIP';
    if (totalSpent >= 5_000_000) return 'GOLD';
    if (totalSpent >= 1_000_000) return 'SILVER';
    if (totalSpent > 0 || totalBookings > 0) return 'BRONZE';
    return 'NEWCOMER';
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
