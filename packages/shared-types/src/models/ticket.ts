/**
 * Ticket Models — TIK TAK RUN Shared Types
 */

import type { TicketPriority, TicketStatus } from '../enums';
import type { User } from './user';

export interface Ticket {
  id: number;
  code: string;
  userId: number;
  subject: string;
  body: string;
  priority: TicketPriority;
  status: TicketStatus;
  assigneeId?: number;
  branchId?: number;
  lastReplyAt?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  user?: Pick<User, 'id' | 'fullName' | 'mobile'>;
  assignee?: Pick<User, 'id' | 'fullName'>;
  messages?: TicketMessage[];
}

export interface TicketMessage {
  id: number;
  ticketId: number;
  senderId: number;
  body: string;
  isStaffReply: boolean;
  attachments: string[];
  createdAt: string;

  sender?: Pick<User, 'id' | 'fullName' | 'avatarUrl'>;
}
