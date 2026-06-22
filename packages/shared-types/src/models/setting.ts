/**
 * Setting Models — TIK TAK RUN Shared Types
 */

export type SettingGroup = 'general' | 'financial' | 'chat' | 'security' | 'gamification' | 'ai';

export interface Setting {
  key: string;
  value: unknown;
  group: SettingGroup;
  updatedAt: string;
  updatedBy?: string;
}

/** تنظیمات گروه‌بندی‌شده */
export interface SettingsMap {
  general: {
    appName: string;
    supportEmail: string;
    supportPhone: string;
    maintenanceMode: boolean;
    appVersion: string;
  };
  financial: {
    commissionPercent: number;
    minWalletCharge: number;
    maxWalletCharge: number;
    vipCashbackPercent: number;
    refundDays: number;
  };
  chat: {
    maxMessagesPerMinute: number;
    autoMuteAt3Reports: boolean;
    bannedWords: string[];
    globalRoomEnabled: boolean;
  };
  security: {
    twoFactorEnabled: boolean;
    maxLoginAttempts: number;
    sessionExpireDays: number;
    otpExpireMinutes: number;
  };
  gamification: {
    xpPerBooking: number;
    xpPerInvite: number;
    coinsPerBooking: number;
    wheelCostCoins: number;
    wheelCostDiamonds: number;
    wheelXpThreshold: number;
    inviteXpReward: number;
  };
  ai: {
    recommendationsEnabled: boolean;
    chatbotEnabled: boolean;
  };
}

export interface AuditLog {
  id: string;
  actorId?: string;
  action: string;
  entity: string;
  entityId?: string;
  beforeJson?: Record<string, unknown>;
  afterJson?: Record<string, unknown>;
  ip?: string;
  ua?: string;
  createdAt: string;
}
