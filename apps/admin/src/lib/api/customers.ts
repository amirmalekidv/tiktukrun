import api from '../api'
import { mockApi, USE_MOCK } from '../mock-admin-api'
import type { CustomerFilterParams } from '@/types'

export const customersApi = {
  list: (params?: CustomerFilterParams) =>
    USE_MOCK ? mockApi.getCustomers(params as Record<string, unknown>) : api.get('/customers', { params }).then(r => r.data),

  get: (id: string) =>
    USE_MOCK ? mockApi.getCustomer(id) : api.get(`/customers/${id}`).then(r => r.data),

  getBookings: (id: string) =>
    USE_MOCK ? mockApi.getCustomerBookings(id) : api.get(`/customers/${id}/bookings`).then(r => r.data),

  getTransactions: (id: string) =>
    USE_MOCK ? mockApi.getCustomerTransactions(id) : api.get(`/customers/${id}/transactions`).then(r => r.data),

  getReviews: (id: string) =>
    USE_MOCK ? mockApi.getCustomerReviews(id) : api.get(`/customers/${id}/reviews`).then(r => r.data),

  getNotes: (id: string) =>
    USE_MOCK ? mockApi.getCustomerNotes(id) : api.get(`/customers/${id}/notes`).then(r => r.data),

  addNote: (id: string, content: string) =>
    USE_MOCK ? mockApi.addNote(id, content) : api.post(`/customers/${id}/notes`, { text: content }).then(r => r.data),

  ban: (id: string, reason: string) =>
    USE_MOCK ? mockApi.banCustomer(id, reason) : api.post(`/customers/${id}/ban`, { reason }).then(r => r.data),

  unban: (id: string) =>
    USE_MOCK ? mockApi.unbanCustomer(id) : api.post(`/customers/${id}/unban`).then(r => r.data),

  grantBadge: (id: string, badge: string) =>
    USE_MOCK ? mockApi.grantBadge(id, badge) : api.post(`/customers/${id}/badge`, { badgeCode: badge }).then(r => r.data),

  adjustXp: (id: string, amount: number, reason: string) =>
    USE_MOCK ? mockApi.adjustXp(id, amount, reason) : api.post(`/customers/${id}/xp`, { delta: amount, reason }).then(r => r.data),

  adjustWallet: (id: string, amount: number, reason: string) =>
    USE_MOCK ? mockApi.adjustWallet(id, amount, reason) : api.post(`/customers/${id}/wallet`, { delta: amount, currency: 'TOMAN', reason }).then(r => r.data),
}
