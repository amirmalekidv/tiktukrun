import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import {
  IPaymentProvider,
  PAYMENT_PROVIDER,
  PaymentInitiateParams,
} from './providers/payment-provider.interface';
import { parsePagination, buildPaginatedResponse } from '../../common/helpers/pagination.helper';
import { SmsService } from '../sms/sms.service';
import { NotificationType } from '@tiktakrun/shared-types';
import { NotificationsService } from '../notifications/notifications.service';
import { CurrencyType, TransactionType } from '@prisma/client';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly webUrl: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    @Inject(PAYMENT_PROVIDER)
    private paymentProvider: IPaymentProvider,
    private sms: SmsService,
    private notifications: NotificationsService,
  ) {
    this.webUrl = config.get<string>('WEB_URL', 'http://localhost:3000');
  }

  async initiate(params: PaymentInitiateParams) {
    const callbackUrl = `${this.config.get('API_URL', 'http://localhost:4000')}/api/v1/payments/zarinpal/verify?paymentId=${params.paymentId}`;

    const result = await this.paymentProvider.initiate({ ...params, callbackUrl });

    await this.prisma.payment.update({
      where: { id: params.paymentId },
      data:  { gatewayAuthority: result.authority },
    });

    return result;
  }

  /**
   * ZarinPal callback — handles both booking payments and wallet top-ups.
   * Lookup: paymentId query param (required). Authority is verified against gateway.
   */
  async verifyCallback(
    authority: string,
    status: string,
    paymentId: string,
  ): Promise<string> {
    const payment = await this.prisma.payment.findUnique({
      where:   { id: paymentId },
      include: { booking: true, user: { select: { id: true, mobile: true } } },
    });

    if (!payment) {
      return `${this.webUrl}/wallet?status=error`;
    }

    if (payment.status === 'SUCCESS') {
      return this.buildSuccessRedirect(payment);
    }

    const isWalletCharge = !!payment.walletId && !payment.bookingId;
    const bookingId = payment.bookingId;

    if (status !== 'OK') {
      await this.handleFailedPayment(payment.id, authority, bookingId);
      return isWalletCharge
        ? `${this.webUrl}/wallet?status=failed`
        : `${this.webUrl}/bookings/${bookingId}?status=failed`;
    }

    const verifyResult = await this.paymentProvider.verify({
      authority,
      amount: payment.amount,
    });

    if (!verifyResult.success) {
      await this.handleFailedPayment(payment.id, authority, bookingId);
      this.logger.warn(`Payment verify failed: ${verifyResult.message}`);
      return isWalletCharge
        ? `${this.webUrl}/wallet?status=failed`
        : `${this.webUrl}/bookings/${bookingId}?status=failed`;
    }

    if (isWalletCharge) {
      await this.completeWalletCharge(payment.id, authority, verifyResult.refId);
      return `${this.webUrl}/wallet?status=success`;
    }

    await this.completeBookingPayment(payment.id, authority, verifyResult.refId, bookingId!);

    if (payment.user?.mobile && payment.booking) {
      await this.sms.sendBookingConfirmation(
        payment.user.mobile,
        payment.booking.code,
      ).catch((err) => this.logger.warn(`Booking confirm SMS failed: ${err?.message}`));
    }

    await this.notifications.send({
      userId: payment.userId,
      type:   NotificationType.BOOKING_CONFIRMED,
      title:  'رزرو تأیید شد ✅',
      body:   payment.booking
        ? `رزرو شما با کد ${payment.booking.code} تأیید شد.`
        : 'رزرو شما تأیید شد.',
      data:   { bookingId: payment.bookingId },
    }).catch(() => {});

    this.logger.log(`Payment confirmed: bookingId=${bookingId} refId=${verifyResult.refId}`);
    return `${this.webUrl}/bookings/${bookingId}?status=success`;
  }

  private buildSuccessRedirect(payment: {
    walletId: string | null;
    bookingId: string | null;
  }): string {
    if (payment.walletId && !payment.bookingId) {
      return `${this.webUrl}/wallet?status=success`;
    }
    return `${this.webUrl}/bookings/${payment.bookingId}?status=success`;
  }

  private async handleFailedPayment(
    paymentId: string,
    authority: string,
    bookingId: string | null,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: paymentId },
        data:  { status: 'FAILED', gatewayAuthority: authority },
      });

      if (bookingId) {
        await tx.booking.update({
          where: { id: bookingId },
          data:  { status: 'CANCELLED' },
        });
      }
    });

    this.logger.warn(`Payment failed: paymentId=${paymentId}`);
  }

  private async completeWalletCharge(
    paymentId: string,
    authority: string,
    refId?: string,
  ): Promise<void> {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment?.walletId) throw new BadRequestException('پرداخت کیف پول نامعتبر است');

    await this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { id: payment.walletId! } });
      if (!wallet) throw new NotFoundException('کیف پول یافت نشد');

      const newBalance = wallet.tomanBalance + payment.amount;

      await tx.payment.update({
        where: { id: paymentId },
        data:  {
          status:           'SUCCESS',
          gatewayAuthority: authority,
          gatewayRefId:     refId,
          paidAt:           new Date(),
        },
      });

      await tx.wallet.update({
        where: { id: wallet.id },
        data:  { tomanBalance: newBalance },
      });

      await tx.transaction.create({
        data: {
          walletId:     wallet.id,
          type:         TransactionType.DEPOSIT,
          currency:     CurrencyType.TOMAN,
          amount:       payment.amount,
          balanceAfter: newBalance,
          refType:      'WALLET_CHARGE',
          refId:        paymentId,
          description:  `شارژ کیف پول — ${payment.amount.toLocaleString()} تومان`,
        },
      });
    });

    await this.notifications.send({
      userId: payment.userId,
      type:   NotificationType.PAYMENT,
      title:  'شارژ کیف پول موفق ✅',
      body:   `${payment.amount.toLocaleString()} تومان به کیف پول شما اضافه شد.`,
      data:   { paymentId, amount: payment.amount },
    }).catch(() => {});

    this.logger.log(`Wallet charge confirmed: paymentId=${paymentId} refId=${refId}`);
  }

  private async completeBookingPayment(
    paymentId: string,
    authority: string,
    refId: string | undefined,
    bookingId: string,
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: paymentId },
        data:  {
          status:           'SUCCESS',
          gatewayAuthority: authority,
          gatewayRefId:     refId,
          paidAt:           new Date(),
        },
      }),
      this.prisma.booking.update({
        where: { id: bookingId },
        data:  { status: 'CONFIRMED' },
      }),
    ]);
  }

  async findAll(query: any) {
    const { skip, take, page, limit } = parsePagination(query);
    const where: any = {};
    if (query.status)    where.status    = query.status;
    if (query.userId)    where.userId    = query.userId;
    if (query.bookingId) where.bookingId = query.bookingId;

    const [items, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take,
        include: { booking: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return buildPaginatedResponse(items, total, page, limit);
  }

  async findOne(id: string) {
    const p = await this.prisma.payment.findUnique({
      where:   { id },
      include: { booking: true },
    });
    if (!p) throw new NotFoundException('پرداخت یافت نشد');
    return p;
  }
}
