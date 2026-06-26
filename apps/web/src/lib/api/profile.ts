import { apiFetch } from '../http';

export const profileApi = {
  getMe: () => apiFetch('/users/me'),
  getProfile: () => apiFetch('/users/me'),
  updateMe: (data: Record<string, unknown>) =>
    apiFetch('/users/me', { method: 'PATCH', body: JSON.stringify(data) }),
  updateProfile: (data: Record<string, unknown>) =>
    apiFetch('/users/me', { method: 'PATCH', body: JSON.stringify(data) }),
  getBadges: () => apiFetch('/profile/me/badges'),
  getStats: () => apiFetch('/profile/me/stats'),
  getPublic: (userId: string) => apiFetch(`/profile/${userId}/public`),
  getPublicProfile: (userId: string) => profileApi.getPublic(userId),
  uploadAvatar: async (file: File) => {
    const form = new FormData();
    form.append('file', file);
    const { getApiV1, getAuthHeaders } = await import('../http');
    const res = await fetch(`${getApiV1()}/users/me/avatar`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: form,
    });
    if (!res.ok) throw new Error('آپلود آواتار ناموفق بود');
    const json = await res.json();
    return json.data ?? json;
  },
  deleteAvatar: () =>
    apiFetch('/users/me/avatar', { method: 'DELETE' }),
  getAvatarItems: () => apiFetch('/users/me/avatar/items'),
  getAvatarConfig: () => apiFetch('/users/me/avatar/config'),
  purchaseAvatarItem: (itemId: string) =>
    apiFetch('/users/me/avatar/purchase', {
      method: 'POST',
      body: JSON.stringify({ itemId }),
    }),
  updateAvatarConfig: (config: Record<string, unknown> | object) =>
    apiFetch('/users/me/avatar/config', {
      method: 'PATCH',
      body: JSON.stringify(config),
    }),
};
