/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║              TIK TAK RUN — Production Bootstrap                          ║
 * ║              Phase 10 Final — همه middleware ها + serialization          ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

// ─── CRITICAL: BigInt JSON serialization (must be before any import) ────────
// Without this, Prisma BigInt fields (money) will crash JSON.stringify
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

// ─── Set Tehran timezone for cron jobs and Date arithmetic ──────────────────
process.env.TZ = process.env.TZ || 'Asia/Tehran';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { NestExpressApplication } from '@nestjs/platform-express';
import { RedisIoAdapter } from './common/adapters/redis-io.adapter';
import helmet from 'helmet';
// [QA Fix 2026-05-25] استفاده از require برای CommonJS modules تا با swc transform
// (که `import *` را به ‏`{ default: ... }` تبدیل می‌کند) سازگار باشد.
const compression = require('compression');
const cookieParser = require('cookie-parser');
import { AppModule } from './app.module';
import { getStorageReadRoots } from './common/utils/storage-path';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger:
      process.env.NODE_ENV === 'production'
        ? ['log', 'warn', 'error']
        : ['log', 'debug', 'warn', 'error', 'verbose'],
    bufferLogs: true,
  });
  const logger = new Logger('Bootstrap');

  // ─── Trust proxy (Nginx reverse proxy) ────────────────────────────────────
  app.set('trust proxy', 1);

  // ─── Security middleware ──────────────────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: false, // disabled — Swagger UI conflicts
      crossOriginEmbedderPolicy: false,
      // Admin and web apps load uploaded media from the API origin/port.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(compression());
  app.use(cookieParser(process.env.COOKIE_SECRET || 'tiktakrun-cookie-secret'));

  // ─── CORS ─────────────────────────────────────────────────────────────────
  const envOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const allowedOrigins = [
    process.env.WEB_URL || 'http://localhost:3000',
    process.env.ADMIN_URL || 'http://localhost:3001',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3010',
    'http://localhost:3011',
    ...envOrigins,
  ];

  if (process.env.NODE_ENV === 'production' && process.env.PROD_DOMAIN) {
    allowedOrigins.push(
      `https://${process.env.PROD_DOMAIN}`,
      `https://admin.${process.env.PROD_DOMAIN}`,
      `https://www.${process.env.PROD_DOMAIN}`,
    );
  }

  // In non-production: allow any origin (reflective) to ease QA/staging from any IP/host.
  const corsOrigin: any =
    process.env.NODE_ENV === 'production'
      ? allowedOrigins
      : (origin: string, cb: (err: Error | null, allow?: boolean) => void) => cb(null, true);

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // ─── API Versioning + Prefix ──────────────────────────────────────────────
  app.setGlobalPrefix('api', { exclude: ['health', '/'] });
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // ─── Global Pipes ─────────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
      transformOptions: { enableImplicitConversion: true },
      validationError: { target: false, value: false },
    }),
  );

  // ─── Global Filters & Interceptors ────────────────────────────────────────
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor(), new LoggingInterceptor());

  // ─── Static files (uploads) ───────────────────────────────────────────────
  // Keep the public uploads mount aligned with where services write files.
  // Docker: STORAGE_PATH=/storage/uploads (bind-mounted).
  // Local: root storage/uploads, with legacy API-local uploads served as a fallback.
  for (const uploadsRoot of getStorageReadRoots()) {
    app.useStaticAssets(uploadsRoot, {
      prefix: '/uploads/',
      maxAge: '30d',
    });
  }

  // ─── Socket.io Adapter ────────────────────────────────────────────────────
  const redisAdapter = new RedisIoAdapter(app);
  await redisAdapter.connectToRedis();
  app.useWebSocketAdapter(
    process.env.REDIS_URL ? redisAdapter : new IoAdapter(app),
  );

  // ─── Swagger Documentation ────────────────────────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle('TIK TAK RUN API')
    .setDescription(
      'بک‌اند کامل پلتفرم رزرو سرگرمی TIK TAK RUN — شامل احراز هویت OTP، کیف پول، رزرو، گیمیفیکیشن، چت زنده، CRM، گزارش‌گیری',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      'JWT-auth',
    )
    .addServer('http://localhost:4000', 'Development')
    .addServer('https://api.tiktakrun.ir', 'Production')
    .addTag('Auth', 'احراز هویت با OTP')
    .addTag('Users', 'مدیریت کاربران')
    .addTag('Profile', 'پروفایل کاربر')
    .addTag('Wallet', 'کیف پول (تومان + سکه + الماس)')
    .addTag('Invites', 'سیستم دعوت')
    .addTag('Cities', 'شهرها')
    .addTag('Branches', 'شعبه‌ها')
    .addTag('Categories', 'دسته‌بندی‌ها')
    .addTag('Games', 'بازی‌ها')
    .addTag('Bookings', 'رزروها')
    .addTag('Reviews', 'نظرات')
    .addTag('Discounts', 'کدهای تخفیف')
    .addTag('Payments', 'پرداخت (ZarinPal)')
    .addTag('Top', 'برترین‌ها')
    .addTag('Weekly', 'هفتگی')
    .addTag('Gamification', 'سطوح و بج‌ها')
    .addTag('Wheel', 'گردونه شانس')
    .addTag('Chat', 'چت زنده')
    .addTag('Tickets', 'پشتیبانی')
    .addTag('Notifications', 'اعلان‌ها')
    .addTag('Admin', 'پنل ادمین')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/v1/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
      tagsSorter: 'alpha',
    },
    customSiteTitle: 'TIK TAK RUN API Docs',
  });

  // ─── Graceful Shutdown ────────────────────────────────────────────────────
  app.enableShutdownHooks();

  // ─── Start Server ─────────────────────────────────────────────────────────
  const port = parseInt(process.env.PORT || '4000', 10);
  await app.listen(port, '0.0.0.0');

  logger.log('╔══════════════════════════════════════════════════════╗');
  logger.log('║  🎮  TIK TAK RUN API — Production Ready             ║');
  logger.log('╠══════════════════════════════════════════════════════╣');
  logger.log(`║  🚀  HTTP:      http://localhost:${port}/api/v1`);
  logger.log(`║  📚  Swagger:   http://localhost:${port}/api/v1/docs`);
  logger.log(`║  🔌  Socket.io: ws://localhost:${port}`);
  logger.log(`║  ❤️   Health:    http://localhost:${port}/health`);
  logger.log(`║  🌍  Timezone:  ${process.env.TZ}`);
  logger.log(`║  📡  Env:       ${process.env.NODE_ENV || 'development'}`);
  logger.log('╚══════════════════════════════════════════════════════╝');
}

bootstrap().catch((err) => {
  console.error('❌ Fatal bootstrap error:', err);
  process.exit(1);
});
