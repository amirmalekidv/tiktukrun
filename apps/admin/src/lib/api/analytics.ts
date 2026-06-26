import { adminApi } from './client'
import { mockApi, USE_MOCK } from '../mock-admin-api'

export const analyticsApi = {
  getOverview: async () => {
    if (USE_MOCK) return mockApi.getOverview()
    const res = await adminApi.get('/analytics/overview', {
      params: { format: 'formatted' },
    })
    return res.data
  },
}
