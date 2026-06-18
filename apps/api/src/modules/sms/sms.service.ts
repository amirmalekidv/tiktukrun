/**
 * SmsService — supports OTP and notification messages.
 * In dev/QA, SMS_MOCK_MODE=true causes the code to be logged (not sent).
 */
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly mockMode: boolean;

  constructor() {
    this.mockMode = process.env.SMS_MOCK_MODE === 'true' || !process.env.SMSIR_API_KEY;
    if (this.mockMode) {
      this.logger.warn('SMS Service is in MOCK MODE — codes are logged, not sent.');
    }
  }

  async send(phone: string, message: string): Promise<void> {
    if (this.mockMode) {
      this.logger.log(`[SMS-MOCK] To: ${phone} | Message: ${message.slice(0, 120)}`);
      return;
    }
    // TODO: Real SMS.ir implementation
    this.logger.log(`[SMS] To: ${phone} | Message: ${message.slice(0, 60)}...`);
  }

  async sendOtp(phone: string, code: string): Promise<void> {
    if (this.mockMode) {
      // In mock mode, log the OTP code prominently so QA can use it
      this.logger.warn(`╔══════════════════════════════════════════════╗`);
      this.logger.warn(`║  [SMS-MOCK OTP] ${phone} → CODE: ${code}     ║`);
      this.logger.warn(`╚══════════════════════════════════════════════╝`);
      return;
    }
    const message = `کد تأیید تیک تاک ران: ${code}\nاین کد تا ۲ دقیقه معتبر است.`;
    await this.send(phone, message);
  }

  async sendBulk(template: string, recipients: string[]): Promise<void> {
    this.logger.log(`[SMS BULK] Template: ${template} | Recipients: ${recipients.length}`);
    for (const phone of recipients) {
      await this.send(phone, template);
    }
  }
}
