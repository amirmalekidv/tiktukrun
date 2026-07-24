export { bookingsApi } from './bookings';
export { gamesApi, gameCommentsApi } from './games';
export { fetcher, apiClient } from './client';

import apiClient from './client';
import type {
  Branch, City, Category, Review, ChatMessage, Ticket, TicketMessage,
  Transaction, Payment, WheelPrize, WheelSpin, Badge, Level, AvatarItem,
  DiscountCode, AutoDiscount, MonthlyWinner, Setting, Role, Permission,
  AuditLog, Backup, ApiResponse, User
} from '../types';

// ==================== Customers (admin) ====================
// Backend: AdminCustomersController @Controller('admin/customers')
//   GET / (query: q, status, segmentId, ltvMin, ltvMax, sortBy, page, limit)
//        -> { success, data: User[], total, meta }
export const adminCustomersApi = {
  search: (q: string, limit = 10) =>
    apiClient.get<ApiResponse<User[]>>('/admin/customers', { params: { q, limit } }),
  getAll: (p?: Record<string, unknown>) =>
    apiClient.get<ApiResponse<User[]>>('/admin/customers', { params: p }),
  getById: (id: string) => apiClient.get<ApiResponse<User>>(`/admin/customers/${id}`),
};

export type BranchManagerCredentials = {
  mobile: string;
  password: string;
  role: string;
  branch: { id: string; name: string };
};

export type BranchManagerUser = {
  id: string;
  fullName?: string | null;
  mobile?: string | null;
  email?: string | null;
  isActive?: boolean;
  isBanned?: boolean;
  createdAt?: string;
  roles?: string[];
  managedBranches?: { id: string; name: string }[];
};

export type CreateBranchManagerPayload = {
  mobile: string;
  fullName: string;
  branchId: string;
  email?: string;
};

export type CreateBranchManagerResult = {
  user: BranchManagerUser;
  temporaryPassword: string;
  credentials: BranchManagerCredentials;
};

// ==================== Branch Managers (admin) ====================
// Backend: AdminBranchManagersController @Controller('admin/branch-managers')
export const branchManagersApi = {
  getAll: (p?: Record<string, unknown>) =>
    apiClient.get<ApiResponse<BranchManagerUser[]>>('/admin/branch-managers', { params: p }),
  create: (d: CreateBranchManagerPayload) =>
    apiClient.post<ApiResponse<CreateBranchManagerResult>>('/admin/branch-managers', d),
};

// ==================== Notifications ====================
// Backend: NotificationsController @Controller('notifications')
//   GET   /me                -> { success, data: { items, pagination } }
//   GET   /me/unread-count   -> { count }
//   PATCH /me/:id/read       -> mark single as read
//   PATCH /me/read-all       -> mark all as read
export const notificationsApi = {
  getMine: (p?: Record<string, unknown>) => apiClient.get('/notifications/me', { params: p }),
  getUnreadCount: () => apiClient.get('/notifications/me/unread-count'),
  markRead: (id: string) => apiClient.patch(`/notifications/me/${id}/read`),
  markAllRead: () => apiClient.patch('/notifications/me/read-all'),
};

// ==================== Branches ====================
// Backend: BranchesAdminController @Controller('admin/branches') has GET/POST/PATCH/DELETE (no GET :id).
//   Branch detail (with games+category) comes from the public BranchesController GET /branches/:id.
export const branchesApi = {
  getAll: (p?: Record<string, unknown>) => apiClient.get<ApiResponse<Branch[]>>('/admin/branches', { params: p }),
  getById: (id: string) => apiClient.get<ApiResponse<Branch>>(`/admin/branches/${id}`),
  create: (d: Partial<Branch>) => apiClient.post<ApiResponse<Branch>>('/admin/branches', d),
  update: (id: string, d: Partial<Branch>) => apiClient.patch<ApiResponse<Branch>>(`/admin/branches/${id}`, d),
  delete: (id: string) => apiClient.delete(`/admin/branches/${id}`),
};

