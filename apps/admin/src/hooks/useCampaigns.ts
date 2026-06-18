'use client'
import useSWR from 'swr'
import { campaignsApi } from '@/lib/api/campaigns'

export function useCampaigns() {
  return useSWR('campaigns', () => campaignsApi.list(), { revalidateOnFocus: false })
}

export function useCampaign(id: string) {
  return useSWR(id ? `campaign-${id}` : null, () => campaignsApi.get(id))
}
