import { apiFetch } from '../http';

export const ticketsApi = {
  getMine: (params?: { page?: number; limit?: number }) => {
    const q = new URLSearchParams({
      page: String(params?.page ?? 1),
      limit: String(params?.limit ?? 20),
    });
    return apiFetch(`/tickets/me?${q}`);
  },
  getById: (id: string) => apiFetch(`/tickets/me/${id}`),
  create: (data: { subject: string; body: string; priority?: string }) =>
    apiFetch('/tickets', { method: 'POST', body: JSON.stringify(data) }),
  reply: (id: string, text: string) =>
    apiFetch(`/tickets/me/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),
  close: (id: string) =>
    apiFetch(`/tickets/me/${id}/close`, { method: 'POST' }),
  getTicket: (id: string) => apiFetch(`/tickets/me/${id}`),
  getTickets: (params?: { page?: number; limit?: number }) => {
    const q = new URLSearchParams({
      page: String(params?.page ?? 1),
      limit: String(params?.limit ?? 20),
    });
    return apiFetch(`/tickets/me?${q}`);
  },
  createTicket: (data: {
    subject: string;
    body?: string;
    message?: string;
    category?: string;
    priority?: string;
  }) =>
    apiFetch('/tickets', {
      method: 'POST',
      body: JSON.stringify({
        subject: data.subject,
        body: data.body ?? data.message ?? '',
        priority: data.priority,
        category: data.category,
      }),
    }),
  replyTicket: (id: string, text: string) =>
    apiFetch(`/tickets/me/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),
};