// ==================== Cities ====================
export const citiesApi = {
  getAll: () => apiClient.get<ApiResponse<City[]>>('/admin/cities'),
  create: (d: Partial<City>) => apiClient.post<ApiResponse<City>>('/admin/cities', d),
  update: (id: string, d: Partial<City>) => apiClient.patch<ApiResponse<City>>(`/admin/cities/${id}`, d),
  delete: (id: string) => apiClient.delete(`/admin/cities/${id}`),
};

// ==================== Categories ====================
export const categoriesApi = {
  getAll: () => apiClient.get<ApiResponse<Category[]>>('/admin/categories'),
  create: (d: Partial<Category>) => apiClient.post<ApiResponse<Category>>('/admin/categories', d),
  update: (id: string, d: Partial<Category>) => apiClient.patch<ApiResponse<Category>>(`/admin/categories/${id}`, d),
  delete: (id: string) => apiClient.delete(`/admin/categories/${id}`),
};

// ==================== Landing Sections ====================
export const landingSectionsApi = {
  getAll: () => apiClient.get<ApiResponse<import('../types').LandingSection[]>>('/admin/landing-sections'),
  update: (id: string, d: Partial<import('../types').LandingSection>) =>
    apiClient.patch<ApiResponse<import('../types').LandingSection>>(`/admin/landing-sections/${id}`, d),
  setGames: (id: string, gameIds: string[]) =>
    apiClient.patch(`/admin/landing-sections/${id}/games`, { gameIds }),
};

// ==================== Landing Banners ====================
export const landingBannersApi = {
  getAll: () => apiClient.get<ApiResponse<import('../types').LandingBanner[]>>('/admin/landing-banners'),
  create: (d: FormData) =>
    apiClient.post<ApiResponse<import('../types').LandingBanner>>('/admin/landing-banners', d),
  update: (id: string, d: FormData | Partial<import('../types').LandingBanner>) =>
    apiClient.patch<ApiResponse<import('../types').LandingBanner>>(`/admin/landing-banners/${id}`, d),
  reorder: (bannerIds: string[]) =>
    apiClient.patch<ApiResponse<import('../types').LandingBanner[]>>('/admin/landing-banners/order', { bannerIds }),
  delete: (id: string) => apiClient.delete<ApiResponse<import('../types').LandingBanner>>(`/admin/landing-banners/${id}`),
};

// ==================== Platform Intro ====================
export const platformIntroApi = {
  get: () => apiClient.get<ApiResponse<import('../types').PlatformIntro>>('/admin/platform-intro'),
  update: (d: FormData | Partial<import('../types').PlatformIntro> & { clearVideo?: boolean }) =>
    apiClient.patch<ApiResponse<import('../types').PlatformIntro>>('/admin/platform-intro', d),
  createFaq: (d: Partial<import('../types').PlatformFaq>) =>
    apiClient.post<ApiResponse<import('../types').PlatformFaq>>('/admin/platform-intro/faqs', d),
  updateFaq: (id: string, d: Partial<import('../types').PlatformFaq>) =>
    apiClient.patch<ApiResponse<import('../types').PlatformFaq>>(`/admin/platform-intro/faqs/${id}`, d),
  reorderFaqs: (faqIds: string[]) =>
    apiClient.patch<ApiResponse<import('../types').PlatformIntro>>('/admin/platform-intro/faqs/order', { faqIds }),
  deleteFaq: (id: string) =>
    apiClient.delete<ApiResponse<import('../types').PlatformFaq>>(`/admin/platform-intro/faqs/${id}`),
};

// ==================== Reviews ====================
// Backend: ReviewsAdminController @Controller('admin/reviews')
//   GET  /            -> { data, total, page, limit }  (query: isApproved, gameId, page, limit, sortBy)
//   POST /:id/approve -> sets isApproved=true
//   POST /:id/reject  -> deletes review + notifies (body: { reason })
//   DELETE /:id       -> hard delete
export const reviewsApi = {
  getAll: (p?: Record<string, unknown>) => apiClient.get<ApiResponse<Review[]>>('/admin/reviews', { params: p }),
  approve: (id: string) => apiClient.post(`/admin/reviews/${id}/approve`),
  reject: (id: string, reason = 'محتوای نامناسب') => apiClient.post(`/admin/reviews/${id}/reject`, { reason }),
  delete: (id: string) => apiClient.delete(`/admin/reviews/${id}`),
};

