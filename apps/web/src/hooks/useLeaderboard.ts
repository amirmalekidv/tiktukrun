'use client';
import { useState } from 'react';
import useSWR from 'swr';
import { leaderboardApi } from '@/lib/api/leaderboard';

type Period = 'week' | 'month' | 'all';

export function useLeaderboard() {
  const [period, setPeriod] = useState<Period>('week');
  const [page, setPage] = useState(1);

  const { data, error, isLoading } = useSWR(
    ['leaderboard', period, page],
    ([, p, pg]) =>
      leaderboardApi.getLeaderboard(p as Period, pg as number).catch(() => null),
    { keepPreviousData: true }
  );

  const { data: myRankData } = useSWR(
    'leaderboard-me',
    () => leaderboardApi.getMyRank().catch(() => null)
  );

  return {
    entries: data?.entries ?? [],
    myRank: myRankData?.rank ?? null,
    total: data?.total ?? 0,
    period,
    setPeriod: (p: Period) => { setPeriod(p); setPage(1); },
    page,
    setPage,
    isLoading,
    error,
  };
}
