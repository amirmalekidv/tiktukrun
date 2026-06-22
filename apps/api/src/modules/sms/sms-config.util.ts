import { ConfigService } from '@nestjs/config';

/** Canonical SMS.ir env keys (with legacy SMSIR_* fallbacks). */
export function getSmsIrApiKey(config: ConfigService): string {
  return config.get<string>('SMS_IR_API_KEY', '')
    || config.get<string>('SMSIR_API_KEY', '');
}

export function getSmsIrApiUrl(config: ConfigService): string {
  return config.get<string>('SMS_IR_API_URL', 'https://api.sms.ir/v1/send/verify');
}

export function getSmsIrTemplateId(config: ConfigService): string {
  return config.get<string>('SMS_IR_TEMPLATE_ID', '')
    || config.get<string>('SMSIR_TEMPLATE_ID_OTP', '')
    || config.get<string>('SMSIR_OTP_TEMPLATE_ID', '');
}

export function getSmsIrTemplateParam(config: ConfigService): string {
  return config.get<string>('SMS_IR_TEMPLATE_PARAM', 'OTP');
}

export function getSmsProviderName(config: ConfigService): string {
  return (config.get<string>('SMS_PROVIDER', '') || '').toLowerCase();
}

export function shouldUseMockSms(config: ConfigService): boolean {
  if (config.get<string>('SMS_MOCK_MODE') === 'true') return true;

  const provider = getSmsProviderName(config);
  if (provider === 'mock') return true;

  const apiKey = getSmsIrApiKey(config);
  if (!apiKey) return true;

  // sms.ir / smsir → real provider when API key is present
  if (provider === 'sms.ir' || provider === 'smsir') return false;

  // Unknown provider without explicit mock — fall back to mock if no key
  return false;
}