// ==================== Chats ====================
// Backend: AdminChatController @Controller('admin')
//   GET  /chats/messages            -> { success, data, meta:{total,page,limit} } (query: page, limit, status, userId, roomType)
//   GET  /chats/stats               -> { success, data }
//   POST /chats/messages/:id/hide   -> body { reason? }
//   POST /chats/messages/:id/delete -> hard delete
//   POST /users/:userId/mute        -> body { hours, reason? }
//   POST /users/:userId/warn        -> body { message }
export const chatsApi = {
  getMessages: (p?: Record<string, unknown>) => apiClient.get<ApiResponse<ChatMessage[]>>('/admin/chats/messages', { params: p }),
  getStats: () => apiClient.get('/admin/chats/stats'),
  hide: (id: string, reason?: string) => apiClient.post(`/admin/chats/messages/${id}/hide`, { reason }),
  delete: (id: string) => apiClient.post(`/admin/chats/messages/${id}/delete`),
  mute: (userId: string, hours: number, reason?: string) => apiClient.post(`/admin/users/${userId}/mute`, { hours, reason }),
  warn: (userId: string, message: string) => apiClient.post(`/admin/users/${userId}/warn`, { message }),
};

// ==================== Tickets ====================
// Backend: AdminTicketsController @Controller('admin/tickets')
//   GET /  GET /stats  GET /:id  PATCH /:id (status/priority)  POST /:id/reply
export const ticketsApi = {
  getAll: (p?: Record<string, unknown>) => apiClient.get<ApiResponse<Ticket[]>>('/admin/tickets', { params: p }),
  getById: (id: string) => apiClient.get<ApiResponse<Ticket>>(`/admin/tickets/${id}`),
  reply: (id: string, text: string) =>
    apiClient.post<ApiResponse<TicketMessage>>(`/admin/tickets/${id}/reply`, { text }),
  changeStatus: (id: string, status: string) => apiClient.patch(`/admin/tickets/${id}`, { status }),
  update: (id: string, d: { status?: string; priority?: string; assigneeId?: string }) =>
    apiClient.patch(`/admin/tickets/${id}`, d),
  getStats: () => apiClient.get('/admin/tickets/stats'),
};

// ==================== Finance ====================
// Backend: WalletAdminController @Controller('admin/wallets')
//   GET /transactions (query: userId, currency, type, page, limit) -> { data, total, page, limit }
//   POST /manual-adjust { userId, currency, delta, reason }
export const transactionsApi = {
  getAll: (p?: Record<string, unknown>) => apiClient.get<ApiResponse<Transaction[]>>('/admin/wallets/transactions', { params: p }),
  manualAdjust: (d: { userId: string; currency: string; delta: number; reason: string }) =>
    apiClient.post('/admin/wallets/manual-adjust', d),
  getStats: () => apiClient.get('/admin/analytics/cashflow'),
};

// Backend: PaymentsAdminController @Controller('admin/payments')
//   GET /      -> { data, total, page, limit } (query: status, userId, bookingId, page, limit)
//   GET /:id   -> single payment with booking
export const paymentsApi = {
  getAll: (p?: Record<string, unknown>) => apiClient.get<ApiResponse<Payment[]>>('/admin/payments', { params: p }),
  getById: (id: string) => apiClient.get<ApiResponse<Payment>>(`/admin/payments/${id}`),
};

// Backend: AdminAnalyticsController @Controller('admin/analytics')
export const reportsApi = {
  getFinancial: (p?: Record<string, unknown>) => apiClient.get('/admin/analytics/financial', { params: p }),
  getGames: (p?: Record<string, unknown>) => apiClient.get('/admin/analytics/games', { params: p }),
  getCohort: () => apiClient.get('/admin/analytics/cohort'),
  getHeatmap: () => apiClient.get('/admin/analytics/heatmap'),
};

