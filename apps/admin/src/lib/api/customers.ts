import api from '../api'
import { mockApi, USE_MOCK } from '../mock-admin-api'
import type { ApiResponse, Customer, CustomerFilterParams } from '@/types'

const CUSTOMER_TIERS = new Set(['VIP', 'PLATINUM', 'GOLD', 'SILVER', 'BRONZE', 'AT_RISK', 'NEWCOMER'])

function normalizeCustomer(raw: any): Customer {
  const inferredStatus = raw?.isBanned ? 'BANNED' : raw?.isActive === false ? 'INACTIVE' : 'ACTIVE'
  const inferredTier = CUSTOMER_TIERS.has(String(raw?.status ?? '')) ? raw.status : 'NEWCOMER'
  const tier = CUSTOMER_TIERS.has(String(raw?.tier ?? '')) ? raw.tier : inferredTier
  const status = CUSTOMER_TIERS.has(String(raw?.status ?? '')) ? inferredStatus : raw?.status ?? inferredStatus
  const xp = Number(raw?.xp ?? 0)
  const requiredXp = Number(raw?.xpForNextLevel ?? 1000)

  return {
    ...raw,
    id: String(raw?.id ?? ''),
    name: String(raw?.name ?? raw?.fullName ?? raw?.mobile ?? ''),
    mobile: String(raw?.mobile ?? raw?.phone ?? ''),
    email: raw?.email ?? undefined,
    avatar: raw?.avatar ?? raw?.avatarUrl ?? undefined,
    tier,
    status,
    level: Number(raw?.level ?? raw?.profile?.levelId ?? 1),
    xp,
    xpForNextLevel: Number.isFinite(requiredXp) ? requiredXp : 1000,
    ltv: Number(raw?.ltv ?? raw?.profile?.totalSpent ?? 0),
    totalBookings: Number(raw?.totalBookings ?? raw?.bookings ?? raw?.stats?.totalBookings ?? 0),
    avgRating: Number(raw?.avgRating ?? raw?.stats?.avgRating ?? 0),
    lastActiveAt: String(raw?.lastActiveAt ?? raw?.lastLoginAt ?? raw?.createdAt ?? new Date().toISOString()),
    registeredAt: String(raw?.registeredAt ?? raw?.createdAt ?? raw?.lastActiveAt ?? new Date().toISOString()),
    city: raw?.city ?? raw?.profile?.city?.name ?? undefined,
    tags: Array.isArray(raw?.tags) ? raw.tags : [],
    segment: Array.isArray(raw?.segment) ? raw.segment : [],
    walletBalance: Number(raw?.walletBalance ?? raw?.wallet?.tomanBalance ?? 0),
    coins: Number(raw?.coins ?? raw?.wallet?.coinsBalance ?? 0),
    referredBy: raw?.referredBy ?? undefined,
    totalReferrals: Number(raw?.totalReferrals ?? 0),
  }
}

function normalizeListPayload(payload: ApiResponse<Customer[]>) {
  if (Array.isArray(payload?.data)) {
    payload.data = payload.data.map((customer: any) => normalizeCustomer(customer))
  }
  return payload
}

function normalizeSinglePayload(payload: ApiResponse<Customer>) {
  if (payload?.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
    payload.data = normalizeCustomer(payload.data as any)
  }
  return payload
}

function buildListParams(params?: CustomerFilterParams) {
  if (!params) return undefined

  const mapped = {
    ...params,
    q: params.search,
    segmentId: params.segment,
    ltvMin: params.minLtv,
    ltvMax: params.maxLtv,
  } as Record<string, unknown>

  delete mapped.search
  delete mapped.segment
  delete mapped.minLtv
  delete mapped.maxLtv

  return Object.fromEntries(
    Object.entries(mapped).filter(([, value]) => value !== undefined && value !== null && value !== '')
  )
}

export const customersApi = {
  list: async (params?: CustomerFilterParams) => {
    const requestParams = buildListParams(params)
    if (USE_MOCK) return mockApi.getCustomers(requestParams as Record<string, unknown>)

    const response = await api.get<ApiResponse<Customer[]>>('/customers', { params: requestParams })
    return normalizeListPayload(response.data)
  },

  get: async (id: string) => {
    if (USE_MOCK) return mockApi.getCustomer(id)

    const response = await api.get<ApiResponse<Customer>>(`/customers/${id}`)
    return normalizeSinglePayload(response.data)
  },

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
