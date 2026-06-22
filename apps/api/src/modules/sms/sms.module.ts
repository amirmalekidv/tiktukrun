import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SmsService } from './sms.service';
import { SMS_PROVIDER } from './sms.interface';
import { MockSmsProvider } from './providers/mock-sms.provider';
import { SmsIrProvider } from './providers/smsir.provider';
import { shouldUseMockSms } from './sms-config.util';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: SMS_PROVIDER,
      useFactory: (config: ConfigService) => {
        if (shouldUseMockSms(config)) {
          return new MockSmsProvider();
        }
        return new SmsIrProvider(config);
      },
      inject: [ConfigService],
    },
    SmsService,
  ],
  exports: [SmsService],
})
export class SmsModule {}
