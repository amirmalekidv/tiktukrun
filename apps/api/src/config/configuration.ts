export default () => ({
  app: {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '4000', 10),
    name: process.env.APP_NAME || 'TIK TAK RUN',
    url: process.env.APP_URL || 'http://localhost:4000',
    webUrl: process.env.WEB_URL || 'http://localhost:3000',
    adminUrl: process.env.ADMIN_URL || 'http://localhost:3001',
    logLevel: process.env.LOG_LEVEL || 'info',
    tz: process.env.TZ || 'Asia/Tehran',
  },

  database: {
    url: process.env.DATABASE_URL || '',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'changeme-access',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'changeme-refresh',
    accessTtl: parseInt(process.env.JWT_ACCESS_TTL || '900', 10),
    refreshTtl: parseInt(process.env.JWT_REFRESH_TTL || '2592000', 10),
  },

  sms: {
    apiKey: process.env.SMSIR_API_KEY || '',
    templateIdOtp: process.env.SMSIR_TEMPLATE_ID_OTP || '',
    lineNumber: process.env.SMSIR_LINE_NUMBER || '',
    mockMode: process.env.SMS_MOCK_MODE === 'true',
  },

  zarinpal: {
    merchantId: process.env.ZARINPAL_MERCHANT_ID || '',
    sandbox: process.env.ZARINPAL_SANDBOX !== 'false',
    callbackUrl: process.env.ZARINPAL_CALLBACK_URL || 'http://localhost:4000/api/v1/payments/verify',
  },

  storage: {
    path: process.env.STORAGE_PATH || '/storage/uploads',
    publicUrl: process.env.STORAGE_PUBLIC_URL || '/uploads',
  },

  rateLimit: {
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    window: parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10),
  },
});
