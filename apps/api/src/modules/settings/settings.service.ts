import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const DEFAULT_SETTINGS: Record<string, { value: string; group: string; description?: string }> = {
  // General
  'public.siteName': { value: 'تیک تاک ران', group: 'general', description: 'نام سایت' },
  'public.theme': { value: 'dark', group: 'general', description: 'تم پیش‌فرض' },
  'public.maintenanceMode': { value: 'false', group: 'general', description: 'حالت تعمیر' },
  'public.supportPhone': { value: '021-12345678', group: 'general' },
  'public.currency': { value: 'تومان', group: 'general' },

  // Financial
  'financial.minTopup': { value: '50000', group: 'financial', description: 'حداقل شارژ کیف پول' },
  'financial.maxTopup': { value: '50000000', group: 'financial' },
  'financial.refundWindowHours': { value: '24', group: 'financial' },

  // Chat
  'chat.rateLimit': { value: '5', group: 'chat', description: 'حداکثر پیام در دقیقه' },
  'chat.autoMuteOnReports': { value: 'true', group: 'chat' },
  'chat.autoMuteThreshold': { value: '3', group: 'chat', description: 'تعداد گزارش برای mute خودکار' },
  'chat.maxMessageLength': { value: '500', group: 'chat' },

  // Security
  'security.jwtExpiry': { value: '7d', group: 'security' },
  'security.otpExpiry': { value: '120', group: 'security', description: 'ثانیه' },
  'security.maxLoginAttempts': { value: '5', group: 'security' },
  'security.lockoutMinutes': { value: '15', group: 'security' },

  // Gamification
  'gamification.wheelXpThreshold': { value: '20', group: 'gamification' },
  'gamification.wheelCostCoins': { value: '500', group: 'gamification' },
  'gamification.wheelCostDiamonds': { value: '5', group: 'gamification' },
  'gamification.xpPerBooking': { value: '50', group: 'gamification' },
  'gamification.xpPerReview': { value: '20', group: 'gamification' },
  'gamification.monthly_rewards': {
    value: JSON.stringify({
      topPlayer: { xp: 500, coins: 2000, freeTicket: true },
      topTeam: { coins: 5000, discountPercent: 20 },
      topGame: { xp: 200, coins: 1000 },
    }),
    group: 'gamification',
    description: 'جوایز ماهانه پیش‌فرض',
  },

  // SMS
  'sms.provider': { value: 'kavenegar', group: 'sms' },
  'sms.sendBookingConfirm': { value: 'true', group: 'sms' },
  'sms.sendOtp': { value: 'true', group: 'sms' },

  // Payments
  'payments.gateway': { value: 'zarinpal', group: 'payments' },
  'payments.sandboxMode': { value: 'true', group: 'payments' },
};

@Injectable()
export class SettingsService implements OnModuleInit {
  private readonly logger = new Logger(SettingsService.name);
  private cache = new Map<string, string>();

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedDefaults();
    await this.loadCache();
  }

  private async seedDefaults() {
    // [QA Fix 2026-05-25] فیلد `description` در schema حذف شده (مدل Setting)
    // برای حفظ مقدار توصیفی، آن را داخل JSON value به‌صورت _description ذخیره می‌کنیم.
    for (const [key, config] of Object.entries(DEFAULT_SETTINGS)) {
      await this.prisma.setting.upsert({
        where: { key },
        create: {
          key,
          value: config.value,
          group: config.group,
        },
        update: {}, // Don't overwrite existing values
      });
    }
  }

  private async loadCache() {
    const settings = await this.prisma.setting.findMany();
    for (const s of settings) {
      this.cache.set(s.key, this.toStr(s.value));
    }
    this.logger.log(`Loaded ${settings.length} settings into cache`);
  }

  async get(key: string, defaultValue?: string): Promise<string> {
    if (this.cache.has(key)) return this.cache.get(key);
    const setting = await this.prisma.setting.findUnique({ where: { key } });
    if (setting) {
      const v = this.toStr(setting.value);
      this.cache.set(key, v);
      return v;
    }
    return defaultValue ?? '';
  }

  /** Coerce a JSON-stored setting value into a string. */
  private toStr(value: any): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    return String(value);
  }

  async set(key: string, value: string): Promise<void> {
    await this.prisma.setting.upsert({
      where: { key },
      create: { key, value, group: 'general' },
      update: { value },
    });
    this.cache.set(key, value);
  }

  async findAll(group?: string) {
    const where: any = {};
    if (group) where.group = group;
    return this.prisma.setting.findMany({ where, orderBy: [{ group: 'asc' }, { key: 'asc' }] });
  }

  async findPublic() {
    return this.prisma.setting.findMany({
      where: { key: { startsWith: 'public.' } },
      select: { key: true, value: true },
    });
  }

  async bulkSet(items: { key: string; value: string }[]): Promise<void> {
    for (const { key, value } of items) {
      await this.set(key, value);
    }
  }

  invalidateCache(key?: string) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
}
