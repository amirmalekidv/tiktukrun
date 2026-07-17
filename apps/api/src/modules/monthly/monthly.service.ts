import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DateTime } from 'luxon';
import { NotificationType } from '@tiktakrun/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { LevelingService } from '../gamification/leveling.service';
import { SettingsService } from '../settings/settings.service';
import { NotificationsService } from '../notifications/notifications.service';

type WinnerType = 'TOP_PLAYER' | 'TOP_TEAM' | 'TOP_GAME' | 'RAFFLE_WINNER';
type Prize = {
  xp?: number;
  coins?: number;
  diamonds?: number;
  discountCode?: boolean;
  discountPercent?: number;
  freeTicket?: boolean;
  title?: string;
};

interface MonthlyRewardsConfig {
  raffle?: {
    enabled?: boolean;
    eligiblePoolSize?: number;
    minScore?: number;
    strategy?: 'WEIGHTED_TOP_PLAYERS' | 'TOP_PLAYER';
  };
  raffleWinner?: Prize;
  topPlayer?: Prize;
  topTeam?: Prize;
  topGame?: Prize;
}

interface PlayerStanding {
  rank: number;
  userId: string;
  name: string;
  avatarUrl?: string | null;
  level: number;
  xpGained: number;
  completedBookings: number;
  totalSpent: number;
  score: number;
  isEligible: boolean;
}

interface GameStanding {
  rank: number;
  gameId: string;
  title: string;
  slug: string;
  coverImage?: string | null;
  bookingsCount: number;
  playersCount: number;
  revenue: number;
  siteRank: number;
  score: number;
}

