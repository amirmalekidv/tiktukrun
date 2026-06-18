import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { ConfigService }     from '@nestjs/config';
import { PrismaService }     from '../../prisma/prisma.service';
import {
  IPaymentProvider,
  PAYMENT_PROVIDER,
  PaymentInitiateParams,
} from './providers/payment-provider.interface';
import { parsePagination, buildPaginatedResponse } from '../../common/helpers/pagination.helper';

@Injectable()
export class PaymentsService {
  private readonly logger  = new Logger(PaymentsService.name);
  private readonly webUrl: string;

  constructor(
    private prisma:          PrismaService,
    private config:          ConfigService,
    @Inject(PAYMENT_PROVIDER)
    private paymentProvider: IPaymentProvider,
  ) {
    this.webUrl = config.get<string>('WEB_URL', 'http://localhost:3000');
  }

  // ─── Initiate (فراخوانی از BookingsService) ───────────────────────────────
  async initiate(params: PaymentInitiateParams) {
    const callbackUrl = `${this.config.get('API_URL', 'http://localhost:4000')}/api/v1/payments/zarinpal/verify?paymentId=${params.paymentId}`;

    const result = await this.paymentProvider.initiate({ ...params, callbackUrl });

    // ذخیره authority در payment record
    await this.prisma.payment.update({
      where: { id: params.paymentId },
      data:  { gatewayAuthority: result.authority },
    });

    return result;
  }

  // ─── Verify (callback از ZarinPal) ────────────────────────────────────────
  async verifyCallback(
    authority: string,
    status:    string,
    paymentId: string,
  ): Promise<string> {
    const payment = await this.prisma.payment.findUnique({
      where:   { id: paymentId },
      include: { booking: true },
    });
    if (!payment) {
      return `${this.webUrl}/bookings?status=error`;
    }

    const bookingId = payment.bookingId;

    if (status !== 'OK') {
      await this.prisma.$transaction([
        this.prisma.payment.update({
          where: { id: paymentId },
          data:  { status: 'FAILED', gatewayAuthority: authority },
        }),
        this.prisma.booking.update({
          where: { id: bookingId! },
          data:  { status: 'CANCELLED' },
        }),
      ]);
      this.logger.warn(`Payment failed: paymentId=${paymentId}`);
      return `${this.webUrl}/bookings/${bookingId}?status=failed`;
    }

    // Verify با ZarinPal
    const verifyResult = await this.paymentProvider.verify({
      authority,
      amount: payment.amount,
    });

    if (verifyResult.success) {
      await this.prisma.$transaction([
        this.prisma.payment.update({
          where: { id: paymentId },
          data:  {
            status:           'SUCCESS',
            gatewayAuthority: authority,
            gatewayRefId:     verifyResult.refId,
            paidAt:           new Date(),
          },
        }),
        this.prisma.booking.update({
          where: { id: bookingId! },
          data:  { status: 'CONFIRMED' },
        }),
      ]);
      this.logger.log(`Payment confirmed: bookingId=${bookingId} refId=${verifyResult.refId}`);
      return `${this.webUrl}/bookings/${bookingId}?status=success`;
    } else {
      await this.prisma.$transaction([
        this.prisma.payment.update({
          where: { id: paymentId },
          data:  { status: 'FAILED', gatewayAuthority: authority },
        }),
        this.prisma.booking.update({
          where: { id: bookingId! },
          data:  { status: 'CANCELLED' },
        }),
      ]);
      this.logger.warn(`Payment verify failed: ${verifyResult.message}`);
      return `${this.webUrl}/bookings/${bookingId}?status=failed`;
    }
  }

  // ─── Admin ────────────────────────────────────────────────────────────────
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
