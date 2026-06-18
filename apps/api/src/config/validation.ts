/**
 * Environment Variable Validation
 * ────────────────────────────────────────────────────────────────────────────
 * نسخهٔ سبک و بدون وابستگی خارجی (joi حذف شد تا نصب در سرور ساده‌تر باشد).
 * یک اعتبارسنج سادهٔ سازگار با امضای ConfigModule.validate ارائه می‌دهد که:
 *   - مقادیر پیش‌فرض را اعمال می‌کند
 *   - نوع‌ها را به number/boolean تبدیل می‌کند
 *   - در حالت production نبودِ DATABASE_URL را خطا می‌دهد
 */

type EnvRecord = Record<string, unknown>;

const toNumber = (v: unknown, def: number): number => {
  if (v === undefined || v === null || v === '') return def;
  const n = Number(v);
  return Number.isNaN(n) ? def : n;
};

const toBoolean = (v: unknown, def: boolean): boolean => {
  if (v === undefined || v === null || v === '') return def;
  if (typeof v === 'boolean') return v;
  return String(v).toLowerCase() === 'true' || String(v) === '1';
};

const toString = (v: unknown, def: string): string => {
  if (v === undefined || v === null || v === '') return def;
  return String(v);
};

/**
 * تابع اعتبارسنجی برای استفاده در `ConfigModule.forRoot({ validate })`.
 * یک نسخهٔ نرمال‌شده از config برمی‌گرداند.
 */
export function validate(config: EnvRecord): EnvRecord {
  const nodeEnv = toString(config.NODE_ENV, 'development');

  if (nodeEnv === 'production' && !config.DATABASE_URL) {
    throw new Error('DATABASE_URL در محیط production الزامی است');
  }

  return {
    ...config,
    NODE_ENV: nodeEnv,
    PORT: toNumber(config.PORT, 4000),
    APP_NAME: toString(config.APP_NAME, 'TIK TAK RUN'),
    TZ: toString(config.TZ, 'Asia/Tehran'),
    LOG_LEVEL: toString(config.LOG_LEVEL, 'info'),

    DATABASE_URL: toString(config.DATABASE_URL, ''),
    REDIS_URL: toString(config.REDIS_URL, 'redis://localhost:6379'),

    JWT_ACCESS_SECRET: toString(config.JWT_ACCESS_SECRET, 'changeme-access-secret-at-least-16-chars'),
    JWT_REFRESH_SECRET: toString(config.JWT_REFRESH_SECRET, 'changeme-refresh-secret-at-least-16-chars'),
    JWT_ACCESS_TTL: toNumber(config.JWT_ACCESS_TTL, 900),
    JWT_REFRESH_TTL: toNumber(config.JWT_REFRESH_TTL, 2592000),

    SMSIR_API_KEY: toString(config.SMSIR_API_KEY, ''),
    SMSIR_TEMPLATE_ID_OTP: toString(config.SMSIR_TEMPLATE_ID_OTP, ''),
    SMSIR_LINE_NUMBER: toString(config.SMSIR_LINE_NUMBER, ''),
    SMS_MOCK_MODE: toBoolean(config.SMS_MOCK_MODE, true),

    ZARINPAL_MERCHANT_ID: toString(config.ZARINPAL_MERCHANT_ID, ''),
    ZARINPAL_SANDBOX: toBoolean(config.ZARINPAL_SANDBOX, true),
    ZARINPAL_CALLBACK_URL: toString(config.ZARINPAL_CALLBACK_URL, ''),

    STORAGE_PATH: toString(config.STORAGE_PATH, '/storage/uploads'),
    STORAGE_PUBLIC_URL: toString(config.STORAGE_PUBLIC_URL, '/uploads'),

    RATE_LIMIT_MAX: toNumber(config.RATE_LIMIT_MAX, 100),
    RATE_LIMIT_WINDOW: toNumber(config.RATE_LIMIT_WINDOW, 60000),
  };
}

/**
 * سازگاری به‌عقب: برخی ماژول‌ها ممکن است `validationSchema` را import کنند.
 * یک شیٔ با متد `validate` ارائه می‌دهیم که امضای joi-like دارد.
 */
export const validationSchema = {
  validate: (config: EnvRecord) => {
    try {
      const value = validate(config);
      return { value, error: undefined };
    } catch (error) {
      return { value: config, error: error as Error };
    }
  },
};
