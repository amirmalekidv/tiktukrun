import { Injectable, Logger } from '@nestjs/common';
import { ConfigService }      from '@nestjs/config';
import axios                  from 'axios';
import {
  IPaymentProvider,
  PaymentInitiateParams,
  PaymentInitiateResult,
  PaymentVerifyParams,
  PaymentVerifyResult,
} from './payment-provider.interface';

@Injectable()
export class ZarinpalProvider implements IPaymentProvider {
  private readonly logger = new Logger(ZarinpalProvider.name);
  private readonly isSandbox: boolean;
  private readonly merchantId: string;
  private readonly baseUrl: string;
  private readonly payUrl:  string;

  constructor(private config: ConfigService) {
    this.isSandbox  = config.get<boolean>('ZARINPAL_SANDBOX', true);
    this.merchantId = config.get<string>('ZARINPAL_MERCHANT_ID', '');

    this.baseUrl = this.isSandbox
      ? 'https://sandbox.zarinpal.com/pg/v4/payment'
      : 'https://api.zarinpal.com/pg/v4/payment';

    this.payUrl = this.isSandbox
      ? 'https://sandbox.zarinpal.com/pg/StartPay'
      : 'https://www.zarinpal.com/pg/StartPay';
  }

  async initiate(params: PaymentInitiateParams): Promise<PaymentInitiateResult> {
    // اگر merchantId خالی است — Mock
    if (!this.merchantId) {
      return this.mockInitiate(params);
    }

    try {
      const response = await axios.post(`${this.baseUrl}/request.json`, {
        merchant_id:  this.merchantId,
        amount:       Number(params.amount),  // تومان
        description:  params.description,
        callback_url: params.callbackUrl,
        metadata: {
          userId:    params.userId,
          bookingId: params.bookingId,
          paymentId: params.paymentId,
        },
      });

      const { data } = response;
      if (data.data?.code !== 100) {
        throw new Error(`ZarinPal error: ${data.errors?.message ?? 'Unknown'}`);
      }

      const authority = data.data.authority;
      return {
        authority,
        paymentUrl: `${this.payUrl}/${authority}`,
      };
    } catch (err) {
      this.logger.error('ZarinPal initiate failed', err);
      throw err;
    }
  }

  async verify(params: PaymentVerifyParams): Promise<PaymentVerifyResult> {
    if (!this.merchantId) {
      return this.mockVerify(params);
    }

    try {
      const response = await axios.post(`${this.baseUrl}/verify.json`, {
        merchant_id: this.merchantId,
        amount:      Number(params.amount),
        authority:   params.authority,
      });

      const { data } = response;
      if (data.data?.code === 100 || data.data?.code === 101) {
        return { success: true, refId: String(data.data.ref_id) };
      }

      return { success: false, message: data.errors?.message ?? 'تایید ناموفق' };
    } catch (err) {
      this.logger.error('ZarinPal verify failed', err);
      return { success: false, message: 'خطا در تایید پرداخت' };
    }
  }

  // ─── Mock برای sandbox بدون merchantId ──────────────────────────────────────
  private mockInitiate(params: PaymentInitiateParams): PaymentInitiateResult {
    const authority = `MOCK_${params.paymentId}_${Date.now()}`;
    this.logger.warn(`[MOCK] ZarinPal initiate: authority=${authority}`);
    return {
      authority,
      paymentUrl: `${params.callbackUrl}?Authority=${authority}&Status=OK&paymentId=${params.paymentId}`,
    };
  }

  private mockVerify(_params: PaymentVerifyParams): PaymentVerifyResult {
    this.logger.warn('[MOCK] ZarinPal verify: success=true');
    return { success: true, refId: `MOCK_REF_${Date.now()}` };
  }
}
