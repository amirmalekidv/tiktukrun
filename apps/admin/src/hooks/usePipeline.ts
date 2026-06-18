'use client'
import useSWR from 'swr'
import { pipelineApi } from '@/lib/api/pipeline'

export function usePipeline() {
  return useSWR('pipeline', () => pipelineApi.list(), { revalidateOnFocus: false })
}
