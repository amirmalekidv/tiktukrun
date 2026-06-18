import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { patchBigIntSerialization } from '../common/utils/bigint';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { level: 'warn', emit: 'stdout' },
        { level: 'error', emit: 'stdout' },
      ],
    });

    // Patch BigInt serialization globally
    patchBigIntSerialization();
  }

  /**
   * Stub سازگاری برای کوئری‌های خام SQL (PostgreSQL) که در MongoDB پشتیبانی نمی‌شوند.
   * این متدها در تحلیل‌ها استفاده می‌شدند و اکنون آرایهٔ خالی برمی‌گردانند تا
   * منطق fallback (`.catch(() => [])`) فعال شود. در آینده باید با aggregation
   * pipeline یا groupBy جایگزین شوند.
   */
  async $queryRaw<T = unknown>(..._args: any[]): Promise<T> {
    this.logger.warn('$queryRaw فراخوانی شد ولی در MongoDB پشتیبانی نمی‌شود — [] بازگشت داده شد');
    return [] as unknown as T;
  }

  async $queryRawUnsafe<T = unknown>(..._args: any[]): Promise<T> {
    this.logger.warn('$queryRawUnsafe فراخوانی شد ولی در MongoDB پشتیبانی نمی‌شود — [] بازگشت داده شد');
    return [] as unknown as T;
  }

  async $executeRaw(..._args: any[]): Promise<number> {
    this.logger.warn('$executeRaw فراخوانی شد ولی در MongoDB پشتیبانی نمی‌شود — 0 بازگشت داده شد');
    return 0;
  }

  async $executeRawUnsafe(..._args: any[]): Promise<number> {
    this.logger.warn('$executeRawUnsafe فراخوانی شد ولی در MongoDB پشتیبانی نمی‌شود — 0 بازگشت داده شد');
    return 0;
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('✅ Prisma connected to database');
    } catch (error) {
      this.logger.error('❌ Prisma connection failed', error);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Prisma disconnected from database');
  }

  /**
   * Clean database for testing purposes (MongoDB)
   * در MongoDB با حذف اسناد همه‌ی کالکشن‌های اصلی پاک‌سازی انجام می‌شود.
   */
  async cleanDatabase(): Promise<void> {
    if (process.env.APP_ENV !== 'test' && process.env.NODE_ENV !== 'test') return;

    // ترتیب حذف اهمیتی در MongoDB ندارد (FK نداریم)
    const modelNames = Object.keys(this)
      .filter((k) => !k.startsWith('_') && !k.startsWith('$'))
      .filter((k) => {
        const v: any = (this as any)[k];
        return v && typeof v === 'object' && typeof v.deleteMany === 'function';
      });

    for (const name of modelNames) {
      try {
        await (this as any)[name].deleteMany({});
      } catch (error) {
        this.logger.error(`Error cleaning collection ${name}`, error as any);
      }
    }
  }
}
