const BASE = process.env.NEXT_PUBLIC_API_URL || '';

function authHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const chatApi = {
  getGlobalHistory: async (before?: string) => {
    const query = before ? `?before=${before}` : '';
    const res = await fetch(`${BASE}/api/v1/chat/global${query}`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch chat history');
    return res.json();
  },

  reportMessage: async (messageId: string, reason: string) => {
    const res = await fetch(`${BASE}/api/v1/chat/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ messageId, reason }),
    });
    if (!res.ok) throw new Error('Failed to report message');
    return res.json();
  },

  deleteMessage: async (messageId: string) => {
    const res = await fetch(`${BASE}/api/v1/chat/${messageId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete message');
    return res.json();
  },
};
