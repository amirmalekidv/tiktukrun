import api from '../api'
import { mockApi, USE_MOCK } from '../mock-admin-api'

export const campaignsApi = {
  list: () =>
    USE_MOCK ? mockApi.getCampaigns() : api.get('/campaigns').then(r => r.data),

  get: (id: string) =>
    USE_MOCK ? mockApi.getCampaign(id) : api.get(`/campaigns/${id}`).then(r => r.data),

  create: (data: unknown) =>
    USE_MOCK ? mockApi.createCampaign(data) : api.post('/campaigns', data).then(r => r.data),

  update: (id: string, data: unknown) =>
    USE_MOCK ? mockApi.updateCampaign(id, data) : api.patch(`/campaigns/${id}`, data).then(r => r.data),

  launch: (id: string) =>
    USE_MOCK ? mockApi.launchCampaign(id) : api.post(`/campaigns/${id}/launch`).then(r => r.data),

  pause: (id: string) =>
    USE_MOCK ? Promise.resolve({ success: true }) : api.post(`/campaigns/${id}/pause`).then(r => r.data),

  resume: (id: string) =>
    USE_MOCK ? Promise.resolve({ success: true }) : api.post(`/campaigns/${id}/resume`).then(r => r.data),

  duplicate: (id: string) =>
    USE_MOCK ? Promise.resolve({ success: true }) : api.post(`/campaigns/${id}/duplicate`).then(r => r.data),

  delete: (id: string) =>
    USE_MOCK ? Promise.resolve({ success: true }) : api.delete(`/campaigns/${id}`).then(r => r.data),
}
