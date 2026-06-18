import api from '../api'
import { mockApi, USE_MOCK } from '../mock-admin-api'

export const activitiesApi = {
  list: (params?: Record<string, unknown>) =>
    USE_MOCK ? mockApi.getActivities(params) : api.get('/activities', { params }).then(r => r.data),
}
