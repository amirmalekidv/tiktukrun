import api from '../api'
import { mockApi, USE_MOCK } from '../mock-admin-api'

export const pipelineApi = {
  list: () =>
    USE_MOCK ? mockApi.getPipeline() : api.get('/pipeline').then(r => r.data),

  move: (id: string, newStage: string, newPosition: number) =>
    USE_MOCK ? mockApi.moveDeal(id, newStage, newPosition) : api.patch(`/pipeline/${id}/move`, { newStage, newPosition }).then(r => r.data),

  create: (data: unknown) =>
    USE_MOCK ? mockApi.createDeal(data) : api.post('/pipeline', data).then(r => r.data),

  update: (id: string, data: unknown) =>
    USE_MOCK ? mockApi.updateDeal(id, data) : api.patch(`/pipeline/${id}`, data).then(r => r.data),

  delete: (id: string) =>
    USE_MOCK ? mockApi.deleteDeal(id) : api.delete(`/pipeline/${id}`).then(r => r.data),
}
