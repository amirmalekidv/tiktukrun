import { Global, Module } from '@nestjs/common';
import { WalletController, WalletAdminController } from './wallet.controller';
import { WalletService } from './wallet.service';

@Global()
@Module({
  controllers: [WalletController, WalletAdminController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
