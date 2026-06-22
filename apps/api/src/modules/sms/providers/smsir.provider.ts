import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { SmsProvider } from '../sms.interface';
import {
  getSmsIrApiKey,
  getSmsIrApiUrl,
  getSmsIrTemplateId,
  getSmsIrTemplateParam,
} from '../sms-config.util';

export class SmsIrProvider implements SmsProvider {
  private readonly logger = new Logger(SmsIrProvider.name);
  private readonly apiKey: string;
  private readonly apiUrl: string;
  private readonly otpTemplateId: string;
  private readonly otpTemplateParam: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = getSmsIrApiKey(configService);
    this.apiUrl = getSmsIrApiUrl(configService);
    this.otpTemplateId = getSmsIrTemplateId(configService);
    this.otpTemplateParam = getSmsIrTemplateParam(configService);
  }

  async sendOtp(mobile: string, code: string): Promise<void> {
    if (!this.apiKey || !this.otpTemplateId) {
      throw new Error('SMS.ir is not configured: SMS_IR_API_KEY and SMS_IR_TEMPLATE_ID are required');
    }

    try {
      const response = await axios.post(
        this.apiUrl,
        {
          mobile,
          templateId: parseInt(this.otpTemplateId, 10),
          parameters: [
            { name: this.otpTemplateParam, value: code },
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
    } catch (error: any) {
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
        this.apiUrl,
        {
          mobile,
          templateId: parseInt(templateId, 10),
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
    } catch (error: any) {
      this.logger.error(`Failed to send notification to ${mobile}: ${error.message}`);
      throw error;
    }
  }
}
