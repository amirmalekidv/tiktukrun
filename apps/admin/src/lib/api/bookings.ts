import apiClient from './client';
import type { Booking, ApiResponse, BookingStatus } from '../types';

// Backend: BookingsAdminController @Controller('admin/bookings')
//   GET  /            -> { success, data: { data, total, page, limit } }  (double-wrapped via buildPaginatedResponse)
//                        query: status, userId, gameId, branchId, from, to, q, page, limit
//   GET  /calendar    -> { success, data: { branchId, from, to, calendar } }  (query: branchId, from, to)
//   GET  /export      -> CSV blob
//   GET  /:id         -> { success, data: booking }  (single-wrapped)
//   PATCH /:id/status -> body { status, reason? }  (AdminUpdateBookingStatusDto)
//   POST /:id/refund  -> body { amount, reason }    (RefundBookingDto; ADMIN only)
//   POST /:id/complete-> no body
//   POST /:id/rate-player -> body { xpDelta, reason } (RatePlayerDto; BRANCH_MANAGER)
//   POST /             -> body { userId, gameId, slotDateTime, playersCount, teamName?, paymentMethod, totalAmount?, note? }
//                         (AdminCreateBookingDto; manual/POS booking, recorded as CONFIRMED + paid)
// NOTE: There is NO admin update route. Use changeStatus(CANCELLED) to cancel.
export const bookingsApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<ApiResponse<Booking[]>>('/admin/bookings', { params }),

  create: (data: {
    userId: string;
    gameId: string;
    slotDateTime: string;
    playersCount: number;
    teamName?: string;
    paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'WALLET' | 'ZARINPAL';
    totalAmount?: number;
    note?: string;
  }) => apiClient.post<ApiResponse<Booking>>('/admin/bookings', data),

  getById: (id: string) =>
    apiClient.get<ApiResponse<Booking>>(`/admin/bookings/${id}`),

  changeStatus: (id: string, status: BookingStatus, reason?: string) =>
    apiClient.patch(`/admin/bookings/${id}/status`, { status, reason }),

  cancel: (id: string, reason?: string) =>
    apiClient.patch(`/admin/bookings/${id}/status`, { status: 'CANCELLED', reason }),

  complete: (id: string) =>
    apiClient.post(`/admin/bookings/${id}/complete`),

  refund: (id: string, amount: number, reason: string) =>
    apiClient.post(`/admin/bookings/${id}/refund`, { amount, reason }),

  ratePlayer: (id: string, xpDelta: number, reason: string) =>
    apiClient.post(`/admin/bookings/${id}/rate-player`, { xpDelta, reason }),

  getCalendar: (params?: { branchId?: string; from?: string; to?: string }) =>
    apiClient.get('/admin/bookings/calendar', { params }),

  exportExcel: (params?: Record<string, unknown>) =>
    apiClient.get('/admin/bookings/export', { params, responseType: 'blob' }),
};
