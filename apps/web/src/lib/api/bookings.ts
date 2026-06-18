const BASE = process.env.NEXT_PUBLIC_API_URL || '';

function authHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const bookingsApi = {
  getMyBookings: async (params?: { status?: string; page?: number }) => {
    const query = new URLSearchParams({
      page: String(params?.page ?? 1),
      ...(params?.status ? { status: params.status } : {}),
    });
    const res = await fetch(`${BASE}/api/v1/bookings/me?${query}`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch bookings');
    return res.json();
  },

  getBooking: async (id: string) => {
    const res = await fetch(`${BASE}/api/v1/bookings/${id}`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch booking');
    return res.json();
  },

  cancelBooking: async (id: string, reason?: string) => {
    const res = await fetch(`${BASE}/api/v1/bookings/${id}/cancel`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) throw new Error('Failed to cancel booking');
    return res.json();
  },

  submitReview: async (
    id: string,
    data: { rating: number; comment: string }
  ) => {
    const res = await fetch(`${BASE}/api/v1/bookings/${id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to submit review');
    return res.json();
  },
};
