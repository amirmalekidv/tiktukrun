import api from '../api'
import { mockApi, USE_MOCK } from '../mock-admin-api'
import type { SegmentRule } from '@/types'

export const segmentsApi = {
  list: () =>
    USE_MOCK ? mockApi.getSegments() : api.get('/segments').then(r => r.data),

  getMembers: (id: string, params?: Record<string, unknown>) =>
    USE_MOCK ? mockApi.getSegmentMembers(id, params) : api.get(`/segments/${id}/members`, { params }).then(r => r.data),

  preview: (rules: SegmentRule[], logic: 'AND' | 'OR') =>
    USE_MOCK ? mockApi.previewSegment(rules, logic) : api.post('/segments/preview', { rules, logic }).then(r => r.data),

  create: (data: unknown) =>
    USE_MOCK ? mockApi.createSegment(data) : api.post('/segments', data).then(r => r.data),

  update: (id: string, data: unknown) =>
    USE_MOCK ? Promise.resolve({ success: true, data }) : api.patch(`/segments/${id}`, data).then(r => r.data),

  delete: (id: string) =>
    USE_MOCK ? Promise.resolve({ success: true }) : api.delete(`/segments/${id}`).then(r => r.data),
}
