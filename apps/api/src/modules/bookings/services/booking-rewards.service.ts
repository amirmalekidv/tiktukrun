import { Injectable, Logger } from '@nestjs/common';
import { PrismaService }      from '../../../prisma/prisma.service';
import {
  INotificationsService,
} from '../../../common/interfaces/notifications-stub.service';
import { NotificationType } from '@tiktakrun/shared-types';

const XP_PER_BOOKING    = 10;
const COINS_PER_BOOKING = 20;
const XP_PER_REVIEW     = 5;
const COINS_PER_REVIEW  = 10;

@Injectable()
export class BookingRewardsService {
  private readonly logger = new Logger(BookingRewardsService.name);

  constructor(
    private prisma: PrismaService,
  ) {}

  /** افزایش سکه در کیف پول (coins در Wallet نگه‌داری می‌شود نه profile) */
  private async addCoins(userId: string, coins: number): Promise<void> {
    await this.prisma.wallet.upsert({
      where:  { userId },
      update: { coinsBalance: { increment: coins } },
      create: { userId, coinsBalance: coins },
    });
  }

  async awardBookingCompletion(
    bookingId: string,
    userId:    string,
    notif:     INotificationsService,
  ): Promise<void> {
    const booking = await this.prisma.booking.findUnique({
      where:   { id: bookingId },
      include: { game: { select: { id: true, tags: true, categoryId: true, category: { select: { genre: true } } } } },
    });
    if (!booking) return;

    const isHorror = booking.game?.category?.genre === 'HORROR';

    const profile = await this.prisma.userProfile.findUnique({
      where:  { userId },
      select: { statsCache: true },
    });
    const stats = (profile?.statsCache as any) ?? {};
    if (isHorror) stats.horrorBookings = (stats.horrorBookings ?? 0) + 1;

    await this.prisma.userProfile.update({
      where: { userId },
      data: {
        xp:            { increment: XP_PER_BOOKING },
        totalBookings: { increment: 1 },
        totalSpent:    { increment: Number(booking.totalAmount) },
        statsCache:    stats,
      },
    });
    await this.addCoins(userId, COINS_PER_BOOKING);

    this.logger.log(`Rewards awarded to userId=${userId} for bookingId=${bookingId}`);

    await this.checkAndAwardBadges(userId, notif);
    await this.checkLevelUp(userId, notif);
  }

  async awardReviewCompletion(userId: string, notif: INotificationsService): Promise<void> {
    await this.prisma.userProfile.update({
      where: { userId },
      data:  { xp: { increment: XP_PER_REVIEW } },
    });
    await this.addCoins(userId, COINS_PER_REVIEW);
  }

  private async checkAndAwardBadges(
    userId: string,
    notif:  INotificationsService,
  ): Promise<void> {
    const profile = await this.prisma.userProfile.findUnique({
      where:  { userId },
      select: { totalBookings: true, totalSpent: true, statsCache: true },
    });
    if (!profile) return;

    const horrorBookings = ((profile.statsCache as any)?.horrorBookings ?? 0) as number;

    const existingBadges = await this.prisma.userBadge.findMany({
      where:  { userId },
      select: { badge: { select: { code: true } } },
    });
    const ownedCodes = new Set(existingBadges.map((b) => b.badge.code));

    const toAward: string[] = [];
    if (!ownedCodes.has('first-booking') && profile.totalBookings >= 1)  toAward.push('first-booking');
    if (!ownedCodes.has('loyal')         && profile.totalBookings >= 10) toAward.push('loyal');
    if (!ownedCodes.has('brave')         && horrorBookings >= 5)         toAward.push('brave');
    if (!ownedCodes.has('vip-star')      && Number(profile.totalSpent) >= 10_000_000) toAward.push('vip-star');

    for (const code of toAward) {
      const badge = await this.prisma.badge.findUnique({ where: { code } });
      if (!badge) continue;

      await this.prisma.userBadge.create({
        data: { userId, badgeId: badge.id, awardedAt: new Date() },
      });

      await notif.send({
        userId,
        type:  NotificationType.BADGE_EARNED,
        title: `بج "${badge.name}" دریافت کردی! 🏅`,
        body:  badge.description ?? '',
        data:  { badgeId: badge.id },
      });

      this.logger.log(`Badge ${code} awarded to userId=${userId}`);
    }
  }

  private async checkLevelUp(
    userId: string,
    notif:  INotificationsService,
  ): Promise<void> {
    const profile = await this.prisma.userProfile.findUnique({
      where:  { userId },
      select: { xp: true, levelId: true },
    });
    if (!profile) return;

    // فرمول ساده: هر 100 XP یک لول
    const newLevel = Math.floor((profile.xp ?? 0) / 100) + 1;
    if (newLevel > (profile.levelId ?? 1)) {
      // اطمینان از وجود رکورد Level (در غیر این صورت از تغییر صرف‌نظر کن)
      const levelRecord = await this.prisma.level.findUnique({ where: { id: newLevel } });
      if (!levelRecord) return;

      await this.prisma.userProfile.update({
        where: { userId },
        data:  { levelId: newLevel },
      });
      await notif.send({
        userId,
        type:  NotificationType.LEVEL_UP,
        title: `🎉 لول ${newLevel} رسیدی!`,
        body:  `تبریک! به لول ${newLevel} ارتقا یافتی.`,
        data:  { newLevel },
      });
    }
  }
}
