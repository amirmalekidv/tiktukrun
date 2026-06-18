'use client'
import useSWR from 'swr'
import { segmentsApi } from '@/lib/api/segments'

export function useSegments() {
  return useSWR('segments', () => segmentsApi.list(), { revalidateOnFocus: false })
}

export function useSegmentMembers(id: string, params?: Record<string, unknown>) {
  return useSWR(id ? `segment-members-${id}` : null, () => segmentsApi.getMembers(id, params))
}
