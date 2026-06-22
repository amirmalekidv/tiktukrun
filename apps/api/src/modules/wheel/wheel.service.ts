import {
  Injectable,
  BadRequestException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType } from '@tiktakrun/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { LevelingService } from '../gamification/leveling.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BadgeService } from '../gamification/badge.service';
import { SettingsService } from '../settings/settings.service';

export type SpinCurrency = 'XP' | 'COINS' | 'DIAMONDS';

@Injectable()
export class WheelService {
  private readonly logger = new Logger(WheelService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly levelingService: LevelingService,
    private readonly notifications: NotificationsService,
    private readonly badgeService: BadgeService,
    private readonly settings: SettingsService,
  ) {}

  /** موجودی XP/سکه/الماس کاربر را از پروفایل و کیف پول می‌خواند */
  private async getBalances(userId: string) {
    const [profile, wallet] = await Promise.all([
      this.prisma.userProfile.findUnique({ where: { userId }, select: { xp: true } }),
      this.prisma.wallet.findUnique({
        where: { userId },
        select: { coinsBalance: true, diamondsBalance: true },
      }),
    ]);
    return {
      xp: Number(profile?.xp ?? 0),
      coins: Number(wallet?.coinsBalance ?? 0),
      diamonds: Number(wallet?.diamondsBalance ?? 0),
    };
  }

  async getEligibility(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const xpThreshold = Number(await this.settings.get('gamification.wheelXpThreshold', '20'));
    const coinsCost = Number(await this.settings.get('gamification.wheelCostCoins', '500'));
    const diamondsCost = Number(await this.settings.get('gamification.wheelCostDiamonds', '5'));

    const bal = await this.getBalances(userId);

    return {
      canSpinWithXp: bal.xp >= xpThreshold,
      xpThreshold,
      currentXp: bal.xp,
      canSpinWithCoins: bal.coins >= coinsCost,
      coinsCost,
      canSpinWithDiamonds: bal.diamonds >= diamondsCost,
      diamondsCost,
    };
  }

  async spin(userId: string, paidWith: SpinCurrency) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const xpThreshold = Number(await this.settings.get('gamification.wheelXpThreshold', '20'));
    const coinsCost = Number(await this.settings.get('gamification.wheelCostCoins', '500'));
    const diamondsCost = Number(await this.settings.get('gamification.wheelCostDiamonds', '5'));

    const bal = await this.getBalances(userId);

    // Verify resource
    if (paidWith === 'XP' && bal.xp < xpThreshold) {
      throw new BadRequestException('XP کافی نیست');
    }
    if (paidWith === 'COINS' && bal.coins < coinsCost) {
      throw new BadRequestException('سکه کافی نیست');
    }
    if (paidWith === 'DIAMONDS' && bal.diamonds < diamondsCost) {
      throw new BadRequestException('الماس کافی نیست');
    }

    // Get active prizes
    const prizes = await this.prisma.wheelPrize.findMany({ where: { isActive: true } });
    if (!prizes.length) throw new BadRequestException('جایزه‌ای در چرخ نیست');

    // Weighted random selection
    const prize = this.weightedRandom(prizes);
    const costPaid = paidWith === 'XP' ? xpThreshold : paidWith === 'COINS' ? coinsCost : diamondsCost;