// ==================== Backup ====================
// Backend: AdminBackupController @Controller('admin/backup')
//   POST /create  GET /list  GET /download/:filename  DELETE /:filename
export const backupApi = {
  getAll: () => apiClient.get<ApiResponse<Backup[]>>('/admin/backup/list'),
  create: () => apiClient.post<ApiResponse<Backup>>('/admin/backup/create'),
  delete: (filename: string) => apiClient.delete(`/admin/backup/${filename}`),
  download: (filename: string) => apiClient.get(`/admin/backup/download/${filename}`, { responseType: 'blob' }),
};

// ==================== Gamification ====================
// Backend: AdminWheelController @Controller('admin/wheel')
//   GET /prizes  POST /prizes  PATCH /prizes/:id  DELETE /prizes/:id
//   POST /prizes/:id/toggle-active  GET /spins  GET /stats
export const wheelApi = {
  getPrizes: () => apiClient.get<ApiResponse<WheelPrize[]>>('/admin/wheel/prizes'),
  createPrize: (d: Partial<WheelPrize>) => apiClient.post<ApiResponse<WheelPrize>>('/admin/wheel/prizes', d),
  updatePrize: (id: string, d: Partial<WheelPrize>) => apiClient.patch<ApiResponse<WheelPrize>>(`/admin/wheel/prizes/${id}`, d),
  deletePrize: (id: string) => apiClient.delete(`/admin/wheel/prizes/${id}`),
  togglePrize: (id: string) => apiClient.post(`/admin/wheel/prizes/${id}/toggle-active`),
  getSpins: (p?: Record<string, unknown>) => apiClient.get<ApiResponse<WheelSpin[]>>('/admin/wheel/spins', { params: p }),
  getStats: () => apiClient.get('/admin/wheel/stats'),
};

export const badgesApi = {
  getAll: () => apiClient.get<ApiResponse<Badge[]>>('/admin/badges'),
  create: (d: Partial<Badge>) => apiClient.post<ApiResponse<Badge>>('/admin/badges', d),
  update: (id: string, d: Partial<Badge>) => apiClient.patch<ApiResponse<Badge>>(`/admin/badges/${id}`, d),
  delete: (id: string) => apiClient.delete(`/admin/badges/${id}`),
};

export const levelsApi = {
  getAll: () => apiClient.get<ApiResponse<Level[]>>('/admin/levels'),
  update: (id: number, d: Partial<Level>) => apiClient.patch<ApiResponse<Level>>(`/admin/levels/${id}`, d),
  updateBulk: (levels: Partial<Level>[]) => apiClient.put('/admin/levels', { levels }),
};

// NOTE: There is no admin CRUD endpoint for avatar items in the backend.
// The only catalog source is the user-scoped read endpoint GET /users/me/avatar/items
// which returns the full active catalog (each item annotated with ownership status).
// The admin avatars page is therefore read-only.
export const avatarsApi = {
  getAll: () => apiClient.get<ApiResponse<AvatarItem[]>>('/users/me/avatar/items'),
};

// ==================== Discounts ====================
// Backend: AdminDiscountsController @Controller('admin')
//   GET /discount-codes  POST /discount-codes  PATCH /discount-codes/:id  DELETE /discount-codes/:id
//   GET /discount-codes/:id/usages  GET /auto-discounts  POST/PATCH/DELETE /auto-discounts
export const discountsApi = {
  getCodes: (p?: Record<string, unknown>) => apiClient.get<ApiResponse<DiscountCode[]>>('/admin/discount-codes', { params: p }),
  createCode: (d: Partial<DiscountCode>) => apiClient.post<ApiResponse<DiscountCode>>('/admin/discount-codes', d),
  updateCode: (id: string, d: Partial<DiscountCode>) => apiClient.patch<ApiResponse<DiscountCode>>(`/admin/discount-codes/${id}`, d),
  deleteCode: (id: string) => apiClient.delete(`/admin/discount-codes/${id}`),
  getAutoDiscounts: () => apiClient.get<ApiResponse<AutoDiscount[]>>('/admin/auto-discounts'),
  createAutoDiscount: (d: Partial<AutoDiscount>) => apiClient.post<ApiResponse<AutoDiscount>>('/admin/auto-discounts', d),
  updateAutoDiscount: (id: string, d: Partial<AutoDiscount>) => apiClient.patch<ApiResponse<AutoDiscount>>(`/admin/auto-discounts/${id}`, d),
  deleteAutoDiscount: (id: string) => apiClient.delete(`/admin/auto-discounts/${id}`),
  getUsages: (id: string, p?: Record<string, unknown>) => apiClient.get(`/admin/discount-codes/${id}/usages`, { params: p }),
};

