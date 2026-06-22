import { Injectable, Logger } from '@nestjs/common';
import { NotificationType } from '@tiktakrun/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface LevelInfo {
  currentLevel: any;
  nextLevel: any;
  xpNeeded: bigint;
  percent: number;
}

@Injectable()
export class LevelingService {
  private readonly logger = new Logger(LevelingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Atomically apply XP to user. Handles level-up chain.
   */
  async applyXp(
    userId: string,
    delta: number,
    reason: string,
  ): Promise<{ leveled: boolean; newLevel?: number }> {
    // XP و سطح روی UserProfile ذخیره می‌شوند (نه User)
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
      include: { level: true },
    });
    if (!profile) throw new Error(`Profile for user ${userId} not found`);

    // Atomic increment روی پروفایل + ثبت تاریخچهٔ XP
    const updated = await this.prisma.userProfile.update({
      where: { userId },
      data: {
        xp: { increment: delta },
      },
      include: { level: true },
    });
    await this.prisma.xpHistory.create({
      data: {
        userId,
        amount: delta,
        source: reason,
        description: reason,
      },
    });

    // Check level-up chain
    let leveled = false;
    const currentXp = updated.xp;
    let currentLevelId = updated.levelId;
    let currentLevelNumber = updated.level?.id ?? updated.levelId ?? 0;

    while (true) {
      const nextLevel = await this.prisma.level.findFirst({
        where: { id: { gt: currentLevelNumber } },
        orderBy: { id: 'asc' },
      });

      if (!nextLevel || currentXp < nextLevel.requiredXp) break;

      // Level up
      await this.prisma.userProfile.update({
        where: { userId },
        data: { levelId: nextLevel.id },
      });

      leveled = true;
      currentLevelId = nextLevel.id;
      currentLevelNumber = nextLevel.id;

      // Notification
      await this.notifications.send({
        userId,
        type: NotificationType.LEVEL_UP,
        title: `🏆 ارتقا به سطح ${nextLevel.id}!`,
        body: `تبریک! شما به سطح "${nextLevel.name}" رسیدید.`,
        data: { levelId: nextLevel.id, levelNumber: nextLevel.id },
      });

      // Emit event for Socket.io and Badge check
      this.eventEmitter.emit('user.levelUp', {
        userId,
        levelId: nextLevel.id,
        levelNumber: nextLevel.id,
      });

      // Unlock accessories related to this level (avatar items)
      const perks = (nextLevel.perks ?? {}) as { accessories?: string[] };
      if (perks.accessories?.length) {
        for (const acc of perks.accessories) {
          await this.prisma.userAccessory.upsert({
            where: { userId_avatarItemId: { userId, avatarItemId: acc } },
            create: { userId, avatarItemId: acc },
            update: {},
          });
        }
      }
    }

    return {
      leveled,
      newLevel: leveled
        ? (await this.prisma.level.findUnique({ where: { id: currentLevelId } }))
            ?.id
        : undefined,
    };
  }

  /**
   * Get current level info and progress to next level.
   */
  async getNextLevelInfo(userId: string): Promise<LevelInfo> {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
      include: { level: true },
    });
    if (!profile) throw new Error(`Profile for user ${userId} not found`);

    const currentLevel = profile.level;
    const nextLevel = await this.prisma.level.findFirst({
      where: { id: { gt: currentLevel?.id ?? 0 } },
      orderBy: { id: 'asc' },
    });

    const baseXp: bigint = BigInt(currentLevel?.requiredXp ?? 0);
    const nextXp: bigint | null = nextLevel ? BigInt(nextLevel.requiredXp) : null;
    const currentXp: bigint = BigInt(profile.xp ?? 0);

    let xpNeeded: bigint = BigInt(0);
    let percent = 100;

    if (nextXp !== null) {
      xpNeeded = nextXp > currentXp ? nextXp - currentXp : BigInt(0);
      const range = Number(nextXp - baseXp);
      const progress = Number(currentXp - baseXp);
      percent = range > 0 ? Math.min(100, Math.floor((progress / range) * 100)) : 0;
    }

    return {
      currentLevel,
      nextLevel,
      xpNeeded,
      percent,
    };
  }
}
