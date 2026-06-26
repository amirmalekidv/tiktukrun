import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Cron } from '@nestjs/schedule';
import { LevelingService } from '../gamification/leveling.service';
import { SettingsService } from '../settings/settings.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@tiktakrun/shared-types';

@Injectable()
export class MonthlyService {
  private readonly logger = new Logger(MonthlyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly levelingService: LevelingService,
    private readonly settings: SettingsService,
    private readonly notifications: NotificationsService,
  ) {}

  // ─── Cron: روز اول هر ماه ساعت ۹ تهران ──────────────────────────────────────

  @Cron('0 9 1 * *', {
    timeZone: 'Asia/Tehran',
    name: 'monthly_rewards_auto',
  })
  async autoMonthlyRewards() {
    const now = new Date();
    // Previous month
    const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth();
    const prevYear =
      now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

    this.logger.log(
      `Auto monthly rewards for ${prevYear}-${String(prevMonth).padStart(2, '0')}`,
    );

    await this.compute(prevYear, prevMonth);
    await this.distribute(prevYear, prevMonth, null);
  }

  // ─── Compute winners ──────────────────────────────────────────────────────────

  async compute(year: number, month: number): Promise<any> {
    const { startDate, endDate } = this.getMonthRange(year, month);

    // Top player by XP gained in month (XpHistory.amount)
    const xpGroups = await this.prisma.xpHistory.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: startDate, lt: endDate } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 1,
    });
    const topPlayer = xpGroups[0]
      ? { userId: xpGroups[0].userId, xpGained: Number(xpGroups[0]._sum.amount ?? 0) }
      : null;

    // Top game by revenue (sum of totalAmount on completed bookings)
    const gameGroups = await this.prisma.booking.groupBy({
      by: ['gameId'],
      where: { createdAt: { gte: startDate, lt: endDate }, status: 'COMPLETED' },
      _sum: { totalAmount: true },
      orderBy: { _sum: { totalAmount: 'desc' } },
      take: 1,
    });
    const topGame = gameGroups[0]
      ? { gameId: gameGroups[0].gameId, revenue: Number(gameGroups[0]._sum.totalAmount ?? 0) }
      : null;

    // Top team by completed bookings of members in the month
    const teams = await this.prisma.team.findMany({
      include: { members: { select: { userId: true } } },
    });
    const memberBookings = await this.prisma.booking.groupBy({
      by: ['userId'],
      where: {
        status: 'COMPLETED',
        createdAt: { gte: startDate, lt: endDate },
      },
      _count: { id: true },
    });
    const countByUser = new Map(
      memberBookings.map((b) => [b.userId, b._count.id]),
    );

    let topTeam: { teamId: string; bookingCount: number } | null = null;
    let maxBookings = 0;
    for (const team of teams) {
      const bookingCount = team.members.reduce(
        (sum, m) => sum + (countByUser.get(m.userId) ?? 0),
        0,
      );
      if (bookingCount > maxBookings) {
        maxBookings = bookingCount;
        topTeam = { teamId: team.id, bookingCount };
      }
    }

    // ذخیره به‌صورت رکوردهای جدا برای هر نوع (schema = [year, month, type])
    await this.upsertWinner(year, month, 'TOP_PLAYER', topPlayer?.userId ?? null, null, null, {
      xpGained: topPlayer?.xpGained ?? 0,
    });
    await this.upsertWinner(year, month, 'TOP_TEAM', null, topTeam?.teamId ?? null, null, {
      bookingCount: topTeam?.bookingCount ?? 0,
    });
    await this.upsertWinner(year, month, 'TOP_GAME', null, null, topGame?.gameId ?? null, {
      revenue: topGame?.revenue ?? 0,
    });

    return { year, month, topPlayer, topTeam, topGame };
  }

  private async upsertWinner(
    year: number,
    month: number,
    type: 'TOP_PLAYER' | 'TOP_TEAM' | 'TOP_GAME',
    winnerUserId: string | null,
    winnerTeamId: string | null,
    winnerGameId: string | null,
    prizeJson: any,
  ) {
    await this.prisma.monthlyWinner.upsert({
      where: { year_month_type: { year, month, type } },
      create: { year, month, type, winnerUserId, winnerTeamId, winnerGameId, prizeJson },
      update: { winnerUserId, winnerTeamId, winnerGameId, prizeJson },
    });
  }

  // ─── Distribute prizes ────────────────────────────────────────────────────────

  async distribute(
    year: number,
    month: number,
    customPrizes: any,
  ): Promise<void> {
    const records = await this.prisma.monthlyWinner.findMany({
      where: { year, month },
    });
    if (!records.length) {
      await this.compute(year, month);
      return this.distribute(year, month, customPrizes);
    }

    const playerRec = records.find((r) => r.type === 'TOP_PLAYER');
    const teamRec = records.find((r) => r.type === 'TOP_TEAM');

    // Load default prizes from settings
    const defaultPrizesStr = await this.settings.get(
      'gamification.monthly_rewards',
      '{}',
    );
    // FIX: wrap JSON.parse in try-catch — corrupted DB value must not crash distribute()
    let defaultPrizes: any = {};
    try {
      defaultPrizes = JSON.parse(defaultPrizesStr);
    } catch {
      this.logger.error('Failed to parse monthly_rewards setting — using empty prizes');
    }
    const prizes = customPrizes || defaultPrizes;

    // افزایش موجودی سکهٔ کیف پول کاربر
    const addCoins = async (userId: string, coins: number) => {
      const wallet = await this.prisma.wallet.upsert({
        where: { userId },
        update: { coinsBalance: { increment: coins } },
        create: { userId, coinsBalance: coins },
        select: { id: true, coinsBalance: true },
      });
      await this.prisma.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'MONTHLY_REWARD',
          amount: coins,
          balanceAfter: wallet.coinsBalance,
          currency: 'COINS',
          refType: 'MONTHLY_REWARD',
          description: `جایزه ماهانه ${year}/${month}`,
        },
      });
    };

    // ── Top Player ──────────────────────────────────────
    if (playerRec?.winnerUserId && prizes.topPlayer) {
      const p = prizes.topPlayer;
      const userId = playerRec.winnerUserId;

      if (p.xp) {
        await this.levelingService.applyXp(userId, p.xp, 'monthly_winner');
      }
      if (p.coins) {
        await addCoins(userId, p.coins);
      }
      if (p.freeTicket) {
        await this.prisma.freeTicket.create({
          data: {
            userId,
            source: 'MONTHLY_REWARD',
            expiresAt: new Date(Date.now() + 30 * 24 * 3600_000),
          },
        });
      }
      if (p.discountCode) {
        await this.prisma.discountCode.create({
          data: {
            code: `MONTHLY-PLAYER-${year}-${month}-${userId.slice(-4)}`,
            type: 'PERCENT',
            value: p.discountPercent ?? 20,
            validUntil: new Date(Date.now() + 30 * 24 * 3600_000),
            maxUses: 1,
          },
        });
      }

      await this.notifications.send({
        userId,
        type: NotificationType.MONTHLY_WINNER,
        title: `🏆 برنده برتر ماه ${month}/${year}!`,
        body: 'تبریک! شما بهترین بازیکن این ماه بودید.',
        data: { prizes: p },
      });
    }

    // ── Top Team ──────────────────────────────────────
    if (teamRec?.winnerTeamId && prizes.topTeam) {
      const p = prizes.topTeam;
      const team = await this.prisma.team.findUnique({
        where: { id: teamRec.winnerTeamId },
        include: { members: { select: { userId: true } } },
      });

      if (team) {
        for (const member of team.members) {
          if (p.coins) {
            await addCoins(member.userId, p.coins);
          }
          await this.notifications.send({
            userId: member.userId,
            type: NotificationType.MONTHLY_WINNER,
            title: `🎯 تیم برتر ماه!`,
            body: `تیم "${team.name}" برنده شد!`,
            data: { prizes: p },
          });
        }
      }
    }

    // Mark distributed (all records for this month)
    await this.prisma.monthlyWinner.updateMany({
      where: { year, month },
      data: { distributedAt: new Date() },
    });
  }

  async getWinners(year: number, month: number) {
    // [QA Fix 2026-05-25] Schema unique = [year, month, type] — return all types for that month
    const records = await this.prisma.monthlyWinner.findMany({
      where: { year, month },
      include: {
        winnerUser: { select: { id: true, fullName: true, nickname: true, avatarUrl: true } } as any,
        winnerTeam: { select: { id: true, name: true } } as any,
        winnerGame: { select: { id: true, title: true } } as any,
      } as any,
    });
    const byType: any = { year, month, topPlayer: null, topTeam: null, topGame: null, distributedAt: null };
    for (const r of records as any[]) {
      if (r.type === 'TOP_PLAYER') byType.topPlayer = r;
      else if (r.type === 'TOP_TEAM') byType.topTeam = r;
      else if (r.type === 'TOP_GAME') byType.topGame = r;
      if (r.distributedAt && !byType.distributedAt) byType.distributedAt = r.distributedAt;
    }
    return byType;
  }

  async getHistory() {
    return this.prisma.monthlyWinner.findMany({
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      take: 24,
    });
  }

  private getMonthRange(year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);
    return { startDate, endDate };
  }
}
