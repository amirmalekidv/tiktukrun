import { apiFetch } from '../http';

export const notificationsApi = {
  getMine: (params?: { page?: number; limit?: number }) => {
    const q = new URLSearchParams({
      page: String(params?.page ?? 1),
      limit: String(params?.limit ?? 20),
    });
    return apiFetch(`/notifications/me?${q}`);
  },
  getUnreadCount: () => apiFetch<{ count: number }>('/notifications/me/unread-count'),
  markRead: (id: string) =>
    apiFetch(`/notifications/me/${id}/read`, { method: 'PATCH' }),
  markAsRead: (id: string) =>
    apiFetch(`/notifications/me/${id}/read`, { method: 'PATCH' }),
  getNotifications: (params?: { page?: number; limit?: number }) =>
    notificationsApi.getMine(params),
  markAllRead: () =>
    apiFetch('/notifications/me/read-all', { method: 'PATCH' }),
  markAllAsRead: () =>
    apiFetch('/notifications/me/read-all', { method: 'PATCH' }),
};
