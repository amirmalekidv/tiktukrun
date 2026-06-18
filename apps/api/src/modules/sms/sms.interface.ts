/**
 * SMS Provider Interface
 * Abstraction layer for SMS providers
 */
export interface SmsProvider {
  /**
   * Send OTP verification code
   */
  sendOtp(mobile: string, code: string): Promise<void>;

  /**
   * Send notification via template
   */
  sendNotification(
    mobile: string,
    templateId: string,
    variables: Record<string, string>,
  ): Promise<void>;
}

export const SMS_PROVIDER = 'SMS_PROVIDER';
