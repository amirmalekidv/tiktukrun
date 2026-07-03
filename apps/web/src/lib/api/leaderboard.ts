import { apiFetch } from '../http';
import type { LeaderboardEntry } from '@/components/leaderboard/Top3Podium';

export type LeaderboardPeriod = 'week' | 'month' | 'all';
export type LeaderboardType = 'xp' | 'bookings' | 'spent';

export interface LeaderboardQuery {
  type?: LeaderboardType;
  period?: LeaderboardPeriod;
  limit?: number;
  page?: number;
}

export function mapLeaderboardRows(raw: unknown): LeaderboardEntry[] {
  const rows =
    Array.isArray(raw)
      ? raw
      : Array.isArray((raw as { data?: unknown[] } | null | undefined)?.data)
        ? ((raw as { data: unknown[] }).data)
        : [];

  return rows.map((row: Record<string, unknown>) => ({
    rank: Number(row.rank ?? 0),
    userId: String(row.userId ?? ''),
    name: String(row.nickname ?? row.name ?? row.fullName ?? 'کاربر'),
    avatar: (row.avatarUrl ?? row.avatar) as string | undefined,
    level: Number(row.level ?? row.levelId ?? 1),
    xp: Number(row.xp ?? row.score ?? 0),
  }));
}

export const leaderboardApi = {
  getLeaderboard: (query: LeaderboardQuery = {}) => {
    const q = new URLSearchParams({
      type: query.type ?? 'xp',
      period: query.period ?? 'all',
      limit: String(query.limit ?? 50),
      page: String(query.page ?? 1),
    });
    return apiFetch<unknown>(`/profile/leaderboard?${q}`);
  },

  getMyRank: (query: Pick<LeaderboardQuery, 'type' | 'period'> = {}) => {
    const q = new URLSearchParams({
      type: query.type ?? 'xp',
      period: query.period ?? 'all',
    });
    return apiFetch<{ rank: number | null; xp: number }>(`/profile/leaderboard/me?${q}`);
  },
};
