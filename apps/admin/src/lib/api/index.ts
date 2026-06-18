export { bookingsApi } from './bookings';
export { gamesApi } from './games';
export { fetcher, apiClient } from './client';

import apiClient from './client';
import type {
  Branch, City, Category, Review, ChatMessage, Ticket, TicketMessage,
  Transaction, Payment, WheelPrize, WheelSpin, Badge, Level, AvatarItem,
  DiscountCode, AutoDiscount, MonthlyWinner, Setting, Role, Permission,
  AuditLog, Backup, ApiResponse, User
} from '../types';

// ==================== Branches ====================
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

// ==================== Reviews ====================
export const reviewsApi = {
  getAll: (p?: Record<string, unknown>) => apiClient.get<ApiResponse<Review[]>>('/admin/reviews', { params: p }),
  approve: (id: string) => apiClient.patch(`/admin/reviews/${id}/approve`),
  reject: (id: string, note?: string) => apiClient.patch(`/admin/reviews/${id}/reject`, { note }),
  delete: (id: string) => apiClient.delete(`/admin/reviews/${id}`),
};

// ==================== Chats ====================
export const chatsApi = {
  getMessages: (p?: Record<string, unknown>) => apiClient.get<ApiResponse<ChatMessage[]>>('/admin/chats', { params: p }),
  getReported: (p?: Record<string, unknown>) => apiClient.get<ApiResponse<ChatMessage[]>>('/admin/chats/reported', { params: p }),
  hide: (id: string) => apiClient.patch(`/admin/chats/${id}/hide`),
  delete: (id: string) => apiClient.delete(`/admin/chats/${id}`),
  warn: (userId: string) => apiClient.post(`/admin/users/${userId}/warn`),
  mute: (userId: string, duration: string) => apiClient.post(`/admin/users/${userId}/mute`, { duration }),
  getStats: () => apiClient.get('/admin/chats/stats'),
  getBannedWords: () => apiClient.get<{ words: string[] }>('/admin/chats/banned-words'),
  updateBannedWords: (words: string[]) => apiClient.put('/admin/chats/banned-words', { words }),
};

// ==================== Tickets ====================
export const ticketsApi = {
  getAll: (p?: Record<string, unknown>) => apiClient.get<ApiResponse<Ticket[]>>('/admin/tickets', { params: p }),
  getById: (id: string) => apiClient.get<ApiResponse<Ticket>>(`/admin/tickets/${id}`),
  reply: (id: string, content: string, isInternal?: boolean) =>
    apiClient.post<ApiResponse<TicketMessage>>(`/admin/tickets/${id}/reply`, { content, isInternal }),
  assign: (id: string, assigneeId: string) => apiClient.patch(`/admin/tickets/${id}/assign`, { assigneeId }),
  changeStatus: (id: string, status: string) => apiClient.patch(`/admin/tickets/${id}/status`, { status }),
  getStats: () => apiClient.get('/admin/tickets/stats'),
};

// ==================== Finance ====================
export const transactionsApi = {
  getAll: (p?: Record<string, unknown>) => apiClient.get<ApiResponse<Transaction[]>>('/admin/transactions', { params: p }),
  exportExcel: (p?: Record<string, unknown>) => apiClient.get('/admin/transactions/export', { params: p, responseType: 'blob' }),
  getStats: () => apiClient.get('/admin/transactions/stats'),
};

export const paymentsApi = {
  getAll: (p?: Record<string, unknown>) => apiClient.get<ApiResponse<Payment[]>>('/admin/payments', { params: p }),
  exportExcel: (p?: Record<string, unknown>) => apiClient.get('/admin/payments/export', { params: p, responseType: 'blob' }),
};

export const reportsApi = {
  getFinancial: (p?: Record<string, unknown>) => apiClient.get('/admin/reports/financial', { params: p }),
  getGames: (p?: Record<string, unknown>) => apiClient.get('/admin/reports/games', { params: p }),
  getCohort: () => apiClient.get('/admin/reports/cohort'),
  getHeatmap: () => apiClient.get('/admin/reports/heatmap'),
  exportPdf: (p?: Record<string, unknown>) => apiClient.get('/admin/reports/export/pdf', { params: p, responseType: 'blob' }),
  exportExcel: (p?: Record<string, unknown>) => apiClient.get('/admin/reports/export/excel', { params: p, responseType: 'blob' }),
};

