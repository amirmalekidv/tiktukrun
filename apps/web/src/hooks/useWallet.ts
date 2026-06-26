'use client';
import useSWR from 'swr';
import { walletApi } from '@/lib/api/wallet';

const walletFetcher = () => walletApi.getWallet().catch(() => null);
const txFetcher = ([, page, type]: [string, number, string?]) =>
  walletApi.getTransactions({ page, type }).catch(() => null);

export function useWallet() {
  const { data, error, isLoading, mutate } = useSWR(
    'wallet',
    walletFetcher,
    { refreshInterval: 30000 }
  );
  return {
    wallet: (data as { wallet?: unknown } | null)?.wallet ?? data ?? null,
    isLoading,
    error,
    mutate,
  };
}

export function useTransactions(page = 1, type?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    ['wallet-transactions', page, type] as [string, number, string?],
    txFetcher,
    {
      // keepPreviousData is SWR v2 option — keep data while loading next page
      keepPreviousData: true,
    }
  );
  return {
    transactions: (data as { transactions?: unknown[]; items?: unknown[] } | null)?.transactions
      ?? (data as { items?: unknown[] } | null)?.items
      ?? [],
    total: (data as { total?: number } | null)?.total ?? 0,
    isLoading,
    error,
    mutate,
  };
}
