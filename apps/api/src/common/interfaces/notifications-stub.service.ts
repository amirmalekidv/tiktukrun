/**
 * NotificationsService — ساخت اعلان درون‌برنامه‌ای روی مدل Notification واقعی
 */
import { Injectable, Logger } from '@nestjs/common';
import {
  INotificationsService,
  NotificationParams,
} from './phase3-stubs.interface';
import { PrismaService } from '../../prisma/prisma.service';

// نگاشت enum محلی (stub) به enum واقعیِ Prisma (NotificationType در schema)
const NOTIF_TYPE_MAP: Record<string, string> = {
  BOOKING_CONFIRMED: 'BOOKING',
  BOOKING_CANCELLED: 'BOOKING',
  BOOKING_COMPLETED: 'BOOKING',
  REVIEW_APPROVED:   'SYSTEM',
  REVIEW_REJECTED:   'SYSTEM',
  LEVEL_UP:          'LEVEL',
  BADGE_EARNED:      'BADGE',
  REFUND_ISSUED:     'PAYMENT',
  PAYMENT_FAILED:    'PAYMENT',
};

@Injectable()
export class NotificationsService implements INotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  async send(params: NotificationParams): Promise<void> {
    try {
      const mappedType = (NOTIF_TYPE_MAP[params.type as unknown as string] ?? 'SYSTEM') as any;
      await this.prisma.notification.create({
        data: {
          userId:   params.userId,
          type:     mappedType,
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
