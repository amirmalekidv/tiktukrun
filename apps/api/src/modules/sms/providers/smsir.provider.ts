import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { SmsProvider } from '../sms.interface';

export class SmsIrProvider implements SmsProvider {
  private readonly logger = new Logger(SmsIrProvider.name);
  private readonly apiKey: string;
  private readonly otpTemplateId: string;
  private readonly baseUrl = 'https://api.sms.ir/v1';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('SMSIR_API_KEY', '');
    this.otpTemplateId = this.configService.get<string>('SMSIR_OTP_TEMPLATE_ID', '');
  }

  async sendOtp(mobile: string, code: string): Promise<void> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/send/verify`,
        {
          mobile,
          templateId: parseInt(this.otpTemplateId),
          parameters: [
            { name: 'Code', value: code },
          ],
        },
        {
          headers: {
            'X-API-KEY': this.apiKey,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      );

      if (response.data?.status !== 1) {
        throw new Error(`SMS.ir error: ${JSON.stringify(response.data)}`);
      }

      this.logger.log(`OTP sent to ${mobile}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP to ${mobile}: ${error.message}`);
      throw error;
    }
  }

  async sendNotification(
    mobile: string,
    templateId: string,
    variables: Record<string, string>,
  ): Promise<void> {
    try {
      const parameters = Object.entries(variables).map(([name, value]) => ({
        name,
        value,
      }));

      const response = await axios.post(
        `${this.baseUrl}/send/verify`,
        {
          mobile,
          templateId: parseInt(templateId),
          parameters,
        },
        {
          headers: {
            'X-API-KEY': this.apiKey,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      );

      if (response.data?.status !== 1) {
        throw new Error(`SMS.ir error: ${JSON.stringify(response.data)}`);
      }

      this.logger.log(`Notification sent to ${mobile}`);
    } catch (error) {
      this.logger.error(`Failed to send notification to ${mobile}: ${error.message}`);
      throw error;
    }
  }
}
