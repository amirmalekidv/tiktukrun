/**
 * Notification Models — TIK TAK RUN Shared Types
 */

import type { NotificationType, NotificationChannel } from '../enums';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  body: string;
  link?: string;
  isRead: boolean;
  readAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface SmsLog {
  id: string;
  mobile: string;
  template: string;
  vars?: Record<string, unknown>;
  status: string;
  providerRef?: string;
  sentAt: string;
  error?: string;
  userId?: string;
}

/** خلاصه اعلان برای header badge */
export interface NotificationSummary {
  unreadCount: number;
  latest: Notification[];
}
