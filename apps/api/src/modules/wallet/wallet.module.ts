import { Module } from '@nestjs/common';
import { WalletController, WalletAdminController } from './wallet.controller';
import { WalletService } from './wallet.service';

@Module({
  controllers: [WalletController, WalletAdminController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
