#!/usr/bin/env tsx
/**
 * TIK TAK RUN — Schema Validation Script
 * بررسی یکپارچگی schema.prisma با shared-types و seed data
 *
 * اجرا:
 *   cd apps/api
 *   npx tsx prisma/scripts/validate-schema.ts
 *
 * این اسکریپت بررسی می‌کند:
 *   1. اتصال دیتابیس
 *   2. وجود همه جداول اصلی
 *   3. یکپارچگی MonthlyWinner polymorphic
 *   4. یکپارچگی InviteCode/InviteUsage
 *   5. یکپارچگی PlayerRating
 *   6. FK orphans
 *   7. آمار seed data
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

// ─── Types ───────────────────────────────────────────────────────────────────

interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
  data?: unknown;
}

const results: CheckResult[] = [];
let hasError = false;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pass(name: string, message: string, data?: unknown): void {
  results.push({ name, passed: true, message, data });
  console.log(`  ✅ ${name}: ${message}`);
}

function fail(name: string, message: string, data?: unknown): void {
  results.push({ name, passed: false, message, data });
  console.error(`  ❌ ${name}: ${message}`);
  if (data) console.error('     data:', JSON.stringify(data, null, 2));
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

// ─── Checks ──────────────────────────────────────────────────────────────────

async function checkDatabaseConnection(): Promise<void> {
  section('۱. اتصال دیتابیس');
  try {
    await prisma.$queryRaw`SELECT 1 AS ping`;
    pass('connection', 'اتصال موفق به PostgreSQL');
  } catch (e) {
    fail('connection', `خطای اتصال: ${(e as Error).message}`);
    throw e; // ادامه ندهیم اگر اتصال نیست
  }
}

async function checkExtensions(): Promise<void> {
  section('۲. PostgreSQL Extensions');
  try {
    const exts = await prisma.$queryRaw<{ extname: string }[]>`
      SELECT extname FROM pg_extension WHERE extname IN ('pgcrypto', 'citext')
    `;
    const extNames = exts.map((e) => e.extname);

    if (extNames.includes('pgcrypto')) {
      pass('pgcrypto', 'extension نصب شده است');
    } else {
      fail('pgcrypto', 'extension نصب نشده — در init-scripts/postgres-init.sql باشد');
    }

    if (extNames.includes('citext')) {
      pass('citext', 'extension نصب شده است');
    } else {
      fail('citext', 'extension نصب نشده — در init-scripts/postgres-init.sql باشد');
    }
  } catch (e) {
    warn('extensions', `بررسی extension ممکن نشد: ${(e as Error).message}`);
  }
}

async function checkTableCounts(): Promise<void> {
  section('۳. آمار جداول اصلی');

  const tables = [
    { name: 'users',             label: 'کاربران' },
    { name: 'profiles',          label: 'پروفایل‌ها' },
    { name: 'levels',            label: 'لول‌ها' },
    { name: 'badges',            label: 'بج‌ها' },
    { name: 'games',             label: 'بازی‌ها' },
    { name: 'branches',          label: 'شعبه‌ها' },
    { name: 'bookings',          label: 'رزروها' },
    { name: 'payments',          label: 'پرداخت‌ها' },
    { name: 'wallets',           label: 'کیف‌پول‌ها' },
    { name: 'transactions',      label: 'تراکنش‌ها' },
    { name: 'invite_codes',      label: 'کدهای دعوت' },
    { name: 'invite_usages',     label: 'استفاده از دعوت' },
    { name: 'player_ratings',    label: 'امتیازات بازیکن' },
    { name: 'monthly_winners',   label: 'برندگان ماهانه' },
    { name: 'wheel_prizes',      label: 'جوایز گردونه' },
    { name: 'wheel_spins',       label: 'چرخش گردونه' },
  ] as const;

  for (const table of tables) {
    try {
      const result = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
        `SELECT COUNT(*) AS count FROM "${table.name}"`
      );
      const count = Number(result[0].count);

      if (count === 0) {
        warn(table.name, `${table.label}: ۰ رکورد — آیا seed اجرا شده؟`);
      } else {
        pass(table.name, `${table.label}: ${count} رکورد`);
      }
    } catch (e) {
      fail(table.name, `جدول "${table.name}" یافت نشد یا خطا: ${(e as Error).message}`);
    }
  }
}

async function checkMonthlyWinnerIntegrity(): Promise<void> {
  section('۴. یکپارچگی MonthlyWinner (Polymorphic)');

  // بررسی CHECK CONSTRAINT: هیچ رکوردی نباید نقض کند
  try {
    const violations = await prisma.$queryRaw<{ id: number; type: string }[]>`
      SELECT id, type, "winnerUserId", "winnerTeamId", "winnerGameId"
      FROM monthly_winners
      WHERE
        (type = 'TOP_PLAYER' AND "winnerUserId" IS NULL)
        OR (type = 'TOP_TEAM'   AND "winnerTeamId" IS NULL)
        OR (type = 'TOP_GAME'   AND "winnerGameId" IS NULL)
    `;

    if (violations.length === 0) {
      pass('monthly_winner_check', 'همه رکوردها یکپارچه هستند — CHECK CONSTRAINT رعایت شده');
    } else {
      fail('monthly_winner_check', `${violations.length} رکورد ناقص یافت شد`, violations);
    }
  } catch (e) {
    fail('monthly_winner_check', `خطا: ${(e as Error).message}`);
  }

  // بررسی توزیع types
  try {
    const typeDist = await prisma.$queryRaw<{ type: string; count: bigint }[]>`
      SELECT type, COUNT(*) AS count
      FROM monthly_winners
      GROUP BY type
    `;

    const dist = typeDist.map((r) => ({ type: r.type, count: Number(r.count) }));
    pass('monthly_winner_types', `توزیع types: ${JSON.stringify(dist)}`);
  } catch (e) {
    warn('monthly_winner_types', `بررسی توزیع ممکن نشد: ${(e as Error).message}`);
  }
}

async function checkInviteIntegrity(): Promise<void> {
  section('۵. یکپارچگی InviteCode/InviteUsage');

  // بررسی totalUses consistency
  try {
    const inconsistencies = await prisma.$queryRaw<{ code: string; stored: number; actual: bigint }[]>`
      SELECT ic.code, ic."totalUses" AS stored, COUNT(iu.id) AS actual
      FROM invite_codes ic
      LEFT JOIN invite_usages iu ON iu."codeId" = ic.id
      GROUP BY ic.id, ic.code, ic."totalUses"
      HAVING ic."totalUses" != COUNT(iu.id)
    `;

    if (inconsistencies.length === 0) {
      pass('invite_consistency', 'totalUses همه کدها با تعداد InviteUsage مطابقت دارد');
    } else {
      fail(
        'invite_consistency',
        `${inconsistencies.length} کد inconsistent یافت شد`,
        inconsistencies.map((r) => ({ code: r.code, stored: r.stored, actual: Number(r.actual) }))
      );
    }
  } catch (e) {
    fail('invite_consistency', `خطا: ${(e as Error).message}`);
  }

  // بررسی orphan InviteUsage
  try {
    const orphans = await prisma.$queryRaw<{ id: number }[]>`
      SELECT iu.id
      FROM invite_usages iu
      LEFT JOIN invite_codes ic ON ic.id = iu."codeId"
      WHERE ic.id IS NULL
    `;

    if (orphans.length === 0) {
      pass('invite_orphans', 'هیچ InviteUsage orphan وجود ندارد');
    } else {
      fail('invite_orphans', `${orphans.length} InviteUsage بدون InviteCode والد`, orphans);
    }
  } catch (e) {
    fail('invite_orphans', `خطا: ${(e as Error).message}`);
  }
}

async function checkPlayerRatingIntegrity(): Promise<void> {
  section('۶. یکپارچگی PlayerRating');

  // بررسی orphan ratings (fromUser وجود ندارد)
  try {
    const orphanFrom = await prisma.$queryRaw<{ id: number }[]>`
      SELECT pr.id
      FROM player_ratings pr
      LEFT JOIN users u ON u.id = pr."fromUserId"
      WHERE u.id IS NULL
    `;

    if (orphanFrom.length === 0) {
      pass('rating_from_user', 'همه fromUserId ها معتبر هستند');
    } else {
      fail('rating_from_user', `${orphanFrom.length} rating با fromUser ناموجود`, orphanFrom);
    }
  } catch (e) {
    fail('rating_from_user', `خطا: ${(e as Error).message}`);
  }

  // بررسی xpChange range
  try {
    const stats = await prisma.$queryRaw<{ min: number; max: number; avg: number }[]>`
      SELECT
        MIN("xpChange") AS min,
        MAX("xpChange") AS max,
        ROUND(AVG("xpChange")::numeric, 2) AS avg
      FROM player_ratings
    `;

    if (stats.length > 0 && stats[0].min !== null) {
      const { min, max, avg } = stats[0];
      pass('rating_xp_stats', `xpChange — min: ${min}, max: ${max}, avg: ${avg}`);
    } else {
      warn('rating_xp_stats', 'هیچ PlayerRating در دیتابیس نیست');
    }
  } catch (e) {
    warn('rating_xp_stats', `بررسی stats ممکن نشد: ${(e as Error).message}`);
  }
}

async function checkForeignKeyOrphans(): Promise<void> {
  section('۷. بررسی FK Orphans اصلی');

  const checks = [
    {
      label: 'Profile → User',
      query: `SELECT p.id FROM profiles p LEFT JOIN users u ON u.id = p."userId" WHERE u.id IS NULL`,
    },
    {
      label: 'Wallet → User',
      query: `SELECT w.id FROM wallets w LEFT JOIN users u ON u.id = w."userId" WHERE u.id IS NULL`,
    },
    {
      label: 'Booking → User',
      query: `SELECT b.id FROM bookings b LEFT JOIN users u ON u.id = b."userId" WHERE u.id IS NULL`,
    },
    {
      label: 'Booking → Game',
      query: `SELECT b.id FROM bookings b LEFT JOIN games g ON g.id = b."gameId" WHERE g.id IS NULL`,
    },
    {
      label: 'Transaction → Wallet',
      query: `SELECT t.id FROM transactions t LEFT JOIN wallets w ON w.id = t."walletId" WHERE w.id IS NULL`,
    },
    {
      label: 'UserBadge → Badge',
      query: `SELECT ub."userId", ub."badgeId" FROM user_badges ub LEFT JOIN badges b ON b.id = ub."badgeId" WHERE b.id IS NULL`,
    },
  ];

  for (const check of checks) {
    try {
      const orphans = await prisma.$queryRawUnsafe<{ id?: number }[]>(check.query);
      if (orphans.length === 0) {
        pass(check.label, 'هیچ orphan وجود ندارد');
      } else {
        fail(check.label, `${orphans.length} orphan یافت شد`, orphans.slice(0, 5));
      }
    } catch (e) {
      warn(check.label, `بررسی ممکن نشد: ${(e as Error).message}`);
    }
  }
}

// ─── Summary ─────────────────────────────────────────────────────────────────

function printSummary(): void {
  section('خلاصه نتایج');

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log(`\n  مجموع بررسی: ${results.length}`);
  console.log(`  موفق:         ${passed}`);
  console.log(`  ناموفق:       ${failed}`);

  if (!hasError) {
    console.log('\n  🎉 همه بررسی‌ها موفق! schema یکپارچه است.\n');
  } else {
    console.log('\n  ⚠️  برخی بررسی‌ها ناموفق بودند — موارد بالا را مرور کنید.\n');
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('');
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║     TIK TAK RUN — Schema Validation Script        ║');
  console.log('╚════════════════════════════════════════════════════╝');
  console.log(`  تاریخ: ${new Date().toLocaleString('fa-IR')}`);

  try {
    await checkDatabaseConnection();
    await checkExtensions();
    await checkTableCounts();
    await checkMonthlyWinnerIntegrity();
    await checkInviteIntegrity();
    await checkPlayerRatingIntegrity();
    await checkForeignKeyOrphans();
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'P1001') {
      console.error('\n❌ خطای اتصال: مطمئن شوید PostgreSQL در حال اجراست.');
      console.error('   docker-compose up -d postgres\n');
    }
  } finally {
    printSummary();
    await prisma.$disconnect();
    process.exit(hasError ? 1 : 0);
  }
}

main();
