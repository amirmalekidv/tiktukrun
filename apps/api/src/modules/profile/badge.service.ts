import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LevelingService } from '../users/leveling.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@tiktakrun/shared-types';

interface BadgeCondition {
  type: 'bookings' | 'level' | 'spent' | 'invites' | 'xp';
  value: number;
  operator: '>=' | '>' | '==' | '<=' | '<';
}

@Injectable()
export class BadgeService {
  private readonly logger = new Logger(BadgeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly levelingService: LevelingService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Check and grant automatic badges for a user
   */
  async checkAndGrantBadges(userId: string): Promise<string[]> {
    const [user, profile, existingBadges, allBadges] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        include: { invitees: true },
      }),
      this.prisma.userProfile.findUnique({ where: { userId: userId } }),
      this.prisma.userBadge.findMany({
        where: { userId: userId },
        select: { badgeId: true },
      }),
      this.prisma.badge.findMany({
        where: { isActive: true },
      }),
    ]);

    if (!user || !profile) return [];

    const ownedBadgeIds = new Set(existingBadges.map((b) => b.badgeId));
    const granted: string[] = [];

    for (const badge of allBadges) {
      if (ownedBadgeIds.has(badge.id)) continue;

      const condition = (badge.criteria as any) as BadgeCondition;
      if (!condition || !condition.type) continue;

      let meetsCondition = false;

      switch (condition.type) {
        case 'bookings':
          meetsCondition = this.evaluate(profile.totalBookings, condition.operator, condition.value);
          break;
        case 'level':
          meetsCondition = this.evaluate(profile.levelId, condition.operator, condition.value);
          break;
        case 'xp':
          meetsCondition = this.evaluate(profile.xp, condition.operator, condition.value);
          break;
        case 'spent':
          meetsCondition = this.evaluate(profile.totalSpent, condition.operator, condition.value);
          break;
        case 'invites':
          meetsCondition = this.evaluate(user.invitees.length, condition.operator, condition.value);
          break;
      }

      if (meetsCondition) {
        try {
          await this.prisma.$transaction(async (tx) => {
            await tx.userBadge.create({
              data: {
                userId: userId,
                badgeId: badge.id,
              },
            });
          });

          await this.notifications.send({
            userId,
            type: NotificationType.BADGE_EARNED,
            title: '🏆 بج جدید کسب کردید!',
            body: `بج «${badge.name}» به پروفایل شما اضافه شد`,
            data: { badgeId: badge.id, badgeCode: badge.code },
          });

          granted.push(badge.code);
          this.logger.log(`Badge "${badge.code}" granted to user ${userId}`);
        } catch (err) {
          this.logger.error(`Failed to grant badge ${badge.code} to user ${userId}`, err);
        }
      }
    }

    return granted;
  }

  private evaluate(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case '>=': return value >= threshold;
      case '>': return value > threshold;
      case '==': return value === threshold;
      case '<=': return value <= threshold;
      case '<': return value < threshold;
      default: return false;
    }
  }

  /**
   * Get all badges with earned status for a user
   */
  async getUserBadges(userId: string) {
    // [QA Fix 2026-05-25] Badge has no sortOrder (use id); UserBadge uses awardedAt not createdAt
    const [allBadges, userBadges] = await Promise.all([
      this.prisma.badge.findMany({ where: { isActive: true } as any, orderBy: { id: 'asc' } }),
      this.prisma.userBadge.findMany({
        where: { userId: userId },
        include: { badge: true },
        orderBy: { awardedAt: 'desc' } as any,
      }),
    ]);

    const earnedMap = new Map<any, any>(userBadges.map((ub: any) => [ub.badgeId, ub]));

    return {
      earned: userBadges,
      all: allBadges.map((badge: any) => ({
        ...badge,
        isEarned: earnedMap.has(badge.id),
        earnedAt: earnedMap.get(badge.id)?.awardedAt || null,
      })),
    };
  }
}
