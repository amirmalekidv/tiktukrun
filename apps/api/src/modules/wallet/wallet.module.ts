import { Global, Module } from '@nestjs/common';
import { WalletController, WalletAdminController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { PaymentsModule } from '../payments/payments.module';

@Global()
@Module({
  imports: [PaymentsModule],
  controllers: [WalletController, WalletAdminController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
