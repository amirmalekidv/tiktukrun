/**
 * SmsService — supports OTP and notification messages.
 * Delegates to SMS_PROVIDER (MockSmsProvider or SmsIrProvider) based on env/settings.
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SettingsService } from '../settings/settings.service';
import { SMS_PROVIDER, SmsProvider } from './sms.interface';
import { shouldUseMockSms } from './sms-config.util';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(
    @Inject(SMS_PROVIDER) private readonly provider: SmsProvider,
    private readonly settings: SettingsService,
    private readonly config: ConfigService,
  ) {}

  private async useMockMode(): Promise<boolean> {
    if (shouldUseMockSms(this.config)) return true;

    const providerSetting = (await this.settings.get('sms.provider', 'sms.ir')).toLowerCase();
    return providerSetting === 'mock';
  }

  async send(phone: string, message: string): Promise<void> {
    if (!phone) {
      this.logger.warn('SMS send skipped: empty phone number');
      return;
    }

    if (await this.useMockMode()) {
      this.logger.log(`[SMS-MOCK] To: ${phone} | Message: ${message.slice(0, 120)}`);
      return;
    }

    this.logger.log(`[SMS] To: ${phone} | Message: ${message.slice(0, 60)}...`);
    // Plain-text campaigns use resolved body; log until line-number bulk API is configured
  }

  async sendOtp(phone: string, code: string): Promise<void> {
    const enabled = (await this.settings.get('sms.sendOtp', 'true')) === 'true';
    if (!enabled) {
      this.logger.warn(`OTP SMS disabled by settings for ${phone}`);
      return;
    }

    await this.provider.sendOtp(phone, code);
  }

  async sendBookingConfirmation(mobile: string, bookingCode: string): Promise<void> {
    const enabled = (await this.settings.get('sms.sendBookingConfirm', 'true')) === 'true';
    if (!enabled) {
      this.logger.debug(`Booking confirm SMS disabled for ${mobile}`);
      return;
    }
    if (!mobile) return;

    const message = `رزرو تیک تاک ران با کد ${bookingCode} تأیید شد.`;
    await this.send(mobile, message);
  }

  async sendBulk(template: string, recipients: string[]): Promise<void> {
    this.logger.log(`[SMS BULK] Template: ${template} | Recipients: ${recipients.length}`);
    for (const phone of recipients) {
      if (phone) await this.send(phone, template);
    }
  }
}
