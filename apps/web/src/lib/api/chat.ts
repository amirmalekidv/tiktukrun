import { apiFetch } from '../http';

export const chatApi = {
  getGlobalMessages: (params?: { page?: number; limit?: number }) => {
    const q = new URLSearchParams({
      page: String(params?.page ?? 1),
      limit: String(params?.limit ?? 50),
    });
    return apiFetch(`/chat/rooms/global/messages?${q}`);
  },
  getTeamMessages: (teamId: string, params?: { page?: number; limit?: number }) => {
    const q = new URLSearchParams({
      page: String(params?.page ?? 1),
      limit: String(params?.limit ?? 50),
    });
    return apiFetch(`/chat/rooms/team/${teamId}/messages?${q}`);
  },
  reportMessage: (messageId: string, reason: string, roomId = 'global') =>
    apiFetch(`/chat/rooms/${roomId}/messages/${messageId}/report`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
};