    // Deduct resource + create spin record in a transaction
    await this.prisma.$transaction(async (tx) => {
      // ensure wallet exists
      const wallet = await tx.wallet.upsert({
        where: { userId },
        update: {},
        create: { userId },
        select: { id: true, coinsBalance: true, diamondsBalance: true },
      });

      // Deduct
      if (paidWith === 'XP') {
        await tx.userProfile.update({
          where: { userId },
          data: { xp: { decrement: xpThreshold } },
        });
      } else if (paidWith === 'COINS') {
        const updated = await tx.wallet.update({
          where: { userId },
          data: { coinsBalance: { decrement: coinsCost } },
          select: { coinsBalance: true },
        });
        await tx.transaction.create({
          data: {
            walletId: wallet.id,
            type: 'WHEEL_SPEND',
            amount: -coinsCost,
            balanceAfter: updated.coinsBalance,
            currency: 'COINS',
            refType: 'WHEEL_SPIN',
            description: 'هزینه چرخاندن گردونه',
          },
        });
      } else if (paidWith === 'DIAMONDS') {
        const updated = await tx.wallet.update({
          where: { userId },
          data: { diamondsBalance: { decrement: diamondsCost } },
          select: { diamondsBalance: true },
        });
        await tx.transaction.create({
          data: {
            walletId: wallet.id,
            type: 'WHEEL_SPEND',
            amount: -diamondsCost,
            balanceAfter: updated.diamondsBalance,
            currency: 'DIAMONDS',
            refType: 'WHEEL_SPIN',
            description: 'هزینه چرخاندن گردونه با الماس',
          },
        });
      }

      // Grant prize
      await this.grantPrize(tx, userId, wallet.id, prize);

      // Record spin
      await tx.wheelSpin.create({
        data: {
          userId,
          prizeId: prize.id,
          paidWith,
          costPaid,
          prizeSnapshot: {
            name: prize.name,
            type: prize.type,
            value: prize.value,
          },
        },
      });
    });

    // Notification
    await this.notifications.send({
      userId,
      type: NotificationType.WHEEL_PRIZE,
      title: `🎡 جایزه گردونه: ${prize.name}`,
      body: `تبریک! شما "${prize.name}" را برنده شدید!`,
      data: { prizeId: prize.id },
    });

    // Check badges
    await this.badgeService.checkAndGrantAutoBadges(userId, 'wheel_spin');

    return { prize };
  }

  private weightedRandom(prizes: any[]): any {
    const totalWeight = prizes.reduce((sum, p) => sum + (p.probabilityWeight || 1), 0);
    let random = Math.random() * totalWeight;
    for (const prize of prizes) {
      random -= prize.probabilityWeight || 1;
      if (random <= 0) return prize;
    }
    return prizes[prizes.length - 1];
  }

  private async grantPrize(tx: any, userId: string, walletId: string, prize: any): Promise<void> {
    switch (prize.type) {
      case 'COINS': {
        const w = await tx.wallet.update({
          where: { userId },
          data: { coinsBalance: { increment: prize.value } },
          select: { coinsBalance: true },
        });
        await tx.transaction.create({
          data: {
            walletId,
            type: 'WHEEL_WIN',
            amount: prize.value,
            balanceAfter: w.coinsBalance,
            currency: 'COINS',
            refType: 'WHEEL_SPIN',
            description: `جایزه گردونه: ${prize.name}`,
          },
        });
        break;
      }

      case 'DIAMONDS':
        await tx.wallet.update({
          where: { userId },
          data: { diamondsBalance: { increment: prize.value } },
        });
        break;

      case 'XP':
        await tx.userProfile.update({
          where: { userId },
          data: { xp: { increment: prize.value } },
        });
        break;

      case 'DISCOUNT_CODE':
        await tx.discountCode.create({
          data: {
            code: `WHEEL-${Date.now()}-${userId.slice(-4)}`,
            type: 'PERCENT',
            value: prize.value,
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            maxUses: 1,
          },
        });
        break;

      case 'FREE_TICKET':
        await tx.freeTicket.create({
          data: {
            userId,
            source: 'WHEEL',
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
        break;

      case 'TOMAN': {
        const w = await tx.wallet.update({
          where: { userId },
          data: { tomanBalance: { increment: prize.value } },
          select: { tomanBalance: true },
        });
        await tx.transaction.create({
          data: {
            walletId,
            type: 'WHEEL_WIN',
            amount: prize.value,
            balanceAfter: w.tomanBalance,
            currency: 'TOMAN',
            refType: 'WHEEL_SPIN',
            description: `جایزه نقدی گردونه: ${prize.name}`,
          },
        });
        break;
      }
    }
  }
}