// ==================== Monthly ====================
// Backend: AdminMonthlyController @Controller('admin/monthly')
//   GET /winners  POST /compute  POST /distribute  GET /history
export const monthlyApi = {
  getWinners: (p?: Record<string, unknown>) => apiClient.get('/admin/monthly/winners', { params: p }),
  getHistory: (p?: Record<string, unknown>) => apiClient.get<ApiResponse<MonthlyWinner[]>>('/admin/monthly/history', { params: p }),
  compute: (year: number, month: number) =>
    apiClient.post('/admin/monthly/compute', {}, { params: { year, month } }),
  distribute: (year: number, month: number, customPrizes?: Record<string, unknown>) =>
    apiClient.post('/admin/monthly/distribute', { year, month, customPrizes }),
};

// ==================== Settings ====================
export const settingsApi = {
  getAll: (group?: string) =>
    apiClient.get<ApiResponse<Setting[]>>('/admin/settings', {
      params: group ? { group } : undefined,
    }),
  getGroup: (group: string) => settingsApi.getAll(group),
  getOne: (key: string) =>
    apiClient.get<ApiResponse<{ key: string; value: string }>>(
      `/admin/settings/${encodeURIComponent(key)}`,
    ),
  updateOne: (key: string, value: string) =>
    apiClient.put(`/admin/settings/${encodeURIComponent(key)}`, { value }),
  bulkUpdate: (settings: { key: string; value: string }[]) =>
    apiClient.put('/admin/settings/bulk', { settings }),
  /** @deprecated use bulkUpdate with mapped keys */
  updateGroup: (group: string, data: Record<string, unknown>) =>
    settingsApi.bulkUpdate(
      Object.entries(data).map(([key, value]) => ({
        key: key.includes('.') ? key : `${group}.${key}`,
        value: String(value),
      })),
    ),
};

// ==================== Roles ====================
// Backend: AdminRolesController @Controller('admin/roles')
//   GET /  GET /:id  POST / (disabled)  PATCH /:id/permissions (disabled)
export const rolesApi = {
  getAll: () => apiClient.get<ApiResponse<Role[]>>('/admin/roles'),
  getById: (id: string) => apiClient.get<ApiResponse<Role & { users?: User[] }>>(`/admin/roles/${id}`),
  create: (d: Partial<Role>) => apiClient.post<ApiResponse<Role>>('/admin/roles', d),
  updatePermissions: (id: string, permissions: string[]) =>
    apiClient.patch(`/admin/roles/${id}/permissions`, { permissions }),
};

// ==================== Staff ====================
// Backend: AdminUserRolesController @Controller('admin/users') manages staff role assignment.
//   GET /staff  POST /:id/roles  (assign roles to a user => becomes staff)
export const staffApi = {
  // Backend has no dedicated /staff route; use admin user list (optionally filtered by role).
  getAll: (p?: Record<string, unknown>) =>
    apiClient.get<ApiResponse<User[]>>('/admin/users', { params: p }),
  getUserRoles: (id: string) => apiClient.get(`/admin/users/${id}/roles`),
  updateRoles: (id: string, roles: string[]) => apiClient.post(`/admin/users/${id}/roles`, { roles }),
};

// ==================== Audit ====================
// Backend: AdminAuditController @Controller('admin/audit-logs')
export const auditApi = {
  getAll: (p?: Record<string, unknown>) => apiClient.get<ApiResponse<AuditLog[]>>('/admin/audit-logs', { params: p }),
  getById: (id: string) => apiClient.get<ApiResponse<AuditLog>>(`/admin/audit-logs/${id}`),
};
