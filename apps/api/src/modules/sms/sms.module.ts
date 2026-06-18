import { Global, Module } from '@nestjs/common';
import { SmsService } from './sms.service';

/**
 * SmsModule — @Global()
 * SmsService is available throughout the entire app
 * without needing to import this module in every feature module.
 */
@Global()
@Module({
  providers: [SmsService],
  exports: [SmsService],
})
export class SmsModule {}
