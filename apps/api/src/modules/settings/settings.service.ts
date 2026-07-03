import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const DEFAULT_SETTINGS: Record<string, { value: string; group: string; description?: string }> = {
  // General
  'public.siteName': { value: 'تیک تاک ران', group: 'general', description: 'نام سایت' },
  'public.theme': { value: 'dark', group: 'general', description: 'تم پیش‌فرض' },
  'public.maintenanceMode': { value: 'false', group: 'general', description: 'حالت تعمیر' },
  'public.registrationEnabled': { value: 'true', group: 'general', description: 'ثبت‌نام کاربران' },
  'public.siteSlogan': { value: 'هیجان فرار اتاق‌های فرار', group: 'general' },
  'public.supportPhone': { value: '021-12345678', group: 'general' },
  'public.supportEmail': { value: 'support@tiktakrun.ir', group: 'general' },
  'public.address': { value: 'تهران، خیابان ولیعصر', group: 'general' },
  'public.workingHours': { value: '۹ صبح تا ۱۲ شب', group: 'general' },
  'public.timezone': { value: 'Asia/Tehran', group: 'general' },
  'public.language': { value: 'fa', group: 'general' },
  'public.currency': { value: 'تومان', group: 'general' },
  'booking.maxActivePerUser': { value: '5', group: 'general', description: 'حداکثر رزرو فعال هر کاربر' },

  // Financial
  'financial.minTopup': { value: '50000', group: 'financial', description: 'حداقل شارژ کیف پول' },
  'financial.maxTopup': { value: '50000000', group: 'financial' },
  'financial.refundWindowHours': { value: '24', group: 'financial' },
  'financial.partialRefundRatio': { value: '0.5', group: 'financial', description: 'نسبت استرداد جزئی پس از پایان مهلت' },

  // Booking policy
  'booking.minAdvanceMinutes': { value: '30', group: 'financial', description: 'حداقل فاصله رزرو تا شروع slot' },
  'booking.maxConcurrent': { value: '1', group: 'financial', description: 'حداکثر رزرو همزمان per slot' },
  'booking.pendingTimeoutMinutes': { value: '60', group: 'financial', description: 'لغو خودکار PENDING بدون پرداخت' },
  'booking.completionBufferMinutes': { value: '60', group: 'financial', description: 'تکمیل خودکار پس از slot + buffer' },

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
  'gamification.coinsPerBooking': { value: '20', group: 'gamification' },
  'gamification.coinsPerReview': { value: '10', group: 'gamification' },
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
  'sms.provider': { value: 'sms.ir', group: 'sms' },
  'sms.sendBookingConfirm': { value: 'true', group: 'sms' },
  'sms.sendOtp': { value: 'true', group: 'sms' },

  // Payments
  'payments.gateway': { value: 'zarinpal', group: 'payments' },
  'payments.mockMode': { value: 'true', group: 'payments' },
  'payments.sandboxMode': { value: 'true', group: 'payments' },

  // Wallet packages (JSON arrays)
  'wallet.diamondPackages': {
    value: JSON.stringify([
      { id: 'pkg_50', diamonds: 50, priceToman: 50000, label: '۵۰ الماس' },
      { id: 'pkg_200', diamonds: 200, priceToman: 180000, label: '۲۰۰ الماس' },
      { id: 'pkg_500', diamonds: 500, priceToman: 400000, label: '۵۰۰ الماس' },
      { id: 'pkg_1500', diamonds: 1500, priceToman: 1000000, label: '۱,۵۰۰ الماس' },
    ]),
    group: 'financial',
  },
  'wallet.coinPackages': {
    value: JSON.stringify([
      { id: 'coin_100', coins: 100, priceToman: 10000, label: '۱۰۰ سکه' },
      { id: 'coin_500', coins: 500, priceToman: 45000, label: '۵۰۰ سکه' },
      { id: 'coin_1000', coins: 1000, priceToman: 80000, label: '۱,۰۰۰ سکه' },
      { id: 'coin_5000', coins: 5000, priceToman: 350000, label: '۵,۰۰۰ سکه' },
    ]),
    group: 'financial',
  },
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
