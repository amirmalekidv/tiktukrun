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

// ==================== Branches ====================
// Backend: BranchesAdminController @Controller('admin/branches') has GET/POST/PATCH/DELETE (no GET :id).
//   Branch detail (with games+category) comes from the public BranchesController GET /branches/:id.
export const branchesApi = {
  getAll: (p?: Record<string, unknown>) => apiClient.get<ApiResponse<Branch[]>>('/admin/branches', { params: p }),
  getById: (id: string) => apiClient.get<ApiResponse<Branch>>(`/branches/${id}`),
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
  reply: (id: string, content: string, isInternal?: boolean) =>
    apiClient.post<ApiResponse<TicketMessage>>(`/admin/tickets/${id}/reply`, { content, isInternal }),
  changeStatus: (id: string, status: string) => apiClient.patch(`/admin/tickets/${id}`, { status }),
  getStats: () => apiClient.get('/admin/tickets/stats'),
};

// ==================== Finance ====================
// Backend: there is no /admin/transactions controller; payments are the source of truth.
// transactionsApi reads payments and presents them as transactions.
export const transactionsApi = {
  getAll: (p?: Record<string, unknown>) => apiClient.get<ApiResponse<Transaction[]>>('/admin/payments', { params: p }),
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

export const avatarsApi = {
  getAll: (p?: Record<string, unknown>) => apiClient.get<ApiResponse<AvatarItem[]>>('/admin/avatars', { params: p }),
  create: (d: FormData) => apiClient.post<ApiResponse<AvatarItem>>('/admin/avatars', d, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id: string, d: Partial<AvatarItem>) => apiClient.patch<ApiResponse<AvatarItem>>(`/admin/avatars/${id}`, d),
  delete: (id: string) => apiClient.delete(`/admin/avatars/${id}`),
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
  compute: (year: number, month: number) => apiClient.post('/admin/monthly/compute', { year, month }),
  distribute: (year: number, month: number, prizes: Record<string, unknown>) =>
    apiClient.post('/admin/monthly/distribute', { year, month, prizes }),
};

// ==================== Settings ====================
export const settingsApi = {
  getGroup: (group: string) => apiClient.get<ApiResponse<Setting[]>>(`/admin/settings/${group}`),
  updateGroup: (group: string, data: Record<string, unknown>) =>
    apiClient.put(`/admin/settings/${group}`, data),
};

// ==================== Roles ====================
// Backend: AdminRolesController @Controller('admin/roles')
//   GET /  POST /  PATCH /:id/permissions
export const rolesApi = {
  getAll: () => apiClient.get<ApiResponse<Role[]>>('/admin/roles'),
  create: (d: Partial<Role>) => apiClient.post<ApiResponse<Role>>('/admin/roles', d),
  updatePermissions: (id: string, permissions: string[]) =>
    apiClient.patch(`/admin/roles/${id}/permissions`, { permissions }),
};

// ==================== Staff ====================
// Backend: AdminUserRolesController @Controller('admin/users') manages staff role assignment.
//   GET /staff  POST /:id/roles  (assign roles to a user => becomes staff)
export const staffApi = {
  getAll: () => apiClient.get<ApiResponse<User[]>>('/admin/users/staff'),
  updateRoles: (id: string, roleIds: string[]) => apiClient.post(`/admin/users/${id}/roles`, { roleIds }),
};

// ==================== Audit ====================
// Backend: AdminAuditController @Controller('admin/audit-logs')
export const auditApi = {
  getAll: (p?: Record<string, unknown>) => apiClient.get<ApiResponse<AuditLog[]>>('/admin/audit-logs', { params: p }),
  getById: (id: string) => apiClient.get<ApiResponse<AuditLog>>(`/admin/audit-logs/${id}`),
};