// ==================== Backup ====================
export const backupApi = {
  getAll: () => apiClient.get<ApiResponse<Backup[]>>('/admin/backup'),
  create: () => apiClient.post<ApiResponse<Backup>>('/admin/backup/create'),
  delete: (id: string) => apiClient.delete(`/admin/backup/${id}`),
  download: (id: string) => apiClient.get(`/admin/backup/${id}/download`, { responseType: 'blob' }),
};

// ==================== Gamification ====================
export const wheelApi = {
  getPrizes: () => apiClient.get<ApiResponse<WheelPrize[]>>('/admin/wheel/prizes'),
  createPrize: (d: Partial<WheelPrize>) => apiClient.post<ApiResponse<WheelPrize>>('/admin/wheel/prizes', d),
  updatePrize: (id: string, d: Partial<WheelPrize>) => apiClient.patch<ApiResponse<WheelPrize>>(`/admin/wheel/prizes/${id}`, d),
  deletePrize: (id: string) => apiClient.delete(`/admin/wheel/prizes/${id}`),
  reorderPrizes: (ids: string[]) => apiClient.patch('/admin/wheel/prizes/reorder', { ids }),
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
export const discountsApi = {
  getCodes: (p?: Record<string, unknown>) => apiClient.get<ApiResponse<DiscountCode[]>>('/admin/discounts/codes', { params: p }),
  createCode: (d: Partial<DiscountCode>) => apiClient.post<ApiResponse<DiscountCode>>('/admin/discounts/codes', d),
  updateCode: (id: string, d: Partial<DiscountCode>) => apiClient.patch<ApiResponse<DiscountCode>>(`/admin/discounts/codes/${id}`, d),
  deleteCode: (id: string) => apiClient.delete(`/admin/discounts/codes/${id}`),
  getAutoDiscounts: () => apiClient.get<ApiResponse<AutoDiscount[]>>('/admin/discounts/auto'),
  updateAutoDiscount: (id: string, d: Partial<AutoDiscount>) => apiClient.patch<ApiResponse<AutoDiscount>>(`/admin/discounts/auto/${id}`, d),
  getUsages: (p?: Record<string, unknown>) => apiClient.get('/admin/discounts/usages', { params: p }),
};

// ==================== Monthly ====================
export const monthlyApi = {
  getCurrent: () => apiClient.get('/admin/monthly/current'),
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
export const rolesApi = {
  getAll: () => apiClient.get<ApiResponse<Role[]>>('/admin/roles'),
  getById: (id: string) => apiClient.get<ApiResponse<Role>>(`/admin/roles/${id}`),
  create: (d: Partial<Role>) => apiClient.post<ApiResponse<Role>>('/admin/roles', d),
  updatePermissions: (id: string, permissions: string[]) =>
    apiClient.post(`/admin/roles/${id}/permissions`, { permissions }),
  getAllPermissions: () => apiClient.get<ApiResponse<Permission[]>>('/admin/permissions'),
};

// ==================== Staff ====================
export const staffApi = {
  getAll: () => apiClient.get<ApiResponse<User[]>>('/admin/staff'),
  invite: (mobile: string, roles: string[]) => apiClient.post('/admin/staff/invite', { mobile, roles }),
  updateRoles: (id: string, roles: string[]) => apiClient.patch(`/admin/staff/${id}/roles`, { roles }),
  toggleActive: (id: string) => apiClient.patch(`/admin/staff/${id}/toggle-active`),
};

// ==================== Audit ====================
export const auditApi = {
  getAll: (p?: Record<string, unknown>) => apiClient.get<ApiResponse<AuditLog[]>>('/admin/audit', { params: p }),
  getById: (id: string) => apiClient.get<ApiResponse<AuditLog>>(`/admin/audit/${id}`),
};
