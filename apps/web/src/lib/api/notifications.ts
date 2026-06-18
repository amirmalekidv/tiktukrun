const BASE = process.env.NEXT_PUBLIC_API_URL || '';

function authHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const notificationsApi = {
  getNotifications: async (page = 1) => {
    const res = await fetch(`${BASE}/api/v1/notifications?page=${page}`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
  },

  getUnreadCount: async () => {
    const res = await fetch(`${BASE}/api/v1/notifications/unread-count`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch unread count');
    return res.json();
  },

  markAsRead: async (id: string) => {
    const res = await fetch(`${BASE}/api/v1/notifications/${id}/read`, {
      method: 'PATCH',
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to mark as read');
    return res.json();
  },

  markAllAsRead: async () => {
    const res = await fetch(`${BASE}/api/v1/notifications/read-all`, {
      method: 'PATCH',
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to mark all as read');
    return res.json();
  },
};
