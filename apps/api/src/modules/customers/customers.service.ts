import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

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
    const where: any = { deletedAt: null };

    if (filter.q) {
      where.OR = [
        { fullName: { contains: filter.q, mode: 'insensitive' } },
        { mobile: { contains: filter.q } },
        { email: { contains: filter.q, mode: 'insensitive' } },
        { nickname: { contains: filter.q, mode: 'insensitive' } },
      ];
    }

    if (filter.segmentId) {
      where.userSegments = { some: { segmentId: filter.segmentId } };
    }

    if (filter.ltvMin || filter.ltvMax) {
      where.profile = where.profile ?? {};
      where.profile.totalSpent = {};
      if (filter.ltvMin) where.profile.totalSpent.gte = BigInt(filter.ltvMin);
      if (filter.ltvMax) where.profile.totalSpent.lte = BigInt(filter.ltvMax);
    }

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
          profile: { include: { level: { select: { id: true, name: true } } } },
          _count: { select: { bookings: true } },
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
        profile: { include: { level: true } },
        wallet: true,
        bookings: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { game: { select: { title: true } } },
        },
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
    const ltv = Number(profile.totalSpent ?? 0);
    const bookings = user._count?.bookings ?? profile.totalBookings ?? 0;

    let status: string;
    if (ltv >= 10_000_000) status = 'PLATINUM';
    else if (ltv >= 1_000_000) status = 'VIP';
    else if (ltv === 0 && bookings === 0) status = 'NEW';
    else status = 'ACTIVE';

    return {
      id: user.id,
      name: user.fullName ?? user.nickname ?? user.mobile,
      mobile: user.mobile,
      phone: user.mobile,
      email: user.email,
      avatar: user.avatarUrl,
      status,
      level: profile?.level?.id ?? profile.levelId ?? 1,
      levelName: profile?.level?.name,
      xp: Number(profile.xp ?? 0),
      ltv,
      bookings,
      isActive: user.isActive,
      isBanned: user.isBanned,
      lastActiveAt: user.lastLoginAt,
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

    const [total, active, platinum, activeLast30] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } as any }),
      this.prisma.user.count({ where: { isActive: true, deletedAt: null } as any }),
      this.prisma.user.count({
        where: {
          deletedAt: null,
          profile: { totalSpent: { gte: BigInt(10_000_000) } },
        } as any,
      }),
      this.prisma.user.count({
        where: { lastLoginAt: { gte: thirtyDaysAgo }, deletedAt: null } as any,
      }),
    ]);

    // Churning: at least one booking AND last booking > 90 days ago
    const churning = await this.prisma.user.count({
      where: {
        deletedAt: null,
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

  async getTopLtv(limit = 10) {
    const users: any[] = await this.prisma.user.findMany({
      where: { deletedAt: null, profile: { isNot: null } } as any,
      orderBy: { profile: { totalSpent: 'desc' } } as any,
      take: Number(limit),
      include: {
        profile: { include: { level: { select: { id: true, name: true } } } },
      } as any,
    });
    return users.map((u: any) => ({
      id: u.id,
      name: u.fullName ?? u.nickname ?? u.mobile,
      phone: u.mobile,
      ltv: Number(u.profile?.totalSpent ?? 0),
      level: u.profile?.level?.id ?? u.profile?.levelId,
      levelName: u.profile?.level?.name,
    }));
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
