/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║              TIK TAK RUN — Unified Application Module                    ║
 * ║              Phase 10 Final Merge — All 31 modules                       ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * این فایل در فاز ۱۰ سنتز شد و همه ماژول‌های فازهای ۳ + ۴ + ۵ را register می‌کند.
 */

import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { MaintenanceGuard } from './common/guards/maintenance.guard';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { JwtModule } from '@nestjs/jwt';
import { CacheModule } from '@nestjs/cache-manager';
import { RedisModule } from '@nestjs-modules/ioredis';
import { RedisModule as LocalRedisModule } from './redis/redis.module';

// ─── Global Infrastructure ──────────────────────────────────────────────────
import { PrismaModule } from './prisma/prisma.module';

// ─── Common ─────────────────────────────────────────────────────────────────
// CommonModule از فاز 3 (اگر وجود داشته باشد)
// import { CommonModule } from './common/common.module';

// ─── Health Check (Phase 1) ─────────────────────────────────────────────────
import { HealthModule } from './health/health.module';

// ─── Phase 3 Modules (Core User/Auth) ───────────────────────────────────────
import { SmsModule } from './modules/sms/sms.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProfileModule } from './modules/profile/profile.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { InvitesModule } from './modules/invites/invites.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

// ─── Phase 4 Modules (Business) ─────────────────────────────────────────────
import { CitiesModule } from './modules/cities/cities.module';
import { BranchesModule } from './modules/branches/branches.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { GamesModule } from './modules/games/games.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { DiscountsModule } from './modules/discounts/discounts.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { TopModule } from './modules/top/top.module';
import { WeeklyModule } from './modules/weekly/weekly.module';

// ─── Phase 5 Modules (Gamification + Chat + CRM + Settings) ─────────────────
import { GamificationModule } from './modules/gamification/gamification.module';
import { WheelModule } from './modules/wheel/wheel.module';
import { ChatModule } from './modules/chat/chat.module';
import { TeamsModule } from './modules/teams/teams.module';
// TeamsModule از داخل chat.module یا standalone exposed
import { TicketsModule } from './modules/tickets/tickets.module';
import { CustomersModule } from './modules/customers/customers.module';
import { SegmentsModule } from './modules/segments/segments.module';
import { PipelineModule } from './modules/pipeline/pipeline.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { SettingsModule } from './modules/settings/settings.module';
import { RolesModule } from './modules/roles/roles.module';
import { MonthlyModule } from './modules/monthly/monthly.module';
import { AuditModule } from './modules/audit/audit.module';
import { BackupModule } from './modules/backup/backup.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { PublicModule } from './modules/public/public.module';

@Module({
  imports: [
    // ─── Config (Global) ────────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // ─── Event Emitter (for Socket.io / inter-module events) ────────────────
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      maxListeners: 30,
      verboseMemoryLeak: false,
    }),

    // ─── Cron jobs ──────────────────────────────────────────────────────────
    ScheduleModule.forRoot(),

    // ─── Rate limiting (Throttler) ──────────────────────────────────────────
    ThrottlerModule.forRoot([
      { ttl: 60_000, limit: 100 }, // 100 req / minute (default)
    ]),

    // ─── In-memory cache (used by Top module) ───────────────────────────────
    CacheModule.register({
      isGlobal: true,
      ttl: 300, // 5 minutes
      max: 500,
    }),

    // ─── JWT (Global — used by ChatGateway + AuthModule) ────────────────────
    JwtModule.registerAsync({
      global: true,
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'change-this-secret-in-production'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '7d') },
      }),
      inject: [ConfigService],
    }),

    // ─── Redis (Global) ─────────────────────────────────────────────────────
    RedisModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        type: 'single',
        url: config.get<string>('REDIS_URL', 'redis://localhost:6379'),
      }),
      inject: [ConfigService],
    }),

    // ─── Local Redis Service (Global, exports RedisService for DI) ──────────
    // [QA Fix 2026-05-25] بدون این، ماژول‌های Profile/Auth/Otp که از
    // src/redis/redis.service.ts استفاده می‌کنند، در DI fail می‌شدند.
    LocalRedisModule,

    // ─── Database (Global) ──────────────────────────────────────────────────
    PrismaModule,

    // ─── Health ─────────────────────────────────────────────────────────────
    HealthModule,

    // ─── Phase 3 ────────────────────────────────────────────────────────────
    SmsModule,            // @Global
    NotificationsModule,  // @Global
    AuthModule,
    UsersModule,
    ProfileModule,
    WalletModule,
    InvitesModule,

    // ─── Phase 4 ────────────────────────────────────────────────────────────
    CitiesModule,
    BranchesModule,
    CategoriesModule,
    GamesModule,
    BookingsModule,
    ReviewsModule,
    DiscountsModule,
    PaymentsModule,
    TopModule,
    WeeklyModule,

    // ─── Phase 5 ────────────────────────────────────────────────────────────
    SettingsModule,    // @Global
    AuditModule,       // @Global
    RolesModule,       // @Global
    GamificationModule,
    WheelModule,
    ChatModule,
    TeamsModule,
    TicketsModule,
    CustomersModule,
    SegmentsModule,
    PipelineModule,
    CampaignsModule,
    MonthlyModule,
    BackupModule,
    AnalyticsModule,
    PublicModule,
  ],
  providers: [
    // ─── Global JwtAuthGuard ────────────────────────────────────────────────
    // [QA Fix 2026-05-25] قبلاً endpoint‌های protected بدون توکن 500 می‌دادند
    // چون JwtAuthGuard اعمال نشده بود. الان global اعمال می‌شه و @Public()
    // برای endpoint‌های عمومی respect می‌شه.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: MaintenanceGuard },
  ],
})
export class AppModule {}
