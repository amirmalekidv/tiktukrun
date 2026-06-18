export interface PaymentInitiateParams {
  amount:      number;         // تومان
  description: string;
  callbackUrl: string;
  userId:      string;
  bookingId:   string;
  paymentId:   string;
}

export interface PaymentInitiateResult {
  paymentUrl: string;
  authority:  string;
}

export interface PaymentVerifyParams {
  authority: string;
  amount:    number;
}

export interface PaymentVerifyResult {
  success:  boolean;
  refId?:   string;
  message?: string;
}

export interface IPaymentProvider {
  initiate(params: PaymentInitiateParams): Promise<PaymentInitiateResult>;
  verify(params: PaymentVerifyParams):     Promise<PaymentVerifyResult>;
}

export const PAYMENT_PROVIDER = 'PAYMENT_PROVIDER';
