import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService }           from '../../../prisma/prisma.service';
import { NotificationType } from '@tiktakrun/shared-types';
import { BookingStateMachine }     from './booking-state-machine.service';
import { BookingRewardsService }   from './booking-rewards.service';
import { DiscountResolverService } from '../../discounts/services/discount-resolver.service';
import { PaymentsService }         from '../../payments/payments.service';
import { NotificationsService }    from '../../notifications/notifications.service';
import { WalletService }           from '../../wallet/wallet.service';
import { SettingsService }         from '../../settings/settings.service';
import { TransactionType, CurrencyType } from '@prisma/client';
import {
  BookingPreviewDto,
  CreateBookingDto,
  PaymentMethod,
  BookingQueryDto,
} from '../dto/booking.dto';
import { parsePagination, buildPaginatedResponse } from '../../../common/helpers/pagination.helper';
import { DateTime }   from 'luxon';
import { v4 as uuid } from 'uuid';
import { nanoid }     from 'nanoid';

const TEHRAN_TZ = 'Asia/Tehran';

interface BookingPolicySettings {
  minAdvanceMinutes: number;
  refundWindowHours: number;
  partialRefundRatio: number;
  maxConcurrent: number;
}

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private prisma:    PrismaService,
    private sm:        BookingStateMachine,
    private rewards:   BookingRewardsService,
    private resolver:  DiscountResolverService,
    private payments:  PaymentsService,
    private notif:     NotificationsService,
    private wallet:    WalletService,
    private settings:  SettingsService,
  ) {}

  private async getBookingPolicy(): Promise<BookingPolicySettings> {
    const [minAdvanceMinutes, refundWindowHours, partialRefundRatio, maxConcurrent] =
      await Promise.all([
        this.settings.get('booking.minAdvanceMinutes', '30'),
        this.settings.get('financial.refundWindowHours', '24'),
        this.settings.get('financial.partialRefundRatio', '0.5'),
        this.settings.get('booking.maxConcurrent', '1'),
      ]);
    return {
      minAdvanceMinutes: Number(minAdvanceMinutes),
      refundWindowHours: Number(refundWindowHours),
      partialRefundRatio: Number(partialRefundRatio),
      maxConcurrent: Number(maxConcurrent),
    };
  }

  private async getRewardPreview() {
    const [xpPerBooking, coinsPerBooking] = await Promise.all([
      this.settings.get('gamification.xpPerBooking', '50'),
      this.settings.get('gamification.coinsPerBooking', '20'),
    ]);
    return {
      xpReward: Number(xpPerBooking),
      coinReward: Number(coinsPerBooking),
    };
  }

  // ─── Private helpers ────────────────────────────────────────────────────────
  private async validateSlot(gameId: string, slotDateTime: Date, playersCount: number) {
    const policy = await this.getBookingPolicy();
    const game = await this.prisma.game.findFirst({
      where: { id: gameId, isActive: true },
    });
    if (!game) throw new NotFoundException('بازی یافت نشد');

    if (playersCount < game.minPlayers || playersCount > game.maxPlayers) {
      throw new BadRequestException(
        `تعداد بازیکنان باید بین ${game.minPlayers} و ${game.maxPlayers} باشد`,
      );
    }

    const now  = DateTime.now().setZone(TEHRAN_TZ);
    const slot = DateTime.fromJSDate(slotDateTime, { zone: TEHRAN_TZ });
    const diff = slot.diff(now, 'minutes').minutes;
    if (diff < policy.minAdvanceMinutes) {
      throw new BadRequestException(
        `رزرو باید حداقل ${policy.minAdvanceMinutes} دقیقه قبل باشد`,
      );
    }

    const maxConcurrent = policy.maxConcurrent;
    const slotStart = slot.toJSDate();
    const count = await this.prisma.booking.count({
      where: {
        gameId,
        slotDateTime: slotStart,
        status:       { in: ['PENDING', 'CONFIRMED'] },
      },
    });
    if (count >= maxConcurrent) {
      throw new BadRequestException('این slot دیگر موجود نیست');
    }

    return game;
  }

  // ─── Preview ─────────────────────────────────────────────────────────────────
  async preview(userId: string, dto: BookingPreviewDto) {
    const game = await this.validateSlot(
      dto.gameId,
      new Date(dto.slotDateTime),
      dto.playersCount,
    );

    const basePrice = Number(game.pricePerPerson) * dto.playersCount;
    const discount  = await this.resolver.resolveBest(
      userId,
      dto.gameId,
      BigInt(basePrice),
      dto.discountCode,
      new Date(dto.slotDateTime),
    );

    const rewardPreview = await this.getRewardPreview();

    return {
      gameId:         dto.gameId,
      slotDateTime:   dto.slotDateTime,
      playersCount:   dto.playersCount,
      pricePerPerson: game.pricePerPerson.toString(),
      basePrice:      basePrice.toString(),
      discountAmount: discount.discountAmount.toString(),
      finalPrice:     discount.finalPrice.toString(),
      appliedCode:    discount.appliedCode,
      appliedAuto:    discount.appliedAuto,
      breakdown:      discount.breakdown.map((b) => ({ ...b, amount: b.amount.toString() })),
      xpReward:       rewardPreview.xpReward,
      coinReward:     rewardPreview.coinReward,
    };
  }

  // ─── Create Booking ───────────────────────────────────────────────────────────
  async create(userId: string, dto: CreateBookingDto) {
    const slotDt = new Date(dto.slotDateTime);
    const game   = await this.validateSlot(dto.gameId, slotDt, dto.playersCount);

    const basePriceNum = Number(game.pricePerPerson) * dto.playersCount;
    const discount  = await this.resolver.resolveBest(
      userId,
      dto.gameId,
      BigInt(basePriceNum),
      dto.discountCode,
      slotDt,
    );
    const basePrice      = basePriceNum;
    const discountAmount = Number(discount.discountAmount);
    const totalAmount    = Number(discount.finalPrice);

    // Unique booking code (8 chars)
    const code = nanoid(8).toUpperCase();

    // ─── WALLET ───────────────────────────────────────────────────────────────
    if (dto.paymentMethod === PaymentMethod.WALLET) {
      const balance = Number(await this.wallet.getBalance(userId));
      if (balance < totalAmount) {
        throw new BadRequestException('موجودی کیف پول کافی نیست');
      }

      return this.prisma.$transaction(async (tx) => {
        // Booking
        const booking = await tx.booking.create({
          data: {
            userId,
            gameId:          dto.gameId,
            branchId:        game.branchId,
            slotDateTime:    slotDt,
            playersCount:    dto.playersCount,
            basePrice,
            discountApplied: discountAmount,
            totalAmount,
            paymentMethod:   dto.paymentMethod,
            code,
            note:            dto.note,
            status:          'CONFIRMED',
          },
        });

        // Payment record
        const payment = await tx.payment.create({
          data: {
            userId,
            bookingId: booking.id,
            amount:    totalAmount,
            status:    'SUCCESS',
            method:    'WALLET',
          },
        });

        // Wallet debit (استفاده مستقیم از prisma در transaction)
        const wallet = await tx.wallet.upsert({
          where:  { userId },
          update: { tomanBalance: { decrement: totalAmount } },
          create: { userId, tomanBalance: -totalAmount },
          select: { id: true, tomanBalance: true },
        });
        await tx.transaction.create({
          data: {
            walletId:     wallet.id,
            currency:     'TOMAN',
            amount:       -totalAmount,
            balanceAfter: wallet.tomanBalance,
            type:         TransactionType.BOOKING_PAYMENT,
            description:  `رزرو بازی — کد ${code}`,
            refType:      'BOOKING',
            refId:        booking.id,
          },
        });

        // ثبت استفاده از کد تخفیف
        if (dto.discountCode && discount.appliedCode) {
          // ابتدا کد را update کن، سپس ID را جداگانه بگیر تا await داخل data نداشته باشیم
          const dcRecord = await tx.discountCode.findFirst({
            where:  { code: dto.discountCode },
            select: { id: true },
          });
          if (dcRecord) {
            await tx.discountCode.update({
              where: { id: dcRecord.id },
              data:  { usedCount: { increment: 1 } },
            });
            await tx.booking.update({ where: { id: booking.id }, data: { discountCodeId: dcRecord.id } });
            await tx.discountUsage.create({
              data: {
                codeId:      dcRecord.id,
                userId,
                bookingId:   booking.id,
                savedAmount: discountAmount,
              },
            });
          }
        }

        return { booking, payment };
      }).then(async ({ booking }) => {
        // اطلاع‌رسانی خارج از transaction
        await this.notif.send({
          userId,
          type:  NotificationType.BOOKING_CONFIRMED,
          title: 'رزرو تأیید شد ✅',
          body:  `رزرو شما با کد ${code} تأیید شد.`,
          data:  { bookingId: booking.id },
        }).catch(() => {});

        return { success: true, data: { bookingId: booking.id, code, status: 'CONFIRMED' } };
      });
    }

    // ─── ZARINPAL ─────────────────────────────────────────────────────────────
    const booking = await this.prisma.booking.create({
      data: {
        userId,
        gameId:          dto.gameId,
        branchId:        game.branchId,
        slotDateTime:    slotDt,
        playersCount:    dto.playersCount,
        basePrice,
        discountApplied: discountAmount,
        totalAmount,
        paymentMethod:   dto.paymentMethod,
        code,
        note:            dto.note,
        status:          'PENDING',
      },
    });

    const payment = await this.prisma.payment.create({
      data: {
        userId,
        bookingId: booking.id,
        amount:    totalAmount,
        status:    'PENDING',
        method:    'ZARINPAL',
      },
    });

    const initiateResult = await this.payments.initiate({
      amount:      totalAmount,
      description: `رزرو بازی ${game.title} — کد ${code}`,
      callbackUrl: '',  // در PaymentsService تنظیم می‌شود
      userId,
      bookingId:   booking.id,
      paymentId:   payment.id,
    });

    return {
      success: true,
      data: {
        bookingId:  booking.id,
        code,
        status:     'PENDING',
        paymentUrl: initiateResult.paymentUrl,
      },
    };
  }

  // ─── My bookings ──────────────────────────────────────────────────────────────
  async findMyBookings(userId: string, query: BookingQueryDto) {
    const { skip, take, page, limit } = parsePagination(query);
    const where: any = { userId };
    if (query.status) where.status = query.status;

    const [items, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip,
        take,
        include: { game: { include: { images: { take: 1 } } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return buildPaginatedResponse(items, total, page, limit);
  }

  async findMyBooking(userId: string, id: string) {
    const booking = await this.prisma.booking.findFirst({
      where:   { id, userId },
      include: {
        game:    { include: { branch: true, images: true } },
        payment: true,
      },
    });
    if (!booking) throw new NotFoundException('رزرو یافت نشد');
    return booking;
  }

  // ─── Cancel by User ────────────────────────────────────────────────────────
  async cancelByUser(userId: string, bookingId: string) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, userId },
    });
    if (!booking) throw new NotFoundException('رزرو یافت نشد');

    // PENDING یا CONFIRMED قابل لغو توسط کاربر هستند
    if (booking.status !== 'CONFIRMED' && booking.status !== 'PENDING') {
      throw new BadRequestException('فقط رزروهای در انتظار یا تأییدشده قابل لغو هستند');
    }

    const slot  = DateTime.fromJSDate(booking.slotDateTime, { zone: TEHRAN_TZ });
    const now   = DateTime.now().setZone(TEHRAN_TZ);
    const hours = slot.diff(now, 'hours').hours;

    const policy = await this.getBookingPolicy();

    let refundAmount: number;
    if (booking.status === 'PENDING') {
      refundAmount = booking.paymentMethod === 'WALLET' ? Number(booking.totalAmount) : 0;
    } else if (hours > policy.refundWindowHours) {
      refundAmount = Number(booking.totalAmount);
    } else {
      refundAmount = Math.round(Number(booking.totalAmount) * policy.partialRefundRatio);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data:  {
          status:       'CANCELLED',
          cancelledAt:  new Date(),
          cancelReason: `لغو توسط کاربر — ${hours > policy.refundWindowHours ? 'استرداد کامل' : booking.status === 'PENDING' ? 'بدون پرداخت' : 'استرداد جزئی'}`,
        },
      });

      if (refundAmount > 0) {
        const wallet = await tx.wallet.upsert({
          where:  { userId },
          update: { tomanBalance: { increment: refundAmount } },
          create: { userId, tomanBalance: refundAmount },
          select: { id: true, tomanBalance: true },
        });
        await tx.transaction.create({
          data: {
            walletId:     wallet.id,
            currency:     'TOMAN',
            amount:       refundAmount,
            balanceAfter: wallet.tomanBalance,
            type:         TransactionType.REFUND,
            description:  `استرداد رزرو ${booking.code}`,
            refType:      'BOOKING',
            refId:        bookingId,
          },
        });
        await tx.payment.updateMany({
          where: { bookingId, status: 'SUCCESS' },
          data:  { status: 'REFUND' },
        });
      }
    });

    await this.notif.send({
      userId,
      type:  NotificationType.BOOKING_CANCELLED,
      title: 'رزرو لغو شد',
      body:  refundAmount > 0
        ? `${refundAmount} تومان به کیف پول شما برگشت داده شد.`
        : 'رزرو شما لغو شد.',
      data:  { bookingId, refundAmount: refundAmount.toString() },
    }).catch(() => {});

    return { success: true, data: { refundAmount: refundAmount.toString() } };
  }
}
