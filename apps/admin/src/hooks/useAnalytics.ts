'use client'
import useSWR from 'swr'
import { analyticsApi } from '@/lib/api/analytics'

export function useOverview() {
  return useSWR('analytics-overview', () => analyticsApi.getOverview(), {
    revalidateOnFocus: false,
    refreshInterval: 60000, // Refresh every 60 seconds
  })
}
