import { apiFetch } from '../http';

export interface MonthlyPrize {
  xp?: number;
  coins?: number;
  diamonds?: number;
  freeTicket?: boolean;
  discountCode?: boolean;
  discountPercent?: number;
  title?: string;
}

export interface MonthlyPlayerStanding {
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

export interface MonthlyGameStanding {
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

export interface PublicMonthlyWinner {
  id: string;
  year: number;
  month: number;
  type: 'TOP_PLAYER' | 'TOP_TEAM' | 'TOP_GAME' | 'RAFFLE_WINNER';
  distributedAt?: string | null;
  reason?: string;
  prize?: MonthlyPrize;
  selection?: {
    strategy?: string;
    eligibleCount?: number;
    poolSize?: number;
  } | null;
  user?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
    level?: number;
  };
  game?: {
    id: string;
    title: string;
    slug: string;
    coverImage?: string | null;
  };
  metrics?: Record<string, unknown>;
}

export interface MonthlyHistoryItem {
  year: number;
  month: number;
  distributedAt?: string | null;
  raffleWinner?: PublicMonthlyWinner | null;
  topPlayer?: PublicMonthlyWinner | null;
  topGame?: PublicMonthlyWinner | null;
}

export interface MonthlyRaffleOverview {
  period: {
    year: number;
    month: number;
    startDate: string;
    endDate: string;
    isCurrentMonth: boolean;
  };
  status: 'OPEN' | 'READY_TO_DRAW' | 'SELECTED' | 'REWARDED';
  statusLabel: string;
  reward: MonthlyPrize;
  selection: {
    strategy: string;
    eligiblePoolSize: number;
    minScore: number;
    explanation: string;
  };
  selectedWinner?: PublicMonthlyWinner | null;
  currentLeader?: MonthlyPlayerStanding | null;
  topPlayer?: PublicMonthlyWinner | null;
  topGame?: PublicMonthlyWinner | null;
  topPlayers: MonthlyPlayerStanding[];
  topGames: MonthlyGameStanding[];
  previousWinners: MonthlyHistoryItem[];
}

export const monthlyApi = {
  getRaffle: () => apiFetch<MonthlyRaffleOverview>('/monthly/raffle'),
};
