import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService }         from '../../../prisma/prisma.service';
import { NotificationType, UserRole } from '@tiktakrun/shared-types';
import { BookingStateMachine }   from './booking-state-machine.service';
import { BookingRewardsService } from './booking-rewards.service';
import { NotificationsService }  from '../../notifications/notifications.service';
import {
  AdminUpdateBookingStatusDto,
  RefundBookingDto,
  RatePlayerDto,
  BookingQueryDto,
  AdminCreateBookingDto,
} from '../dto/booking.dto';
import { nanoid } from 'nanoid';
import { TransactionType, CurrencyType } from '@prisma/client';
import { parsePagination, buildPaginatedResponse } from '../../../common/helpers/pagination.helper';
import { v4 as uuid } from 'uuid';

@Injectable()
export class BookingsAdminService {
  private readonly logger = new Logger(BookingsAdminService.name);

  constructor(
    private prisma:   PrismaService,
    private sm:       BookingStateMachine,
    private rewards:  BookingRewardsService,
    private notif:    NotificationsService,
  ) {}

  async findAll(
    query:      BookingQueryDto,
    userRole:   UserRole,
    branchId?:  string,
  ) {
    const { skip, take, page, limit } = parsePagination(query);
    const where: any = {};

    // BRANCH_MANAGER می‌تواند فقط شعبه خودش را ببیند
    if (userRole === UserRole.BRANCH_MANAGER && branchId) {
      where.branchId = branchId;
    }

    if (query.status)   where.status   = query.status;
    if (query.userId)   where.userId   = query.userId;
    if (query.gameId)   where.gameId   = query.gameId;
    if (query.branchId && userRole !== UserRole.BRANCH_MANAGER) {
      where.branchId = query.branchId;
    }

    if (query.from || query.to) {
      where.slotDateTime = {};
      if (query.from) where.slotDateTime.gte = new Date(query.from);
      if (query.to)   where.slotDateTime.lte = new Date(query.to);
    }

    if (query.q) {
      where.OR = [
        { code:        { contains: query.q, mode: 'insensitive' } },
        { user:        { phone: { contains: query.q } } },
        { game:        { title: { contains: query.q, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip,
        take,
        include: {
          user: { select: { id: true, fullName: true, mobile: true } },
          game: { select: { id: true, title: true, coverImage: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return buildPaginatedResponse(items, total, page, limit);
  }

  async getCalendar(branchId?: string, from?: string, to?: string) {
    // [QA Fix 2026-05-25] Defaults: full-month window if not provided; branchId optional & Int
    const now = new Date();
    const start = from ? new Date(from) : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = to ? new Date(to) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const where: any = {
      slotDateTime: { gte: start, lte: end },
      status: { in: ['PENDING', 'CONFIRMED'] },
    };
    if (branchId !== undefined && branchId !== null && branchId !== '') {
      where.branchId = branchId;
    }
    const bookings = await this.prisma.booking.findMany({
      where,
      include: {
        game: { select: { title: true, coverImage: true } } as any,
        user: { select: { fullName: true, mobile: true } },
      },
      orderBy: { slotDateTime: 'asc' },
    });

    // گروه‌بندی بر اساس تاریخ
    const calendar: Record<string, any[]> = {};
    for (const b of bookings as any[]) {
      const dateKey = b.slotDateTime.toISOString().split('T')[0];
      if (!calendar[dateKey]) calendar[dateKey] = [];
      calendar[dateKey].push({
        ...b,
        basePrice: b.basePrice?.toString(),
        discountApplied: b.discountApplied?.toString(),
        totalAmount: b.totalAmount?.toString(),
      });
    }

    return { branchId, from: start.toISOString(), to: end.toISOString(), calendar };
  }

  async findOne(id: string, userRole: UserRole, branchId?: string) {
    const booking = await this.prisma.booking.findUnique({
      where:   { id },
      include: {
        user:    { select: { id: true, fullName: true, mobile: true } },
        game:    { include: { branch: true } },
        payment: true,
        review:  true,
      },
    });
    if (!booking) throw new NotFoundException('رزرو یافت نشد');

    if (userRole === UserRole.BRANCH_MANAGER && branchId !== booking.branchId) {
      throw new NotFoundException('رزرو یافت نشد');
    }

    return booking;
  }

  async updateStatus(
    id:   string,
    dto:  AdminUpdateBookingStatusDto,
    userRole: UserRole,
    branchId?: string,
  ) {
    const booking = await this.findOne(id, userRole, branchId);
    this.sm.assertTransition(booking.status as any, dto.status as any);

    const data: any = {
      status:      dto.status,
      adminNote:   dto.reason,
    };

    if (dto.status === 'CONFIRMED')  data.confirmedAt  = new Date();
    if (dto.status === 'COMPLETED')  data.completedAt  = new Date();
    if (dto.status === 'CANCELLED')  data.cancelledAt  = new Date();

    const updated = await this.prisma.booking.update({ where: { id }, data });

    // اگر COMPLETED، اعطای جوایز
    if (dto.status === 'COMPLETED') {
      await this.rewards.awardBookingCompletion(id, booking.userId);
    }

    // اطلاع‌رسانی
    const notifType = {
      CONFIRMED: NotificationType.BOOKING_CONFIRMED,
      CANCELLED: NotificationType.BOOKING_CANCELLED,
      COMPLETED: NotificationType.BOOKING_COMPLETED,
    }[dto.status];

    if (notifType) {
      await this.notif.send({
        userId: booking.userId,
        type:   notifType,
        title:  `وضعیت رزرو: ${dto.status}`,
        body:   dto.reason ?? '',
        data:   { bookingId: id },
      }).catch(() => {});
    }

    return updated;
  }

  async refund(id: string, dto: RefundBookingDto, userRole: UserRole, branchId?: string) {
    const booking = await this.findOne(id, userRole, branchId);

    // طبق state machine فقط COMPLETED → REFUNDED مجاز است
    // برای CONFIRMED → ابتدا باید complete شود سپس refund
    this.sm.assertTransition(booking.status as any, 'REFUNDED');

    const amount = Math.round(dto.amount);

    await this.prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id },
        data:  { status: 'REFUNDED', cancelReason: dto.reason },
      });

      // افزایش موجودی کیف پول کاربر و ثبت تراکنش استرداد
      const wallet = await tx.wallet.upsert({
        where:  { userId: booking.userId },
        create: { userId: booking.userId, tomanBalance: amount },
        update: { tomanBalance: { increment: amount } },
      });

      await tx.transaction.create({
        data: {
          walletId:     wallet.id,
          type:         TransactionType.REFUND,
          currency:     CurrencyType.TOMAN,
          amount,
          balanceAfter: wallet.tomanBalance,
          description:  `استرداد توسط ادمین — ${dto.reason}`,
          refType:      'BOOKING',
          refId:        id,
        },
      });
    });

    await this.notif.send({
      userId: booking.userId,
      type:   NotificationType.REFUND_ISSUED,
      title:  'استرداد انجام شد',
      body:   `مبلغ ${amount} تومان به کیف پول شما افزوده شد.`,
      data:   { bookingId: id, amount },
    }).catch(() => {});

    return { success: true, data: { refundAmount: amount } };
  }

  async complete(id: string, userRole: UserRole, branchId?: string) {
    const booking = await this.findOne(id, userRole, branchId);
    this.sm.assertTransition(booking.status as any, 'COMPLETED');

    await this.prisma.booking.update({
      where: { id },
      data:  { status: 'COMPLETED', completedAt: new Date() },
    });

    await this.rewards.awardBookingCompletion(id, booking.userId);
    return { success: true, data: { bookingId: id, status: 'COMPLETED' } };
  }

  async ratePlayer(
    bookingId: string,
    dto:       RatePlayerDto,
    userRole:  UserRole,
    branchId?: string,
  ) {
    const booking = await this.findOne(bookingId, userRole, branchId);

    // XP delta (مثبت یا منفی)
    await this.prisma.userProfile.update({
      where: { userId: booking.userId },
      data:  { xp: { increment: dto.xpDelta } },
    });

    const record = await this.prisma.playerRating.create({
      data: {
        fromUserId: booking.userId,
        toUserId:   booking.userId,
        bookingId,
        xpChange:   dto.xpDelta,
        reason:     dto.reason ?? `rated by ${userRole}`,
      },
    });

    this.logger.log(`Player rated: userId=${booking.userId} xpDelta=${dto.xpDelta}`);
    return record;
  }

  async exportExcel(query: BookingQueryDto, userRole: UserRole, branchId?: string) {
    // در production از exceljs استفاده می‌شود
    // stub: CSV export — limit=100 به دلیل @Max(100) در DTO؛ در production pagination استفاده می‌شود
    const result = await this.findAll({ ...query, limit: 100, page: 1 }, userRole, branchId);
    const rows   = (result as any).data as any[];

    const headers = ['code', 'user', 'game', 'status', 'totalAmount', 'slotDateTime'];
    const csv = [
      headers.join(','),
      ...rows.map((r) =>
        [
          r.code,
          r.user?.phone ?? '',
          r.game?.title ?? '',
          r.status,
          r.totalAmount?.toString() ?? '',
          r.slotDateTime?.toISOString() ?? '',
        ].join(','),
      ),
    ].join('\n');

    return csv;
  }

  // ─── Manual booking creation (admin / POS) ─────────────────────────────────
  // Records a booking on behalf of a customer (walk-in / phone). Branch managers
  // may only create bookings for games in their own branch. Payment is recorded
  // as already settled with the chosen method.
  async adminCreate(
    dto: AdminCreateBookingDto,
    userRole: UserRole,
    branchId?: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException('کاربر یافت نشد');

    const game = await this.prisma.game.findUnique({ where: { id: dto.gameId } });
    if (!game) throw new NotFoundException('بازی یافت نشد');
    if (!game.isActive) throw new BadRequestException('این بازی فعال نیست');

    // Branch managers can only book games in their own branch.
    if (userRole === UserRole.BRANCH_MANAGER && branchId && game.branchId !== branchId) {
      throw new BadRequestException('شما فقط می‌توانید برای بازی‌های شعبه خود رزرو ثبت کنید');
    }

    const slotDt = new Date(dto.slotDateTime);
    if (Number.isNaN(slotDt.getTime())) {
      throw new BadRequestException('زمان رزرو نامعتبر است');
    }

    const basePrice = Number(game.pricePerPerson) * dto.playersCount;
    const totalAmount =
      dto.totalAmount != null ? Number(dto.totalAmount) : basePrice;
    const code = nanoid(8).toUpperCase();

    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.create({
        data: {
          userId:          dto.userId,
          gameId:          dto.gameId,
          branchId:        game.branchId,
          slotDateTime:    slotDt,
          playersCount:    dto.playersCount,
          basePrice,
          discountApplied: Math.max(0, basePrice - totalAmount),
          totalAmount,
          paymentMethod:   dto.paymentMethod as any,
          code,
          note:            dto.note ?? 'رزرو دستی توسط ادمین',
          status:          'CONFIRMED',
        },
        include: {
          user: { select: { id: true, fullName: true, mobile: true } },
          game: { select: { id: true, title: true } },
        },
      });

      await tx.payment.create({
        data: {
          userId:    dto.userId,
          bookingId: booking.id,
          amount:    totalAmount,
          status:    'SUCCESS',
          method:    dto.paymentMethod as any,
        },
      });

      this.logger.log(`Admin manual booking created: ${code} for user ${dto.userId}`);
      return booking;
    });
  }
}
