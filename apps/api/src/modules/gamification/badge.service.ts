import { Injectable, Logger } from '@nestjs/common';
import { NotificationType } from '@tiktakrun/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

export type BadgeEvent =
  | 'booking_completed'
  | 'review_added'
  | 'wheel_spin'
  | 'level_up'
  | 'invite_used'
  | 'first_booking'
  | 'horror_fan'
  | 'team_captain'
  | 'wallet_topup'
  | 'streak_7'
  | 'streak_30'
  | 'vip_reached';

@Injectable()
export class BadgeService {
  private readonly logger = new Logger(BadgeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Auto-check and grant badges based on an event trigger
   */
  async checkAndGrantAutoBadges(
    userId: string,
    event: BadgeEvent,
  ): Promise<void> {
    // Badge فاقد فیلد triggerEvent است؛ از فیلد criteria (JSON) برای فیلتر استفاده می‌کنیم
    const allActive = await this.prisma.badge.findMany({
      where: { isActive: true },
    });
    const badges = allActive.filter((b) => {
      const c = (b.criteria ?? {}) as { triggerEvent?: string };
      return c.triggerEvent === event || !c.triggerEvent;
    });

    for (const badge of badges) {
      const alreadyHas = await this.prisma.userBadge.findUnique({
        where: { userId_badgeId: { userId, badgeId: badge.id } },
      });
      if (alreadyHas) continue;

      const qualified = await this.evaluateBadgeCondition(userId, badge);
      if (qualified) {
        await this.grantBadge(userId, badge.id, null, 'auto');
      }
    }
  }

  /**
   * Manually grant a badge by admin
   */
  async grantManual(
    userId: string,
    badgeCode: string,
    adminId: string,
    reason: string,
  ): Promise<void> {
    const badge = await this.prisma.badge.findUnique({
      where: { code: badgeCode },
    });
    if (!badge) throw new Error(`Badge ${badgeCode} not found`);

    await this.grantBadge(userId, badge.id, adminId, reason);
  }

  private async grantBadge(
    userId: string,
    badgeId: string,
    grantedBy: string | null,
    reason: string,
  ): Promise<void> {
    const badge = await this.prisma.badge.findUnique({ where: { id: badgeId } });
    if (!badge) return;

    await this.prisma.userBadge.create({
      data: {
        userId: userId,
        badgeId,
        ...(grantedBy ? { awardedBy: grantedBy } : {}),
      },
    });

    await this.notifications.send({
      userId,
      type: NotificationType.BADGE_EARNED,
      title: `🏅 بج جدید: ${badge.name}`,
      body: badge.description || `شما بج "${badge.name}" را دریافت کردید!`,
      data: { badgeId: badge.id, badgeCode: badge.code },
    });

    this.logger.log(`Badge "${badge.code}" granted to user ${userId}`);
  }

  private async evaluateBadgeCondition(
    userId: string,
    badge: any,
  ): Promise<boolean> {
    const { conditions } = badge;
    if (!conditions) return true;

    try {
      switch (badge.code) {
        case 'FIRST_BOOKING': {
          const count = await this.prisma.booking.count({
            where: { userId, status: 'COMPLETED' },
          });
          return count >= 1;
        }
        case 'BOOKINGS_5': {
          const count = await this.prisma.booking.count({
            where: { userId, status: 'COMPLETED' },
          });
          return count >= 5;
        }
        case 'BOOKINGS_20': {
          const count = await this.prisma.booking.count({
            where: { userId, status: 'COMPLETED' },
          });
          return count >= 20;
        }
        case 'FIRST_REVIEW': {
          const count = await this.prisma.review.count({ where: { userId: userId } });
          return count >= 1;
        }
        case 'WHEEL_SPINNER': {
          const count = await this.prisma.wheelSpin.count({ where: { userId: userId } });
          return count >= 1;
        }
        case 'WHEEL_VETERAN': {
          const count = await this.prisma.wheelSpin.count({ where: { userId: userId } });
          return count >= 10;
        }
        case 'LEVEL_5': {
          const profile = await this.prisma.userProfile.findUnique({
            where: { userId },
            include: { level: true },
          });
          return (profile?.level?.id ?? 0) >= 5;
        }
        case 'LEVEL_10': {
          const profile = await this.prisma.userProfile.findUnique({
            where: { userId },
            include: { level: true },
          });
          return (profile?.level?.id ?? 0) >= 10;
        }
        case 'INVITER': {
          const count = await this.prisma.user.count({
            where: { invitedById: userId },
          });
          return count >= 1;
        }
        case 'HORROR_FAN': {
          const count = await this.prisma.booking.count({
            where: {
              userId,
              status: 'COMPLETED',
              game: { category: { slug: { in: ['horror', 'cinema-horror'] } } },
            },
          });
          return count >= 2;
        }
        case 'TEAM_CAPTAIN': {
          const count = await this.prisma.team.count({
            where: { captainId: userId },
          });
          return count >= 1;
        }
        case 'VIP_MEMBER': {
          // VIP بر اساس مجموع خرج (totalSpent) در پروفایل تعیین می‌شود
          const profile = await this.prisma.userProfile.findUnique({
            where: { userId },
            select: { totalSpent: true },
          });
          return Number(profile?.totalSpent ?? 0) >= 5_000_000;
        }
        default:
          return conditions?.autoGrant === true;
      }
    } catch (err) {
      this.logger.error(
        `Error evaluating badge ${badge.code} for user ${userId}: ${err.message}`,
      );
      return false;
    }
  }
}
