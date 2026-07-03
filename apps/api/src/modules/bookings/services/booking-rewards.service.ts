import { Injectable, Logger } from '@nestjs/common';
import { TransactionType, CurrencyType } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { SettingsService } from '../../settings/settings.service';
import { NotificationType } from '@tiktakrun/shared-types';

@Injectable()
export class BookingRewardsService {
  private readonly logger = new Logger(BookingRewardsService.name);

  constructor(
    private prisma: PrismaService,
    private notif: NotificationsService,
    private settings: SettingsService,
  ) {}

  private async getBookingRewards() {
    const [xp, coins] = await Promise.all([
      this.settings.get('gamification.xpPerBooking', '50'),
      this.settings.get('gamification.coinsPerBooking', '20'),
    ]);
    return { xp: Number(xp), coins: Number(coins) };
  }

  private async getReviewRewards() {
    const [xp, coins] = await Promise.all([
      this.settings.get('gamification.xpPerReview', '20'),
      this.settings.get('gamification.coinsPerReview', '10'),
    ]);
    return { xp: Number(xp), coins: Number(coins) };
  }

  private async addCoinsWithAudit(
    userId: string,
    coins: number,
    type: TransactionType,
    description: string,
    refType: string,
    refId: string,
  ): Promise<void> {
    const wallet = await this.prisma.wallet.upsert({
      where: { userId },
      update: { coinsBalance: { increment: coins } },
      create: { userId, coinsBalance: coins },
      select: { id: true, coinsBalance: true },
    });
    await this.prisma.transaction.create({
      data: {
        walletId: wallet.id,
        currency: CurrencyType.COINS,
        amount: coins,
        balanceAfter: wallet.coinsBalance,
        type,
        description,
        refType,
        refId,
      },
    });
  }

  async awardBookingCompletion(bookingId: string, userId: string): Promise<void> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        game: {
          select: {
            id: true,
            tags: true,
            categoryId: true,
            category: { select: { genre: true } },
          },
        },
      },
    });
    if (!booking) return;

    const rewards = await this.getBookingRewards();
    const isHorror = booking.game?.category?.genre === 'HORROR';

    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
      select: { statsCache: true },
    });
    const stats = (profile?.statsCache as any) ?? {};
    if (isHorror) stats.horrorBookings = (stats.horrorBookings ?? 0) + 1;

    await this.prisma.userProfile.update({
      where: { userId },
      data: {
        xp: { increment: rewards.xp },
        totalBookings: { increment: 1 },
        totalSpent: { increment: Number(booking.totalAmount) },
        statsCache: stats,
      },
    });

    await this.prisma.xpHistory.create({
      data: {
        userId,
        amount: rewards.xp,
        source: 'BOOKING_COMPLETION',
        refId: bookingId,
        description: `پاداش تکمیل رزرو ${booking.code ?? bookingId}`,
      },
    });

    await this.addCoinsWithAudit(
      userId,
      rewards.coins,
      TransactionType.MONTHLY_REWARD,
      `پاداش تکمیل رزرو ${booking.code ?? bookingId}`,
      'BOOKING',
      bookingId,
    );

    this.logger.log(`Rewards awarded to userId=${userId} for bookingId=${bookingId}`);

    await this.checkAndAwardBadges(userId);
    await this.checkLevelUp(userId);
  }

  async awardReviewCompletion(userId: string, reviewId?: string): Promise<void> {
    const rewards = await this.getReviewRewards();
    await this.prisma.userProfile.update({
      where: { userId },
      data: { xp: { increment: rewards.xp } },
    });
    await this.prisma.xpHistory.create({
      data: {
        userId,
        amount: rewards.xp,
        source: 'REVIEW',
        refId: reviewId ?? userId,
        description: 'پاداش ثبت نظر',
      },
    });
    await this.addCoinsWithAudit(
      userId,
      rewards.coins,
      TransactionType.RATING_REWARD,
      'پاداش ثبت نظر',
      'REVIEW',
      reviewId ?? userId,
    );
  }

  private async checkAndAwardBadges(userId: string): Promise<void> {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
      select: { totalBookings: true, totalSpent: true, statsCache: true },
    });
    if (!profile) return;

    const horrorBookings = ((profile.statsCache as any)?.horrorBookings ?? 0) as number;

    const existingBadges = await this.prisma.userBadge.findMany({
      where: { userId },
      select: { badge: { select: { code: true } } },
    });
    const ownedCodes = new Set(existingBadges.map((b) => b.badge.code));

    const toAward: string[] = [];
    if (!ownedCodes.has('first-booking') && profile.totalBookings >= 1) toAward.push('first-booking');
    if (!ownedCodes.has('loyal') && profile.totalBookings >= 10) toAward.push('loyal');
    if (!ownedCodes.has('brave') && horrorBookings >= 5) toAward.push('brave');
    if (!ownedCodes.has('vip-star') && Number(profile.totalSpent) >= 10_000_000) toAward.push('vip-star');

    for (const code of toAward) {
      const badge = await this.prisma.badge.findUnique({ where: { code } });
      if (!badge) continue;

      await this.prisma.userBadge.create({
        data: { userId, badgeId: badge.id, awardedAt: new Date() },
      });

      await this.notif.send({
        userId,
        type: NotificationType.BADGE_EARNED,
        title: `بج "${badge.name}" دریافت کردی! 🏅`,
        body: badge.description ?? '',
        data: { badgeId: badge.id },
      });

      this.logger.log(`Badge ${code} awarded to userId=${userId}`);
    }
  }

  private async checkLevelUp(userId: string): Promise<void> {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
      select: { xp: true, levelId: true },
    });
    if (!profile) return;

    const newLevel = Math.floor((profile.xp ?? 0) / 100) + 1;
    if (newLevel > (profile.levelId ?? 1)) {
      const levelRecord = await this.prisma.level.findUnique({ where: { id: newLevel } });
      if (!levelRecord) return;

      await this.prisma.userProfile.update({
        where: { userId },
        data: { levelId: newLevel },
      });
      await this.notif.send({
        userId,
        type: NotificationType.LEVEL_UP,
        title: `🎉 لول ${newLevel} رسیدی!`,
        body: `تبریک! به لول ${newLevel} ارتقا یافتی.`,
        data: { newLevel },
      });
    }
  }
}
