import api from '../api'
import { mockApi, USE_MOCK } from '../mock-admin-api'
import type { Deal, PipelineStage } from '@/types'

function toUiStage(stage: unknown): PipelineStage {
  return stage === 'LEADS' ? 'LEAD' : (stage as PipelineStage)
}

function toApiStage(stage: string): string {
  return stage === 'LEAD' ? 'LEADS' : stage
}

function normalizeDeal(raw: any): Deal {
  return {
    id: String(raw?.id ?? ''),
    title: String(raw?.title ?? raw?.name ?? ''),
    customerId: String(raw?.customerId ?? raw?.customer?.id ?? ''),
    customerName: String(raw?.customerName ?? raw?.customer?.fullName ?? 'مشتری نامشخص'),
    customerAvatar: raw?.customerAvatar ?? raw?.customer?.avatarUrl ?? undefined,
    value: Number(raw?.value ?? 0),
    stage: toUiStage(raw?.stage),
    tag: raw?.tag ?? undefined,
    tagColor: raw?.tagColor ?? undefined,
    expectedCloseDate: raw?.expectedCloseDate ? String(raw.expectedCloseDate) : '',
    assignedTo: raw?.assignedTo ?? raw?.owner?.fullName ?? undefined,
    description: raw?.description ?? raw?.notes ?? undefined,
    position: Number(raw?.position ?? 0),
    createdAt: String(raw?.createdAt ?? ''),
    updatedAt: String(raw?.updatedAt ?? ''),
  }
}

function normalizeDeals(data: unknown): Deal[] {
  if (Array.isArray(data)) {
    return data.map(normalizeDeal)
  }

  if (data && typeof data === 'object') {
    return Object.values(data).flatMap((value) =>
      Array.isArray(value) ? value.map(normalizeDeal) : [],
    )
  }

  return []
}

export const pipelineApi = {
  list: async () => {
    const res = USE_MOCK
      ? await mockApi.getPipeline()
      : await api.get('/pipeline', { params: { format: 'flat' } }).then(r => r.data)

    return {
      ...res,
      data: normalizeDeals(res?.data),
    }
  },

  move: (id: string, newStage: string, newPosition: number) =>
    USE_MOCK
      ? mockApi.moveDeal(id, newStage, newPosition)
      : api.patch(`/pipeline/${id}/move`, { newStage: toApiStage(newStage), newPosition }).then(r => r.data),

  create: (data: unknown) =>
    USE_MOCK ? mockApi.createDeal(data) : api.post('/pipeline', data).then(r => r.data),

  update: (id: string, data: unknown) =>
    USE_MOCK ? mockApi.updateDeal(id, data) : api.patch(`/pipeline/${id}`, data).then(r => r.data),

  delete: (id: string) =>
    USE_MOCK ? mockApi.deleteDeal(id) : api.delete(`/pipeline/${id}`).then(r => r.data),
}
