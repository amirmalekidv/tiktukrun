import api from '../api'
import { mockApi, USE_MOCK } from '../mock-admin-api'

export const analyticsApi = {
  getOverview: () =>
    USE_MOCK ? mockApi.getOverview() : api.get('/analytics/overview').then(r => r.data),
}
