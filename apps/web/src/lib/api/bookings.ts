import { apiFetch } from '../http';

export const bookingsApi = {
  getMine: (params?: { page?: number; limit?: number; status?: string }) => {
    const q = new URLSearchParams({
      page: String(params?.page ?? 1),
      limit: String(params?.limit ?? 20),
      ...(params?.status ? { status: params.status } : {}),
    });
    return apiFetch(`/bookings/me?${q}`);
  },
  getById: (id: string) => apiFetch(`/bookings/me/${id}`),
  cancel: (id: string, reason?: string) =>
    apiFetch(`/bookings/me/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  cancelBooking: (id: string, reason?: string) =>
    apiFetch(`/bookings/me/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  submitReview: (bookingId: string, data: { rating: number; comment: string }) =>
    apiFetch(`/reviews/booking/${bookingId}`, {
      method: 'POST',
      body: JSON.stringify({ rating: data.rating, text: data.comment }),
    }),
  getMyBookings: (params?: { page?: number; limit?: number; status?: string }) => {
    const q = new URLSearchParams({
      page: String(params?.page ?? 1),
      limit: String(params?.limit ?? 20),
      ...(params?.status ? { status: params.status } : {}),
    });
    return apiFetch(`/bookings/me?${q}`);
  },
};
