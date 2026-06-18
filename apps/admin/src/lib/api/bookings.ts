import apiClient from './client';
import type { Booking, ApiResponse, BookingStatus } from '../types';

export const bookingsApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<ApiResponse<Booking[]>>('/admin/bookings', { params }),

  getById: (id: string) =>
    apiClient.get<ApiResponse<Booking>>(`/admin/bookings/${id}`),

  create: (data: Partial<Booking>) =>
    apiClient.post<ApiResponse<Booking>>('/admin/bookings', data),

  update: (id: string, data: Partial<Booking>) =>
    apiClient.patch<ApiResponse<Booking>>(`/admin/bookings/${id}`, data),

  changeStatus: (id: string, status: BookingStatus, note?: string) =>
    apiClient.patch(`/admin/bookings/${id}/status`, { status, note }),

  refund: (id: string, reason: string, amount?: string) =>
    apiClient.post(`/admin/bookings/${id}/refund`, { reason, amount }),

  cancel: (id: string, reason: string) =>
    apiClient.post(`/admin/bookings/${id}/cancel`, { reason }),

  ratePlayer: (id: string, rating: number, note?: string) =>
    apiClient.post(`/admin/bookings/${id}/rate`, { rating, note }),

  getCalendar: (params?: { branchId?: string; gameId?: string; start?: string; end?: string }) =>
    apiClient.get('/admin/bookings/calendar', { params }),

  exportExcel: (params?: Record<string, unknown>) =>
    apiClient.get('/admin/bookings/export', { params, responseType: 'blob' }),

  getStats: () =>
    apiClient.get('/admin/bookings/stats'),
};