const TEHRAN_TZ = 'Asia/Tehran';
const DEFAULT_REWARDS: MonthlyRewardsConfig = {
  raffle: {
    enabled: true,
    eligiblePoolSize: 10,
    minScore: 1,
    strategy: 'WEIGHTED_TOP_PLAYERS',
  },
  raffleWinner: { xp: 300, coins: 1500 },
  topPlayer: { xp: 500, coins: 2000, freeTicket: true },
  topTeam: { coins: 5000, discountPercent: 20 },
  topGame: { title: 'بازی منتخب ماه' },
};

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
    timeZone: TEHRAN_TZ,
    name: 'monthly_rewards_auto',
  })
  async autoMonthlyRewards() {
    const now = DateTime.now().setZone(TEHRAN_TZ).minus({ months: 1 });
    const prevYear = now.year;
    const prevMonth = now.month;

    this.logger.log(
      `Auto monthly rewards for ${prevYear}-${String(prevMonth).padStart(2, '0')}`,
    );

    await this.compute(prevYear, prevMonth);
    await this.distribute(prevYear, prevMonth, null);
  }

  // ─── Compute winners ──────────────────────────────────────────────────────────

  async compute(year: number, month: number): Promise<any> {
    const rewards = await this.getRewardsConfig();
    const { startDate, endDate } = this.getMonthRange(year, month);
    const [topPlayers, topGames, topTeam] = await Promise.all([
      this.getTopPlayers(year, month, Math.max(20, rewards.raffle?.eligiblePoolSize ?? 10)),
      this.getTopGames(year, month, 20),
      this.getTopTeam(startDate, endDate),
    ]);

    const topPlayer = topPlayers[0] ?? null;
    const topGame = topGames[0] ?? null;
    const raffleSelection = this.selectRaffleWinner(topPlayers, rewards, year, month);

    await this.upsertWinner(
      year,
      month,
      'TOP_PLAYER',
      topPlayer?.userId ?? null,
      null,
      null,
      {
        reward: rewards.topPlayer ?? {},
        reason: topPlayer
          ? `بیشترین امتیاز عملکرد ماهانه با ${topPlayer.xpGained} XP و ${topPlayer.completedBookings} رزرو تکمیل‌شده.`
          : 'در این ماه بازیکن واجد شرایطی ثبت نشد.',
        metrics: topPlayer,
      },
    );

    await this.upsertWinner(
      year,
      month,
      'TOP_TEAM',
      null,
      topTeam?.teamId ?? null,
      null,
      {
        reward: rewards.topTeam ?? {},
        reason: topTeam
          ? `بیشترین رزرو تکمیل‌شده تیمی در ماه با ${topTeam.bookingCount} رزرو.`
          : 'در این ماه تیم واجد شرایطی ثبت نشد.',
        metrics: topTeam,
      },
    );

    await this.upsertWinner(
      year,
      month,
      'TOP_GAME',
      null,
      null,
      topGame?.gameId ?? null,
      {
        reward: rewards.topGame ?? {},
        reason: topGame
          ? `بازی منتخب ماه بر اساس ${topGame.bookingsCount} رزرو و ${topGame.revenue} تومان درآمد.`
          : 'در این ماه بازی واجد شرایطی ثبت نشد.',
        metrics: topGame,
      },
    );

    await this.upsertWinner(
      year,
      month,
      'RAFFLE_WINNER',
      raffleSelection?.winner.userId ?? null,
      null,
      null,
      {
        reward: rewards.raffleWinner ?? rewards.topPlayer ?? {},
        reason: raffleSelection
          ? `از بین ${raffleSelection.eligibleCount} بازیکن واجد شرایط با قرعه‌کشی وزنی عملکرد انتخاب شد.`
          : 'برای قرعه‌کشی این ماه بازیکن واجد شرایطی وجود نداشت.',
        selection: raffleSelection
          ? {
              strategy: raffleSelection.strategy,
              eligibleCount: raffleSelection.eligibleCount,
              seed: raffleSelection.seed,
              poolSize: rewards.raffle?.eligiblePoolSize ?? 10,
            }
          : null,
        metrics: raffleSelection?.winner ?? null,
      },
    );

    return {
      year,
      month,
      topPlayer,
      topTeam,
      topGame,
      raffleWinner: raffleSelection?.winner ?? null,
      topPlayers: topPlayers.slice(0, 10),
      topGames: topGames.slice(0, 10),
    };
  }

  private async upsertWinner(
    year: number,
    month: number,
    type: WinnerType,
    winnerUserId: string | null,
    winnerTeamId: string | null,
    winnerGameId: string | null,
    prizeJson: any,
  ) {
    await this.prisma.monthlyWinner.upsert({
      where: { year_month_type: { year, month, type: type as any } },
      create: {
        year,
        month,
        type: type as any,
        winnerUserId,
        winnerTeamId,
        winnerGameId,
        prizeJson,
      } as any,
      update: {
        winnerUserId,
        winnerTeamId,
        winnerGameId,
        prizeJson,
      } as any,
    });
  }

  // ─── Distribute prizes ────────────────────────────────────────────────────────

  async distribute(
    year: number,
    month: number,
    customPrizes: MonthlyRewardsConfig | null,
  ): Promise<void> {
    let records = await this.prisma.monthlyWinner.findMany({
      where: { year, month },
    });
    if (!records.length) {
      await this.compute(year, month);
      records = await this.prisma.monthlyWinner.findMany({ where: { year, month } });
    }

    const pendingRecords = records.filter((record) => !record.distributedAt);
    if (!pendingRecords.length) return;

    const defaultPrizes = await this.getRewardsConfig();
    const prizes = customPrizes || defaultPrizes;
    const playerRec = pendingRecords.find((r) => String(r.type) === 'TOP_PLAYER');
    const teamRec = pendingRecords.find((r) => String(r.type) === 'TOP_TEAM');
    const raffleRec = pendingRecords.find((r) => String(r.type) === 'RAFFLE_WINNER');

    if (playerRec?.winnerUserId && prizes.topPlayer) {
      await this.applyPrize(
        playerRec.winnerUserId,
        prizes.topPlayer,
        `جایزه بازیکن برتر ماه ${year}/${month}`,
        playerRec.id,
      );
      await this.notifications.send({
        userId: playerRec.winnerUserId,
        type: NotificationType.MONTHLY_WINNER,
        title: `برنده بازیکن برتر ماه ${month}/${year}`,
        body: 'تبریک! شما بهترین بازیکن این ماه بودید.',
        link: '/raffle',
        data: { prizes: prizes.topPlayer, monthlyWinnerId: playerRec.id },
      });
    }

    if (raffleRec?.winnerUserId) {
      const prize = prizes.raffleWinner ?? prizes.topPlayer ?? {};
      await this.applyPrize(
        raffleRec.winnerUserId,
        prize,
        `جایزه قرعه‌کشی ماهانه ${year}/${month}`,
        raffleRec.id,
      );
      await this.notifications.send({
        userId: raffleRec.winnerUserId,
        type: NotificationType.MONTHLY_WINNER,
        title: `برنده قرعه‌کشی ماه ${month}/${year}`,
        body: 'تبریک! شما برنده قرعه‌کشی ماهانه شدید.',
        link: '/raffle',
        data: { prizes: prize, monthlyWinnerId: raffleRec.id },
      });
    }

    if (teamRec?.winnerTeamId && prizes.topTeam) {
      const team = await this.prisma.team.findUnique({
        where: { id: teamRec.winnerTeamId },
        include: { members: { select: { userId: true } } },
      });

      if (team) {
        for (const member of team.members) {
          await this.applyPrize(
            member.userId,
            prizes.topTeam,
            `جایزه تیم برتر ماه ${year}/${month}`,
            teamRec.id,
          );
          await this.notifications.send({
            userId: member.userId,
            type: NotificationType.MONTHLY_WINNER,
            title: 'تیم برتر ماه',
            body: `تیم "${team.name}" برنده شد.`,
            link: '/raffle',
            data: { prizes: prizes.topTeam, monthlyWinnerId: teamRec.id },
          });
        }
      }
    }

    await this.prisma.monthlyWinner.updateMany({
      where: { year, month, distributedAt: null },
      data: { distributedAt: new Date() },
    });
  }

  async getWinners(year: number, month: number) {
    const records = await this.prisma.monthlyWinner.findMany({
      where: { year, month },
      include: this.winnerInclude(),
    });
    const byType: any = {
      year,
      month,
      topPlayer: null,
      topTeam: null,
      topGame: null,
      raffleWinner: null,
      distributedAt: null,
    };
    for (const r of records as any[]) {
      if (r.type === 'TOP_PLAYER') byType.topPlayer = r;
      else if (r.type === 'TOP_TEAM') byType.topTeam = r;
      else if (r.type === 'TOP_GAME') byType.topGame = r;
      else if (r.type === 'RAFFLE_WINNER') byType.raffleWinner = r;
      if (r.distributedAt && !byType.distributedAt) byType.distributedAt = r.distributedAt;
    }
    return byType;
  }

  async getHistory() {
    return this.prisma.monthlyWinner.findMany({
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { createdAt: 'desc' }],
      take: 48,
      include: this.winnerInclude(),
    });
  }

  async getPublicRaffleOverview(year?: number, month?: number) {
    const current = this.getCurrentPeriod();
    const targetYear = year || current.year;
    const targetMonth = month || current.month;
    const { startDate, endDate } = this.getMonthRange(targetYear, targetMonth);
    const [winners, topPlayers, topGames, rewards, history] = await Promise.all([
      this.getWinners(targetYear, targetMonth),
      this.getTopPlayers(targetYear, targetMonth, 10),
      this.getTopGames(targetYear, targetMonth, 10),
      this.getRewardsConfig(),
      this.getHistory(),
    ]);

    const selected = winners.raffleWinner;
    const now = DateTime.now().setZone(TEHRAN_TZ);
    const periodEnd = DateTime.fromJSDate(endDate).setZone(TEHRAN_TZ);
    const isClosed = periodEnd <= now;
    const status = winners.distributedAt
      ? 'REWARDED'
      : selected
        ? 'SELECTED'
        : isClosed
          ? 'READY_TO_DRAW'
          : 'OPEN';

    return {
      period: {
        year: targetYear,
        month: targetMonth,
        startDate,
        endDate,
        isCurrentMonth: targetYear === current.year && targetMonth === current.month,
      },
      status,
      statusLabel: this.statusLabel(status),
      reward: rewards.raffleWinner ?? rewards.topPlayer ?? {},
      selection: {
        strategy: rewards.raffle?.strategy ?? 'WEIGHTED_TOP_PLAYERS',
        eligiblePoolSize: rewards.raffle?.eligiblePoolSize ?? 10,
        minScore: rewards.raffle?.minScore ?? 1,
        explanation:
          'برنده قرعه‌کشی از میان بازیکنان واجد شرایط ماه انتخاب می‌شود. وزن هر نفر بر اساس XP، رزرو تکمیل‌شده و مبلغ پرداختی همان ماه محاسبه می‌شود.',
      },
      selectedWinner: selected ? this.toPublicWinner(selected) : null,
      currentLeader: topPlayers[0] ?? null,
      topPlayer: winners.topPlayer ? this.toPublicWinner(winners.topPlayer) : null,
      topGame: winners.topGame ? this.toPublicGameWinner(winners.topGame) : null,
      topPlayers,
      topGames,
      previousWinners: this.groupPublicHistory(history as any[]),
    };
  }

  private async getTopPlayers(year: number, month: number, limit: number): Promise<PlayerStanding[]> {
    const { startDate, endDate } = this.getMonthRange(year, month);
    const [xpGroups, bookingGroups] = await Promise.all([
      this.prisma.xpHistory.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: startDate, lt: endDate } },
        _sum: { amount: true },
      }),
      this.prisma.booking.groupBy({
        by: ['userId'],
        where: {
          status: 'COMPLETED',
          createdAt: { gte: startDate, lt: endDate },
        },
        _count: { id: true },
        _sum: { totalAmount: true },
      }),
    ]);

    const xpByUser = new Map(xpGroups.map((row) => [row.userId, Number(row._sum.amount ?? 0)]));
    const bookingsByUser = new Map(
      bookingGroups.map((row) => [
        row.userId,
        {
          completedBookings: row._count.id,
          totalSpent: Number(row._sum.totalAmount ?? 0),
        },
      ]),
    );
    const userIds = [...new Set([...xpByUser.keys(), ...bookingsByUser.keys()])];
    if (!userIds.length) return [];

    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds }, isActive: true, isBanned: false, deletedAt: null } as any,
      select: {
        id: true,
        fullName: true,
        nickname: true,
        avatarUrl: true,
        profile: { select: { levelId: true } },
      },
    });
    const userMap = new Map(users.map((user) => [user.id, user]));
    const minScore = Math.max(0, Number((await this.getRewardsConfig()).raffle?.minScore ?? 1));

    return userIds
      .map((userId) => {
        const user = userMap.get(userId);
        if (!user) return null;
        const xpGained = xpByUser.get(userId) ?? 0;
        const bookingStats = bookingsByUser.get(userId) ?? { completedBookings: 0, totalSpent: 0 };
        const score = xpGained + bookingStats.completedBookings * 50 + Math.floor(bookingStats.totalSpent / 10000);
        return {
          rank: 0,
          userId,
          name: this.resolvePublicDisplayName(user),
          avatarUrl: user.avatarUrl,
          level: (user as any).profile?.levelId ?? 1,
          xpGained,
          completedBookings: bookingStats.completedBookings,
          totalSpent: bookingStats.totalSpent,
          score,
          isEligible: score >= minScore,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b!.score - a!.score || b!.xpGained - a!.xpGained)
      .slice(0, limit)
      .map((row, index) => ({ ...row!, rank: index + 1 }));
  }

  private async getTopGames(year: number, month: number, limit: number): Promise<GameStanding[]> {
    const { startDate, endDate } = this.getMonthRange(year, month);
    const groups = await this.prisma.booking.groupBy({
      by: ['gameId'],
      where: {
        status: { in: ['CONFIRMED' as any, 'COMPLETED' as any] },
        createdAt: { gte: startDate, lt: endDate },
      },
      _count: { id: true },
      _sum: { totalAmount: true, playersCount: true },
    });

    const gameIds = groups.map((row) => row.gameId);
    if (!gameIds.length) return [];

    const games = await this.prisma.game.findMany({
      where: { id: { in: gameIds }, isActive: true },
      select: {
        id: true,
        title: true,
        slug: true,
        coverImage: true,
        siteRank: true,
      },
    });
    const gameMap = new Map(games.map((game) => [game.id, game]));

    return groups
      .map((row) => {
        const game = gameMap.get(row.gameId);
        if (!game) return null;
        const bookingsCount = row._count.id;
        const playersCount = Number(row._sum.playersCount ?? 0);
        const revenue = Number(row._sum.totalAmount ?? 0);
        const score = bookingsCount * 100 + playersCount * 10 + Math.floor(revenue / 100000);
        return {
          rank: 0,
          gameId: row.gameId,
          title: game.title,
          slug: game.slug,
          coverImage: game.coverImage,
          bookingsCount,
          playersCount,
          revenue,
          siteRank: Number(game.siteRank ?? 0),
          score,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b!.score - a!.score || b!.revenue - a!.revenue)
      .slice(0, limit)
      .map((row, index) => ({ ...row!, rank: index + 1 }));
  }

  private async getTopTeam(startDate: Date, endDate: Date) {
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
    const countByUser = new Map(memberBookings.map((b) => [b.userId, b._count.id]));

    let topTeam: { teamId: string; bookingCount: number } | null = null;
    let maxBookings = 0;
    for (const team of teams) {
      const bookingCount = team.members.reduce(
        (sum, member) => sum + (countByUser.get(member.userId) ?? 0),
        0,
      );
      if (bookingCount > maxBookings) {
        maxBookings = bookingCount;
        topTeam = { teamId: team.id, bookingCount };
      }
    }
    return topTeam;
  }

  private selectRaffleWinner(
    topPlayers: PlayerStanding[],
    rewards: MonthlyRewardsConfig,
    year: number,
    month: number,
  ) {
    const strategy = rewards.raffle?.strategy ?? 'WEIGHTED_TOP_PLAYERS';
    const poolSize = Math.max(1, Number(rewards.raffle?.eligiblePoolSize ?? 10));
    const minScore = Math.max(0, Number(rewards.raffle?.minScore ?? 1));
    const eligible = topPlayers
      .filter((player) => player.score >= minScore)
      .slice(0, poolSize);

    if (!eligible.length) return null;

    if (strategy === 'TOP_PLAYER') {
      return {
        winner: eligible[0],
        eligibleCount: eligible.length,
        strategy,
        seed: `${year}-${month}-top-player`,
      };
    }

    const seed = `${year}-${month}-${eligible.map((player) => `${player.userId}:${player.score}`).join('|')}`;
    const totalWeight = eligible.reduce((sum, player) => sum + Math.max(1, player.score), 0);
    let threshold = this.seededUnit(seed) * totalWeight;

    for (const player of eligible) {
      threshold -= Math.max(1, player.score);
      if (threshold <= 0) {
        return {
          winner: player,
          eligibleCount: eligible.length,
          strategy,
          seed,
        };
      }
    }

    return {
      winner: eligible[eligible.length - 1],
      eligibleCount: eligible.length,
      strategy,
      seed,
    };
  }

  private async applyPrize(userId: string, prize: Prize, description: string, refId: string) {
    if (prize.xp) {
      await this.levelingService.applyXp(userId, Number(prize.xp), 'monthly_winner');
    }
    if (prize.coins) {
      await this.addWalletCurrency(userId, 'coinsBalance', 'COINS', Number(prize.coins), description, refId);
    }
    if (prize.diamonds) {
      await this.addWalletCurrency(userId, 'diamondsBalance', 'DIAMONDS', Number(prize.diamonds), description, refId);
    }
    if (prize.freeTicket) {
      await this.prisma.freeTicket.create({
        data: {
          userId,
          source: 'MONTHLY_REWARD',
          expiresAt: new Date(Date.now() + 30 * 24 * 3600_000),
        },
      });
    }
    if (prize.discountCode) {
      await this.prisma.discountCode.create({
        data: {
          code: `MONTHLY-${Date.now()}-${userId.slice(-4)}`,
          name: description,
          type: 'PERCENT',
          value: Number(prize.discountPercent ?? 20),
          validUntil: new Date(Date.now() + 30 * 24 * 3600_000),
          maxUses: 1,
          gameIds: [],
        },
      });
    }
  }

  private async addWalletCurrency(
    userId: string,
    balanceField: 'coinsBalance' | 'diamondsBalance',
    currency: 'COINS' | 'DIAMONDS',
    amount: number,
    description: string,
    refId: string,
  ) {
    const wallet = await this.prisma.wallet.upsert({
      where: { userId },
      update: { [balanceField]: { increment: amount } },
      create: { userId, [balanceField]: amount },
      select: { id: true, [balanceField]: true },
    } as any);
    await this.prisma.transaction.create({
      data: {
        walletId: wallet.id,
        type: 'MONTHLY_REWARD',
        amount,
        balanceAfter: wallet[balanceField],
        currency,
        refType: 'MONTHLY_REWARD',
        refId,
        description,
      } as any,
    });
  }

  private async getRewardsConfig(): Promise<MonthlyRewardsConfig> {
    const raw = await this.settings.get('gamification.monthly_rewards', '{}');
    try {
      return { ...DEFAULT_REWARDS, ...(JSON.parse(raw) as MonthlyRewardsConfig) };
    } catch {
      this.logger.error('Failed to parse monthly_rewards setting — using defaults');
      return DEFAULT_REWARDS;
    }
  }

  private getCurrentPeriod() {
    const now = DateTime.now().setZone(TEHRAN_TZ);
    return { year: now.year, month: now.month };
  }

  private getMonthRange(year: number, month: number) {
    const start = DateTime.fromObject({ year, month, day: 1 }, { zone: TEHRAN_TZ }).startOf('day');
    const end = start.plus({ months: 1 });
    return { startDate: start.toJSDate(), endDate: end.toJSDate() };
  }

  private winnerInclude() {
    return {
      winnerUser: {
        select: {
          id: true,
          fullName: true,
          nickname: true,
          avatarUrl: true,
          profile: { select: { levelId: true } },
        },
      } as any,
      winnerTeam: { select: { id: true, name: true } } as any,
      winnerGame: { select: { id: true, title: true, slug: true, coverImage: true } } as any,
    } as any;
  }

  private toPublicWinner(record: any) {
    const metrics = record?.prizeJson?.metrics ?? {};
    const user = record?.winnerUser;
    if (!user) return null;
    return {
      id: record.id,
      year: record.year,
      month: record.month,
      type: record.type,
      distributedAt: record.distributedAt,
      reason: record.prizeJson?.reason,
      prize: record.prizeJson?.reward ?? record.prizeJson,
      selection: record.prizeJson?.selection ?? null,
      user: {
        id: user.id,
        name: this.resolvePublicDisplayName(user),
        avatarUrl: user.avatarUrl,
        level: user.profile?.levelId ?? metrics.level ?? 1,
      },
      metrics,
    };
  }

  private toPublicGameWinner(record: any) {
    const metrics = record?.prizeJson?.metrics ?? {};
    const game = record?.winnerGame;
    if (!game) return null;
    return {
      id: record.id,
      year: record.year,
      month: record.month,
      type: record.type,
      distributedAt: record.distributedAt,
      reason: record.prizeJson?.reason,
      prize: record.prizeJson?.reward ?? record.prizeJson,
      game: {
        id: game.id,
        title: game.title,
        slug: game.slug,
        coverImage: game.coverImage,
      },
      metrics,
    };
  }

  private groupPublicHistory(records: any[]) {
    const grouped = new Map<string, any>();
    for (const record of records) {
      const key = `${record.year}-${record.month}`;
      const item = grouped.get(key) ?? {
        year: record.year,
        month: record.month,
        distributedAt: null,
        raffleWinner: null,
        topPlayer: null,
        topGame: null,
      };
      if (record.type === 'RAFFLE_WINNER') item.raffleWinner = this.toPublicWinner(record);
      if (record.type === 'TOP_PLAYER') item.topPlayer = this.toPublicWinner(record);
      if (record.type === 'TOP_GAME') item.topGame = this.toPublicGameWinner(record);
      if (record.distributedAt && !item.distributedAt) item.distributedAt = record.distributedAt;
      grouped.set(key, item);
    }
    return [...grouped.values()]
      .filter((item) => item.raffleWinner || item.topPlayer || item.topGame)
      .slice(0, 8);
  }

  private resolvePublicDisplayName(user: {
    nickname?: string | null;
    fullName?: string | null;
  }) {
    return user.nickname || user.fullName || 'بازیکن تیک تاک ران';
  }

  private statusLabel(status: string) {
    if (status === 'REWARDED') return 'جایزه پرداخت شده';
    if (status === 'SELECTED') return 'برنده انتخاب شده';
    if (status === 'READY_TO_DRAW') return 'آماده قرعه‌کشی';
    return 'در حال رقابت';
  }

  private seededUnit(seed: string) {
    let hash = 2166136261;
    for (let i = 0; i < seed.length; i += 1) {
      hash ^= seed.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0) / 4294967296;
  }
}
