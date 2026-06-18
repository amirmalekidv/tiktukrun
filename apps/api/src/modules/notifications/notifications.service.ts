/**
 * NotificationsService
 * [QA Fix 2026-05-25]
 *   - schema fields: userId Int, type NotificationType, channel NotificationChannel,
 *     title, body, link, isRead, readAt, metadata Json, createdAt
 *   - No `data` field (use `metadata`)
 *   - Added methods used by NotificationsController.
 */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface SendNotificationDto {
  userId: string;
  type: string;
  title: string;
  body: string;
  link?: string;
  channel?: string;
  data?: Record<string, any>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async send(dto: SendNotificationDto): Promise<void> {
    try {
      await this.prisma.notification.create({
        data: {
          userId: dto.userId,
          type: dto.type as any,
          channel: (dto.channel as any) || 'INAPP',
          title: dto.title,
          body: dto.body,
          link: dto.link ?? null,
          metadata: (dto.data ?? {}) as any,
          isRead: false,
        } as any,
      });
    } catch (err: any) {
      this.logger.error(`Failed to send notification: ${err?.message}`);
    }
  }

  async sendBulk(notifications: SendNotificationDto[]): Promise<void> {
    for (const n of notifications) {
      await this.send(n);
    }
  }

  /**
   * Get user notifications (paginated)
   */
  async getUserNotifications(userId: string, query: any = {}) {
    const uid = userId;
    const page = Math.max(1, parseInt(String(query.page || 1)));
    const limit = Math.min(100, Math.max(1, parseInt(String(query.limit || 20))));
    const skip = (page - 1) * limit;
    const where: any = { userId: uid };
    if (query.unread === 'true' || query.unread === true) {
      where.isRead = false;
    }
    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);
    return {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId: userId, isRead: false },
    });
  }

  async markAsRead(userId: string, notificationId: string) {
    const uid = userId;
    const nid = notificationId;
    const existing = await this.prisma.notification.findFirst({
      where: { id: nid, userId: uid },
    });
    if (!existing) throw new NotFoundException('اعلان یافت نشد');
    await this.prisma.notification.update({
      where: { id: nid },
      data: { isRead: true, readAt: new Date() },
    });
    return { message: 'اعلان به عنوان خوانده‌شده علامت‌گذاری شد' };
  }

  async markAllAsRead(userId: string) {
    const uid = userId;
    const result = await this.prisma.notification.updateMany({
      where: { userId: uid, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { message: 'همه اعلان‌ها خوانده شدند', count: result.count };
  }

  async deleteNotification(userId: string, notificationId: string) {
    const uid = userId;
    const nid = notificationId;
    const existing = await this.prisma.notification.findFirst({
      where: { id: nid, userId: uid },
    });
    if (!existing) throw new NotFoundException('اعلان یافت نشد');
    await this.prisma.notification.delete({ where: { id: nid } });
    return { message: 'اعلان حذف شد' };
  }
}
