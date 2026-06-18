const BASE = process.env.NEXT_PUBLIC_API_URL || '';

function authHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const ticketsApi = {
  getTickets: async (page = 1) => {
    const res = await fetch(`${BASE}/api/v1/tickets?page=${page}`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch tickets');
    return res.json();
  },

  getTicket: async (id: string) => {
    const res = await fetch(`${BASE}/api/v1/tickets/${id}`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch ticket');
    return res.json();
  },

  createTicket: async (data: {
    subject: string;
    category: string;
    message: string;
  }) => {
    const res = await fetch(`${BASE}/api/v1/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create ticket');
    return res.json();
  },

  replyTicket: async (id: string, message: string) => {
    const res = await fetch(`${BASE}/api/v1/tickets/${id}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ message }),
    });
    if (!res.ok) throw new Error('Failed to reply to ticket');
    return res.json();
  },

  closeTicket: async (id: string) => {
    const res = await fetch(`${BASE}/api/v1/tickets/${id}/close`, {
      method: 'PATCH',
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to close ticket');
    return res.json();
  },
};
