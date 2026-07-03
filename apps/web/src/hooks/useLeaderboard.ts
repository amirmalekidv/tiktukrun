'use client';
import { useState } from 'react';
import useSWR from 'swr';
import useSWRInfinite from 'swr/infinite';
import {
  leaderboardApi,
  mapLeaderboardRows,
  type LeaderboardPeriod,
} from '@/lib/api/leaderboard';

const PAGE_SIZE = 25;

export function useLeaderboard() {
  const [period, setPeriod] = useState<LeaderboardPeriod>('all');

  const {
    data,
    error,
    isLoading,
    isValidating,
    size,
    setSize,
  } = useSWRInfinite(
    (index: number, previousPageData: ReturnType<typeof mapLeaderboardRows> | null) => {
      if (previousPageData && previousPageData.length < PAGE_SIZE) return null;
      return ['leaderboard', period, index + 1] as const;
    },
    ([, currentPeriod, page]: readonly [string, LeaderboardPeriod, number]) =>
      leaderboardApi
        .getLeaderboard({ type: 'xp', period: currentPeriod, limit: PAGE_SIZE, page })
        .then(mapLeaderboardRows)
        .catch(() => [] as ReturnType<typeof mapLeaderboardRows>),
    { revalidateFirstPage: false },
  );

  const { data: myRankData } = useSWR(
    ['leaderboard-me', period],
    () => leaderboardApi.getMyRank({ type: 'xp', period }).catch(() => null),
  );

  const pages = data ?? [];
  const entries = pages.flat();
  const lastPage = pages[pages.length - 1] ?? [];
  const hasMore = lastPage.length === PAGE_SIZE;
  const isLoadingMore = isValidating && size > 0;

  return {
    entries,
    myRank: myRankData?.rank ?? null,
    myXp: myRankData?.xp ?? null,
    total: entries.length,
    period,
    setPeriod,
    loadMore: () => setSize((current: number) => current + 1),
    hasMore,
    isLoadingMore,
    isLoading,
    error,
  };
}
