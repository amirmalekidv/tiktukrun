/**
 * NotificationsService — ساخت اعلان درون‌برنامه‌ای روی مدل Notification واقعی
 */
import { Injectable, Logger } from '@nestjs/common';
import { NotificationType } from '@tiktakrun/shared-types';
import { PrismaService } from '../../prisma/prisma.service';

export interface NotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface INotificationsService {
  send(params: NotificationParams): Promise<void>;
}

@Injectable()
export class NotificationsService implements INotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  async send(params: NotificationParams): Promise<void> {
    try {
      await this.prisma.notification.create({
        data: {
          userId:   params.userId,
          type:     params.type as any,
          channel:  'INAPP',
          title:    params.title,
          body:     params.body,
          metadata: params.data ? (params.data as any) : undefined,
          isRead:   false,
        },
      });
      this.logger.log(`Notification sent: user=${params.userId} type=${params.type}`);
    } catch (err) {
      this.logger.error('Failed to send notification', err as any);
    }
  }
}
