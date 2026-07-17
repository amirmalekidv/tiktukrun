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
import {
  BranchScopeContext,
  applyBranchFilter,
  assertResourceInBranchScope,
  isBranchManagerRole,
  resolveBranchFilter,
} from '../../../common/helpers/branch-scope.helper';

@Injectable()
export class BookingsAdminService {
  private readonly logger = new Logger(BookingsAdminService.name);

  constructor(
    private prisma:   PrismaService,
    private sm:       BookingStateMachine,
    private rewards:  BookingRewardsService,
    private notif:    NotificationsService,
  ) {}

  async findAll(query: BookingQueryDto, scope: BranchScopeContext) {
    const { skip, take, page, limit } = parsePagination(query);
    const where: any = {};

    applyBranchFilter(where, scope);

    if (query.status)   where.status   = query.status;
    if (query.userId)   where.userId   = query.userId;
    if (query.gameId)   where.gameId   = query.gameId;
    if (query.branchId && !isBranchManagerRole(scope.role)) {
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
        { teamName:    { contains: query.q, mode: 'insensitive' } },
        { user:        { mobile: { contains: query.q } } },
        { game:        { title: { contains: query.q, mode: 'insensitive' } } },
        { branch:      { name: { contains: query.q, mode: 'insensitive' } } },
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
          branch: {
            select: {
              id: true,
              name: true,
              city: { select: { id: true, name: true, slug: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return buildPaginatedResponse(items, total, page, limit);
  }

  async getCalendar(
    branchFilter?: string | { in: string[] },
    from?: string,
    to?: string,
  ) {
    const now = new Date();
    const start = from ? new Date(from) : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = to ? new Date(to) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const where: any = {
      slotDateTime: { gte: start, lte: end },
      status: { in: ['PENDING', 'CONFIRMED'] },
    };
    if (branchFilter !== undefined && branchFilter !== null && branchFilter !== '') {
      where.branchId = branchFilter;
    }
    const bookings = await this.prisma.booking.findMany({
      where,
      include: {
        game: { select: { title: true, coverImage: true } } as any,
        branch: {
          select: {
            id: true,
            name: true,
            city: { select: { id: true, name: true, slug: true } },
          },
        },
        user: { select: { fullName: true, mobile: true } },
      },
      orderBy: { slotDateTime: 'asc' },
    });

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

    return { branchId: branchFilter, from: start.toISOString(), to: end.toISOString(), calendar };
  }

  async findOne(id: string, scope: BranchScopeContext) {
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

    assertResourceInBranchScope(booking.branchId, scope, 'رزرو یافت نشد');

    return booking;
  }

  async updateStatus(
    id:   string,
    dto:  AdminUpdateBookingStatusDto,
    scope: BranchScopeContext,
  ) {
    const booking = await this.findOne(id, scope);
    this.sm.assertTransition(booking.status as any, dto.status as any);

    const data: any = {
      status:      dto.status,
      adminNote:   dto.reason,
    };

    if (dto.status === 'CONFIRMED')  data.confirmedAt  = new Date();
    if (dto.status === 'COMPLETED')  data.completedAt  = new Date();
    if (dto.status === 'CANCELLED')  data.cancelledAt  = new Date();

    const updated = await this.prisma.booking.update({ where: { id }, data });

    if (dto.status === 'COMPLETED') {
      await this.rewards.awardBookingCompletion(id, booking.userId);
    }

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

  async refund(id: string, dto: RefundBookingDto, scope: BranchScopeContext) {
    const booking = await this.findOne(id, scope);

    this.sm.assertTransition(booking.status as any, 'REFUNDED');

    const amount = Math.round(dto.amount);

    await this.prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id },
        data:  { status: 'REFUNDED', cancelReason: dto.reason },
      });

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

  async complete(id: string, scope: BranchScopeContext) {
    const booking = await this.findOne(id, scope);
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
    scope:     BranchScopeContext,
  ) {
    const booking = await this.findOne(bookingId, scope);

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
        reason:     dto.reason ?? `rated by ${scope.role}`,
      },
    });

    this.logger.log(`Player rated: userId=${booking.userId} xpDelta=${dto.xpDelta}`);
    return record;
  }

  async exportExcel(query: BookingQueryDto, scope: BranchScopeContext) {
    const pageSize = 100;
    let page = 1;
    const rows: any[] = [];

    while (true) {
      const result = await this.findAll({ ...query, limit: pageSize, page }, scope);
      const batch = (result as any).data as any[];
      rows.push(...batch);
      const totalPages = (result as any).pagination?.totalPages ?? 1;
      if (page >= totalPages || batch.length === 0) break;
      page += 1;
    }

    const headers = ['code', 'teamName', 'userMobile', 'game', 'branch', 'status', 'totalAmount', 'slotDateTime'];
    const csv = [
      headers.join(','),
      ...rows.map((r) =>
        [
          r.code,
          r.teamName ?? '',
          r.user?.mobile ?? '',
          r.game?.title ?? '',
          r.branch?.name ?? '',
          r.status,
          r.totalAmount?.toString() ?? '',
          r.slotDateTime?.toISOString() ?? '',
        ].join(','),
      ),
    ].join('\n');

    return csv;
  }

  async adminCreate(dto: AdminCreateBookingDto, scope: BranchScopeContext) {
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException('کاربر یافت نشد');

    const game = await this.prisma.game.findUnique({ where: { id: dto.gameId } });
    if (!game) throw new NotFoundException('بازی یافت نشد');
    if (!game.isActive) throw new BadRequestException('این بازی فعال نیست');

    assertResourceInBranchScope(
      game.branchId,
      scope,
      'شما فقط می‌توانید برای بازی‌های شعبه خود رزرو ثبت کنید',
    );

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
          teamName:        dto.teamName,
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
