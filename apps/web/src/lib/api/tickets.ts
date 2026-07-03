import { apiFetch } from '../http';

type ApiTicketStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'WAITING_USER'
  | 'RESOLVED'
  | 'CLOSED';

interface ApiTicketMessage {
  id: string;
  body: string;
  isStaffReply: boolean;
  createdAt: string;
}

interface ApiTicket {
  id: string;
  code: string;
  subject: string;
  body: string;
  status: ApiTicketStatus;
  priority: string;
  createdAt: string;
  updatedAt: string;
  lastReplyAt?: string | null;
  closedAt?: string | null;
  messages?: ApiTicketMessage[];
  _count?: {
    messages?: number;
  };
}

export interface UserTicketListItem {
  id: string;
  code: string;
  subject: string;
  status: 'open' | 'answered' | 'closed';
  statusLabel: string;
  createdAt: string;
  updatedAt: string;
  lastReplyAt?: string | null;
  messageCount: number;
}

export interface UserTicketReply {
  id: string;
  message: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface UserTicketDetail {
  id: string;
  code: string;
  subject: string;
  status: 'open' | 'answered' | 'closed';
  statusLabel: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  lastReplyAt?: string | null;
  replies: UserTicketReply[];
}

function mapTicketStatus(status: ApiTicketStatus): UserTicketListItem['status'] {
  switch (status) {
    case 'WAITING_USER':
    case 'RESOLVED':
      return 'answered';
    case 'CLOSED':
      return 'closed';
    case 'OPEN':
    case 'IN_PROGRESS':
    default:
      return 'open';
  }
}

function getTicketStatusLabel(status: ApiTicketStatus): string {
  switch (status) {
    case 'OPEN':
      return 'باز';
    case 'IN_PROGRESS':
      return 'در حال بررسی';
    case 'WAITING_USER':
      return 'در انتظار پاسخ شما';
    case 'RESOLVED':
      return 'پاسخ داده شده';
    case 'CLOSED':
      return 'بسته شده';
    default:
      return status;
  }
}

function formatPersianDate(dateLike?: string | null): string {
  if (!dateLike) return '';
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function mapTicketListItem(ticket: ApiTicket): UserTicketListItem {
  return {
    id: ticket.id,
    code: ticket.code,
    subject: ticket.subject,
    status: mapTicketStatus(ticket.status),
    statusLabel: getTicketStatusLabel(ticket.status),
    createdAt: formatPersianDate(ticket.createdAt),
    updatedAt: ticket.updatedAt,
    lastReplyAt: ticket.lastReplyAt ?? null,
    messageCount: ticket._count?.messages ?? 0,
  };
}

function mapTicketDetail(ticket: ApiTicket): UserTicketDetail {
  return {
    id: ticket.id,
    code: ticket.code,
    subject: ticket.subject,
    status: mapTicketStatus(ticket.status),
    statusLabel: getTicketStatusLabel(ticket.status),
    body: ticket.body,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
    lastReplyAt: ticket.lastReplyAt ?? null,
    replies: (ticket.messages ?? []).map((message) => ({
      id: message.id,
      message: message.body,
      isAdmin: message.isStaffReply,
      createdAt: formatPersianDate(message.createdAt),
    })),
  };
}

export const ticketsApi = {
  getMine: (params?: { page?: number; limit?: number }) => {
    const q = new URLSearchParams({
      page: String(params?.page ?? 1),
      limit: String(params?.limit ?? 20),
    });
    return apiFetch<ApiTicket[]>(`/tickets/me?${q}`).then((tickets) =>
      tickets.map(mapTicketListItem),
    );
  },
  getById: (id: string) =>
    apiFetch<ApiTicket>(`/tickets/me/${id}`).then(mapTicketDetail),
  create: (data: { subject: string; body: string; priority?: string }) =>
    apiFetch('/tickets', { method: 'POST', body: JSON.stringify(data) }),
  reply: (id: string, text: string) =>
    apiFetch(`/tickets/me/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),
  close: (id: string) =>
    apiFetch(`/tickets/me/${id}/close`, { method: 'POST' }),
  getTicket: (id: string) =>
    apiFetch<ApiTicket>(`/tickets/me/${id}`).then(mapTicketDetail),
  getTickets: (params?: { page?: number; limit?: number }) => {
    const q = new URLSearchParams({
      page: String(params?.page ?? 1),
      limit: String(params?.limit ?? 20),
    });
    return apiFetch<ApiTicket[]>(`/tickets/me?${q}`).then((tickets) =>
      tickets.map(mapTicketListItem),
    );
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
