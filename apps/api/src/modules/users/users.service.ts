import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateMeDto } from './dto/update-me.dto';
import {
  AdminUpdateUserDto,
  AdjustXpDto,
  AdjustWalletDto,
  GrantBadgeDto,
  BanUserDto,
  MuteUserDto,
} from './dto/admin-update-user.dto';
import { LevelingService } from './leveling.service';
import { parsePagination, paginate } from '../../common/utils/pagination.helper';
import { serializeBigInts } from '../../common/utils/bigint';
import { TransactionType, NotificationType, NotificationChannel } from '@prisma/client';
import { Role, AuditAction, TransactionCurrency, TransactionRefType } from '../../common/prisma-shims';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly levelingService: LevelingService,
  ) {}

  /**
   * Get current user's full profile
   */
  async getMe(userId: string) {
    const uid = userId;
    const user = await this.prisma.user.findUnique({
      where: { id: uid },
      include: {
        profile: true,
        wallet: true,
        roleAssignments: true,
        userAvatarItems: { include: { item: true } },
        userBadges: { include: { badge: true }, orderBy: { awardedAt: 'desc' } },
      } as any,
    }) as any;

    if (!user) throw new NotFoundException('کاربر یافت نشد');

    return serializeBigInts({
      id: user.id,
      mobile: user.mobile,
      email: user.email,
      fullName: user.fullName,
      nickname: user.nickname,
      inviteCode: user.inviteCode,
      isBanned: user.isBanned,
      isMuted: user.isMuted,
      mutedUntil: user.mutedUntil,
      createdAt: user.createdAt,
      roles: user.roleAssignments.map((r: any) => r.role),
      profile: user.profile,
      wallet: user.wallet,
      avatarItems: user.userAvatarItems,
      badges: user.userBadges,
    });
  }

  /**
   * Update user profile
   */
  async updateMe(userId: string, dto: UpdateMeDto) {
    // Check nickname uniqueness
    if (dto.nickname) {
      const existing = await this.prisma.user.findFirst({
        where: { nickname: dto.nickname, id: { not: userId } },
      });
      if (existing) throw new ConflictException('این نام کاربری قبلاً استفاده شده است');
    }

    // Check email uniqueness
    if (dto.email) {
      const existing = await this.prisma.user.findFirst({
        where: { email: dto.email, id: { not: userId } },
      });
      if (existing) throw new ConflictException('این ایمیل قبلاً ثبت شده است');
    }

    const { bio, instagram, telegram, birthDate, gender, cityId, settings, ...userFields } = dto;

    // Update user
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(userFields.fullName !== undefined && { fullName: userFields.fullName }),
        ...(userFields.nickname !== undefined && { nickname: userFields.nickname }),
        ...(userFields.email !== undefined && { email: userFields.email }),
      },
    });

    // Update profile
    const profileData: any = {};
    if (bio !== undefined) profileData.bio = bio;
    if (instagram !== undefined) profileData.instagram = instagram;
    if (telegram !== undefined) profileData.telegram = telegram;
    if (birthDate !== undefined) profileData.birthDate = new Date(birthDate);
    if (gender !== undefined) profileData.gender = gender;
    if (cityId !== undefined) profileData.cityId = cityId;
    if (settings !== undefined) profileData.settings = settings;

    const profile = await this.prisma.userProfile.upsert({
      where: { userId: userId },
      update: profileData,
      create: { userId: userId, ...profileData },
    });

    return { user: { id: user.id, fullName: user.fullName, nickname: user.nickname, email: user.email }, profile };
  }

  // ─── Admin Methods ──────────────────────────────────────────────────────────

  /**
   * List users with filters
   */
  async adminListUsers(query: any) {
    const { page, limit, skip } = parsePagination(query);
    const { q, role, status, level, sortBy = 'createdAt' } = query;

    const where: any = { deletedAt: null };

    if (q) {
      where.OR = [
        { mobile: { contains: q } },
        { fullName: { contains: q, mode: 'insensitive' } },
        { nickname: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (status === 'banned') where.isBanned = true;
    if (status === 'muted') where.isMuted = true;
    if (status === 'active') where.isBanned = false;

    if (role) {
      where.roleAssignments = { some: { role } };
    }

    if (level) {
      where.profile = { levelId: parseInt(level) };
    }

    const orderBy: any = {};
    orderBy[sortBy] = 'desc';

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          profile: { select: { levelId: true, xp: true } } as any,
          roleAssignments: { select: { role: true } },
          wallet: { select: { tomanBalance: true, coinsBalance: true, diamondsBalance: true } },
        } as any,
      }),
      this.prisma.user.count({ where }),
    ]);

    return paginate(
      users.map((u) => serializeBigInts({
        ...u,
        roles: u.roleAssignments.map((r) => r.role),
      })),
      total,
      page,
      limit,
    );
  }

  /**
   * Get user by ID (admin)
   */
  async adminGetUser(id: string) {
    const uid = id;
    const user = await this.prisma.user.findFirst({
      where: { id: uid, deletedAt: null } as any,
      include: {
        profile: true,
        wallet: true,
        roleAssignments: true,
        userBadges: { include: { badge: true } },
        userAvatarItems: { include: { item: true } },
        sessions: { where: { revokedAt: null }, orderBy: { createdAt: 'desc' }, take: 5 },
      } as any,
    }) as any;

    if (!user) throw new NotFoundException('کاربر یافت نشد');

    // count of invitees (users with invitedById = uid)
    const invitesSentCount = await this.prisma.user.count({ where: { invitedById: uid } });
    const notificationsCount = await this.prisma.notification.count({ where: { userId: uid } });

    return serializeBigInts({
      ...user,
      roles: user.roleAssignments.map((r: any) => r.role),
      _count: { notifications: notificationsCount, invitesSent: invitesSentCount },
    });
  }

  /**
   * Update user (admin)
   */
  async adminUpdateUser(id: string, dto: AdminUpdateUserDto, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: id } });
    if (!user) throw new NotFoundException('کاربر یافت نشد');

    await this.prisma.$transaction(async (tx) => {
      if (dto.isBanned !== undefined || dto.banReason !== undefined) {
        await tx.user.update({
          where: { id: id },
          data: {
            isBanned: dto.isBanned,
            banReason: dto.banReason,
          },
        });
      }

      if (dto.roles) {
        // Replace all roles
        await tx.userRoleAssignment.deleteMany({ where: { userId: id } });
        await tx.userRoleAssignment.createMany({
          data: dto.roles.map((role: any) => ({ userId: id, role, grantedBy: adminId })) as any,
        });
      }

      if (dto.level) {
        await tx.userProfile.update({
          where: { userId: id },
          data: { levelId: dto.level } as any,
        });
      }

      await tx.auditLog.create({
        data: {
          actorId: adminId, entity: 'User',
          entityId: id,
          action: AuditAction.USER_UPDATED,
          afterJson: dto as any,
        },
      });
    });

    return this.adminGetUser(id);
  }

  /**
   * Grant badge to user
   */
  async adminGrantBadge(userId: string, dto: GrantBadgeDto, adminId: string) {
    const badge = await this.prisma.badge.findUnique({ where: { code: dto.badgeCode } });
    if (!badge) throw new NotFoundException('بج یافت نشد');

    const existing = await this.prisma.userBadge.findFirst({
      where: { userId: userId, badgeId: badge.id },
    });
    if (existing) throw new ConflictException('کاربر این بج را قبلاً دارد');

    await this.prisma.$transaction(async (tx) => {
      await tx.userBadge.create({
        data: { userId: userId, badgeId: badge.id, reason: dto.reason, grantedBy: adminId } as any,
      });

      await tx.notification.create({
        data: {
          userId: userId,
          type: NotificationType.BADGE,
          title: 'بج جدید!',
          body: `بج «${badge.name}» به پروفایل شما اضافه شد`,
          channel: NotificationChannel.INAPP,
          metadata: { badgeId: badge.id, badgeCode: badge.code },
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: adminId, entity: 'User',
          entityId: userId,
          action: AuditAction.BADGE_GRANTED,
          afterJson: { badgeCode: dto.badgeCode, reason: dto.reason },
        },
      });
    });

    return { message: `بج «${badge.name}» به کاربر اعطا شد` };
  }

  /**
   * Revoke badge from user
   */
  async adminRevokeBadge(userId: string, dto: GrantBadgeDto, adminId: string) {
    const badge = await this.prisma.badge.findUnique({ where: { code: dto.badgeCode } });
    if (!badge) throw new NotFoundException('بج یافت نشد');

    const existing = await this.prisma.userBadge.findFirst({
      where: { userId: userId, badgeId: badge.id },
    });
    if (!existing) throw new NotFoundException('کاربر این بج را ندارد');

    await this.prisma.$transaction(async (tx) => {
      await tx.userBadge.delete({ where: { userId_badgeId: { userId: existing.userId, badgeId: existing.badgeId } } });
      await tx.auditLog.create({
        data: {
          actorId: adminId, entity: 'User',
          entityId: userId,
          action: AuditAction.BADGE_REVOKED,
          afterJson: { badgeCode: dto.badgeCode, reason: dto.reason },
        },
      });
    });

    return { message: `بج «${badge.name}» از کاربر گرفته شد` };
  }

  /**
   * Adjust user XP (admin)
   */
  async adminAdjustXp(userId: string, dto: AdjustXpDto, adminId: string) {
    const profile = await this.prisma.userProfile.findUnique({ where: { userId: userId } });
    if (!profile) throw new NotFoundException('پروفایل یافت نشد');

    const oldXp = profile.xp;
    const newXp = Math.max(0, oldXp + dto.delta);
    const newLevel = this.levelingService.calculateLevel(newXp);
    const leveledUp = newLevel > (profile as any).levelId;

    await this.prisma.$transaction(async (tx) => {
      await tx.userProfile.update({
        where: { userId: userId },
        data: { xp: newXp, levelId: newLevel } as any,
      });

      if (leveledUp) {
        await tx.notification.create({
          data: {
            userId: userId,
            type: NotificationType.LEVEL,
            title: '🎉 ارتقاء سطح!',
            body: `تبریک! شما به سطح ${newLevel} رسیدید`,
            channel: NotificationChannel.INAPP,
            metadata: { oldLevel: (profile as any).levelId, newLevel },
          },
        });
      }

      await tx.auditLog.create({
        data: {
          actorId: adminId, entity: 'User',
          entityId: userId,
          action: AuditAction.XP_ADJUSTED,
          afterJson: { delta: dto.delta, reason: dto.reason, oldXp, newXp, oldLevel: (profile as any).levelId, newLevel },
        },
      });
    });

    return { oldXp, newXp, oldLevel: (profile as any).levelId, newLevel, leveledUp };
  }

  /**
   * Adjust user wallet (admin)
   */
  async adminAdjustWallet(userId: string, dto: AdjustWalletDto, adminId: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId: userId } });
    if (!wallet) throw new NotFoundException('کیف پول یافت نشد');

    const currencyField = {
      TOMAN: 'tomanBalance',
      COINS: 'coinsBalance',
      DIAMONDS: 'diamondsBalance',
      XP: 'tomanBalance', // XP در کیف پول ذخیره نمی‌شود؛ fallback ایمن
    }[dto.currency];

    const currentBalance = Number((wallet as any)[currencyField as string] ?? 0);
    const delta = Number(dto.delta);
    const newBalance = currentBalance + delta;

    if (newBalance < 0) {
      throw new ForbiddenException('موجودی کافی نیست');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: dto.delta >= 0 ? TransactionType.DEPOSIT : TransactionType.WITHDRAW,
          currency: dto.currency as TransactionCurrency,
          amount: Math.abs(delta),
          balanceAfter: newBalance,
          refType: TransactionRefType.MANUAL_ADJUST,
          description: dto.reason,
        },
      });

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { [currencyField as string]: newBalance } as any,
      });

      await tx.auditLog.create({
        data: {
          actorId: adminId,
          entity: 'User',
          entityId: userId,
          action: AuditAction.WALLET_ADJUSTED,
          afterJson: { currency: dto.currency, delta: dto.delta, reason: dto.reason },
        },
      });
    });

    return serializeBigInts({ message: 'کیف پول به‌روزرسانی شد', newBalance });
  }

  /**
   * Ban user
   */
  async adminBanUser(userId: string, dto: BanUserDto, adminId: string) {
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { isBanned: true, banReason: dto.reason },
      });
      await tx.session.updateMany({
        where: { userId: userId, revokedAt: null } as any,
        data: { revokedAt: new Date() },
      });
      await tx.auditLog.create({
        data: {
          actorId: adminId, entity: 'User',
          entityId: userId,
          action: AuditAction.USER_BANNED,
          afterJson: { reason: dto.reason },
        },
      });
    });
    return { message: 'کاربر مسدود شد' };
  }

  /**
   * Unban user
   */
  async adminUnbanUser(userId: string, adminId: string) {
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { isBanned: false, banReason: null },
      });
      await tx.auditLog.create({
        data: {
          actorId: adminId, entity: 'User',
          entityId: userId,
          action: AuditAction.USER_UNBANNED,
        },
      });
    });
    return { message: 'مسدودیت کاربر رفع شد' };
  }

  /**
   * Mute user
   */
  async adminMuteUser(userId: string, dto: MuteUserDto, adminId: string) {
    const mutedUntil = new Date(Date.now() + dto.hours * 60 * 60 * 1000);
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { isMuted: true, mutedUntil },
      });
      await tx.auditLog.create({
        data: {
          actorId: adminId, entity: 'User',
          entityId: userId,
          action: AuditAction.USER_MUTED,
          afterJson: { hours: dto.hours, reason: dto.reason, mutedUntil },
        },
      });
    });
    return { message: `کاربر تا ${mutedUntil.toISOString()} سکوت شد` };
  }

  /**
   * Unmute user
   */
  async adminUnmuteUser(userId: string, adminId: string) {
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { isMuted: false, mutedUntil: null },
      });
      await tx.auditLog.create({
        data: {
          actorId: adminId, entity: 'User',
          entityId: userId,
          action: AuditAction.USER_UNMUTED,
        },
      });
    });
    return { message: 'سکوت کاربر رفع شد' };
  }

  /**
   * Admin stats — quick counts for the dashboard tile [QA Fix 2026-05-25]
   */
  async adminGetStats() {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 3600_000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 3600_000);

    const [total, active, banned, muted, newLast7, newLast30, withProfile] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } as any }),
      this.prisma.user.count({ where: { isActive: true, isBanned: false, deletedAt: null } as any }),
      this.prisma.user.count({ where: { isBanned: true, deletedAt: null } as any }),
      this.prisma.user.count({ where: { isMuted: true, deletedAt: null } as any }),
      this.prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo }, deletedAt: null } as any }),
      this.prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo }, deletedAt: null } as any }),
      this.prisma.userProfile.count(),
    ]);

    return {
      total,
      active,
      banned,
      muted,
      newLast7,
      newLast30,
      withProfile,
    };
  }
}
