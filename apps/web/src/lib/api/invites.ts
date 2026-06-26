import { apiFetch } from '../http';

export const invitesApi = {
  getMyInvite: () => apiFetch('/invites/me'),
  getInvitedUsers: (page = 1, limit = 20) => {
    const q = new URLSearchParams({ page: String(page), limit: String(limit) });
    return apiFetch(`/invites/me/users?${q}`);
  },
  regenerate: () =>
    apiFetch('/invites/regenerate', { method: 'POST' }),
  validate: (code: string) =>
    apiFetch('/invites/validate', { method: 'POST', body: JSON.stringify({ code }) }),
};
