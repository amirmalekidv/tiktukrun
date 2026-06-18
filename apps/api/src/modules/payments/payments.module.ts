import { Module }           from '@nestjs/common';
import { ConfigModule }     from '@nestjs/config';
import { PaymentsController, PaymentsAdminController } from './payments.controller';
import { PaymentsService }  from './payments.service';
import { ZarinpalProvider } from './providers/zarinpal.provider';
import { PAYMENT_PROVIDER } from './providers/payment-provider.interface';

@Module({
  imports:     [ConfigModule],
  controllers: [PaymentsController, PaymentsAdminController],
  providers: [
    PaymentsService,
    // ZarinpalProvider یک‌بار به عنوان token ثبت می‌شود؛ تکرار مستقیم آن حذف شد
    {
      provide:  PAYMENT_PROVIDER,
      useClass: ZarinpalProvider,
    },
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
