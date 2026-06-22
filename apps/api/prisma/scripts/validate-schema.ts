#!/usr/bin/env tsx
/**
 * TIK TAK RUN — MongoDB schema validation
 *
 * Checks:
 *   1. MongoDB connectivity
 *   2. Replica set presence (`rs0`)
 *   3. Prisma transaction support
 *   4. Core collection counts after seed
 *   5. Monthly winner polymorphic integrity
 *   6. Invite usage counters consistency
 *   7. Player rating stats sanity
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
  data?: unknown;
}

const results: CheckResult[] = [];
let hasError = false;

function pass(name: string, message: string, data?: unknown): void {
  results.push({ name, passed: true, message, data });
  console.log(`  ✅ ${name}: ${message}`);
}

function fail(name: string, message: string, data?: unknown): void {
  results.push({ name, passed: false, message, data });
  console.error(`  ❌ ${name}: ${message}`);
  if (data) {
    console.error('     data:', JSON.stringify(data, null, 2));
  }
  hasError = true;
}

function warn(name: string, message: string, data?: unknown): void {
  results.push({ name, passed: true, message: `⚠️  ${message}`, data });
  console.warn(`  ⚠️  ${name}: ${message}`);
}

function section(title: string): void {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`■ ${title}`);
  console.log('─'.repeat(60));
}

async function checkMongoConnection(): Promise<void> {
  section('۱. اتصال MongoDB');
  try {
    await prisma.$runCommandRaw({ ping: 1 });
    pass('connection', 'اتصال موفق به MongoDB');
  } catch (error) {
    fail('connection', `خطای اتصال: ${(error as Error).message}`);
    throw error;
  }
}

async function checkReplicaSet(): Promise<void> {
  section('۲. وضعیت Replica Set');
  try {
    const hello = (await prisma.$runCommandRaw({ hello: 1 })) as {
      setName?: string;
      isWritablePrimary?: boolean;
    };

    if (hello.setName === 'rs0') {
      pass('replica_set', 'Replica set با نام rs0 فعال است');
    } else {
      fail('replica_set', `Replica set نامعتبر است: ${hello.setName ?? 'missing'}`);
    }

    if (hello.isWritablePrimary) {
      pass('primary', 'MongoDB PRIMARY آماده‌ی نوشتن است');
    } else {
      warn('primary', 'MongoDB PRIMARY هنوز writable نیست');
    }
  } catch (error) {
    fail('replica_set', `بررسی replica set ممکن نشد: ${(error as Error).message}`);
  }
}

async function checkTransactionSupport(): Promise<void> {
  section('۳. بررسی Prisma Transaction');
  const key = `system.validation.transaction.${Date.now()}`;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.setting.create({
        data: {
          key,
          value: { smoke: true, createdAt: new Date().toISOString() } as any,
          group: 'system',
        },
      });

      const created = await tx.setting.findUnique({ where: { key } });
      if (!created) {
        throw new Error('temporary setting was not created inside transaction');
      }

      await tx.setting.delete({ where: { key } });
    });

    const leftover = await prisma.setting.findUnique({ where: { key } });
    if (leftover) {
      fail('transaction_cleanup', 'رکورد موقت بعد از transaction باقی مانده است');
      await prisma.setting.delete({ where: { key } });
    } else {
      pass('transaction', 'Prisma transaction با موفقیت روی MongoDB اجرا شد');
    }
  } catch (error) {
    fail('transaction', `Prisma transaction شکست خورد: ${(error as Error).message}`);
  }
}

async function checkCoreCounts(): Promise<void> {
  section('۴. آمار مجموعه‌های اصلی');

  const counters = [
    ['levels', () => prisma.level.count()],
    ['cities', () => prisma.city.count()],
    ['branches', () => prisma.branch.count()],
    ['categories', () => prisma.category.count()],
    ['games', () => prisma.game.count()],
    ['users', () => prisma.user.count()],
    ['wallets', () => prisma.wallet.count()],
    ['bookings', () => prisma.booking.count()],
    ['payments', () => prisma.payment.count()],
    ['transactions', () => prisma.transaction.count()],
    ['notifications', () => prisma.notification.count()],
    ['teams', () => prisma.team.count()],
    ['tickets', () => prisma.ticket.count()],
    ['settings', () => prisma.setting.count()],
  ] as const;

  for (const [label, counter] of counters) {
    try {
      const count = await counter();
      if (count === 0) {
        warn(label, `${label}: ۰ رکورد — آیا seed اجرا شده؟`);
      } else {
        pass(label, `${label}: ${count} رکورد`);
      }
    } catch (error) {
      fail(label, `شمارش ناموفق بود: ${(error as Error).message}`);
    }
  }
}

async function checkMonthlyWinnerIntegrity(): Promise<void> {
  section('۵. یکپارچگی MonthlyWinner');

  try {
    const winners = await prisma.monthlyWinner.findMany({
      select: {
        id: true,
        type: true,
        winnerUserId: true,
        winnerTeamId: true,
        winnerGameId: true,
      },
    });

    const violations = winners.filter((winner) => {
      if (winner.type === 'TOP_PLAYER') return !winner.winnerUserId;
      if (winner.type === 'TOP_TEAM') return !winner.winnerTeamId;
      if (winner.type === 'TOP_GAME') return !winner.winnerGameId;
      return false;
    });

    if (violations.length === 0) {
      pass('monthly_winner_integrity', 'همه رکوردهای MonthlyWinner معتبر هستند');
    } else {
      fail('monthly_winner_integrity', `${violations.length} رکورد ناقص یافت شد`, violations);
    }
  } catch (error) {
    fail('monthly_winner_integrity', `خطا: ${(error as Error).message}`);
  }
}

async function checkInviteConsistency(): Promise<void> {
  section('۶. یکپارچگی InviteCode / InviteUsage');

  try {
    const codes = await prisma.inviteCode.findMany({
      select: {
        code: true,
        totalUses: true,
        usages: { select: { id: true } },
      },
    });

    const mismatches = codes
      .map((code) => ({
        code: code.code,
        stored: code.totalUses,
        actual: code.usages.length,
      }))
      .filter((item) => item.stored !== item.actual);

    if (mismatches.length === 0) {
      pass('invite_usage_counts', 'totalUses با تعداد InviteUsage ها هماهنگ است');
    } else {
      fail('invite_usage_counts', `${mismatches.length} کد ناسازگار یافت شد`, mismatches);
    }
  } catch (error) {
    fail('invite_usage_counts', `خطا: ${(error as Error).message}`);
  }
}

async function checkPlayerRatingStats(): Promise<void> {
  section('۷. سلامت PlayerRating');

  try {
    const ratingCount = await prisma.playerRating.count();
    if (ratingCount === 0) {
      warn('player_ratings', 'هیچ PlayerRating در دیتابیس وجود ندارد');
      return;
    }

    const stats = await prisma.playerRating.aggregate({
      _avg: { xpChange: true },
      _min: { xpChange: true },
      _max: { xpChange: true },
    });

    pass(
      'player_ratings',
      `count=${ratingCount}, min=${stats._min.xpChange}, max=${stats._max.xpChange}, avg=${stats._avg.xpChange ?? 0}`,
    );
  } catch (error) {
    fail('player_ratings', `خطا: ${(error as Error).message}`);
  }
}

function printSummary(): void {
  section('خلاصه نتایج');

  const passed = results.filter((result) => result.passed).length;
  const failed = results.filter((result) => !result.passed).length;

  console.log(`\n  مجموع بررسی: ${results.length}`);
  console.log(`  موفق:         ${passed}`);
  console.log(`  ناموفق:       ${failed}`);

  if (!hasError) {
    console.log('\n  🎉 همه بررسی‌های MongoDB با موفقیت انجام شد.\n');
  } else {
    console.log('\n  ⚠️  برخی بررسی‌ها ناموفق بودند — موارد بالا را مرور کنید.\n');
  }
}

async function main(): Promise<void> {
  console.log('');
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║   TIK TAK RUN — Mongo Schema Validation Script    ║');
  console.log('╚════════════════════════════════════════════════════╝');
  console.log(`  تاریخ: ${new Date().toLocaleString('fa-IR')}`);

  try {
    await checkMongoConnection();
    await checkReplicaSet();
    await checkTransactionSupport();
    await checkCoreCounts();
    await checkMonthlyWinnerIntegrity();
    await checkInviteConsistency();
    await checkPlayerRatingStats();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'P1001') {
      console.error('\n❌ خطای اتصال: مطمئن شوید MongoDB در حال اجراست.');
      console.error('   docker compose up -d mongo mongo-init\n');
    }
  } finally {
    printSummary();
    await prisma.$disconnect();
    process.exit(hasError ? 1 : 0);
  }
}

main();
