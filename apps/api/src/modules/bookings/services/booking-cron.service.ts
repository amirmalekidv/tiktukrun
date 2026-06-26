import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { NotificationType } from '@tiktakrun/shared-types';
import { PrismaService } from '../../../prisma/prisma.service';
import { BookingRewardsService } from './booking-rewards.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { SettingsService } from '../../settings/settings.service';

@Injectable()
export class BookingCronService {
  private readonly logger = new Logger(BookingCronService.name);

  constructor(
    private prisma: PrismaService,
    private rewards: BookingRewardsService,
    private notif: NotificationsService,
    private settings: SettingsService,
  ) {}

  /**
   * هر ۵ دقیقه: PENDING‌های قدیمی‌تر از timeout → CANCELLED
   */
  @Cron('*/5 * * * *')
  async cancelTimedOutPending() {
    const timeoutMinutes = Number(
      await this.settings.get('booking.pendingTimeoutMinutes', '60'),
    );
    const cutoff = new Date(Date.now() - timeoutMinutes * 60 * 1000);

    const pending = await this.prisma.booking.findMany({
      where: {
        status: 'PENDING',
        createdAt: { lt: cutoff },
      },
      select: { id: true, userId: true },
    });

    if (pending.length === 0) return;

    const ids = pending.map((b) => b.id);

    await this.prisma.booking.updateMany({
      where: { id: { in: ids } },
      data: { status: 'CANCELLED', cancelledAt: new Date(), cancelReason: 'timeout' },
    });

    await this.prisma.payment.updateMany({
      where: { bookingId: { in: ids }, status: 'PENDING' },
      data: { status: 'FAILED' },
    });

    this.logger.log(`Cancelled ${ids.length} timed-out PENDING bookings`);

    for (const b of pending) {
      await this.notif
        .send({
          userId: b.userId,
          type: NotificationType.BOOKING_CANCELLED,
          title: 'رزرو لغو شد',
          body: 'رزرو شما به دلیل عدم پرداخت لغو شد.',
          data: { bookingId: b.id },
        })
        .catch(() => {});
    }
  }

  /**
   * هر ۳۰ دقیقه: CONFIRMED‌هایی که slotDateTime + buffer گذشته → COMPLETED + جوایز
   */
  @Cron('*/30 * * * *')
  async autoCompleteConfirmed() {
    const bufferMinutes = Number(
      await this.settings.get('booking.completionBufferMinutes', '60'),
    );
    const cutoff = new Date(Date.now() - bufferMinutes * 60 * 1000);

    const confirmed = await this.prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        slotDateTime: { lt: cutoff },
      },
      select: { id: true, userId: true },
    });

    if (confirmed.length === 0) return;

    for (const booking of confirmed) {
      await this.prisma.booking.update({
        where: { id: booking.id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });

      await this.rewards.awardBookingCompletion(booking.id, booking.userId);

      await this.notif
        .send({
          userId: booking.userId,
          type: NotificationType.BOOKING_COMPLETED,
          title: 'بازی تمام شد! 🎮',
          body: 'تجربه‌ات را امتیاز بده و XP بیشتری کسب کن.',
          data: { bookingId: booking.id },
        })
        .catch(() => {});
    }

    this.logger.log(`Auto-completed ${confirmed.length} CONFIRMED bookings`);
  }
}
