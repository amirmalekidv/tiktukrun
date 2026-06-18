import { Logger } from '@nestjs/common';
import { SmsProvider } from '../sms.interface';

/**
 * Mock SMS provider for development/testing
 * When SMS_MOCK_MODE=true, logs to console instead of sending real SMS
 */
export class MockSmsProvider implements SmsProvider {
  private readonly logger = new Logger('MockSmsProvider');

  async sendOtp(mobile: string, code: string): Promise<void> {
    this.logger.warn(`[SMS MOCK] OTP → ${mobile} | Code: ${code}`);
    console.log(`\n📱 [SMS MOCK] ─────────────────────`);
    console.log(`   Mobile: ${mobile}`);
    console.log(`   OTP Code: ${code}`);
    console.log(`   Expires in: 120 seconds`);
    console.log(`──────────────────────────────────\n`);
  }

  async sendNotification(
    mobile: string,
    templateId: string,
    variables: Record<string, string>,
  ): Promise<void> {
    this.logger.warn(`[SMS MOCK] Notification → ${mobile} | Template: ${templateId}`);
    console.log(`\n📱 [SMS MOCK] ─────────────────────`);
    console.log(`   Mobile: ${mobile}`);
    console.log(`   Template: ${templateId}`);
    console.log(`   Variables: ${JSON.stringify(variables)}`);
    console.log(`──────────────────────────────────\n`);
  }
}
