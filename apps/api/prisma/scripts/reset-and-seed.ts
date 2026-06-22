/**
 * TIK TAK RUN — Reset & Re-seed Script
 * این اسکریپت دیتابیس را reset کرده و seed می‌کند
 *
 * استفاده:
 *   npx ts-node prisma/scripts/reset-and-seed.ts
 *   npx ts-node prisma/scripts/reset-and-seed.ts --skip-db-push
 *
 * ⚠️ هشدار: این اسکریپت همه داده‌ها را پاک می‌کند!
 */

import { execSync } from 'child_process';
import path from 'path';

const rootDir = path.resolve(__dirname, '../../');

function runCommand(cmd: string, label: string): void {
  console.log(`\n🔧 ${label}...`);
  try {
    execSync(cmd, { stdio: 'inherit', cwd: rootDir });
    console.log(`✅ ${label} — انجام شد`);
  } catch (error) {
    console.error(`❌ خطا در ${label}:`, error);
    process.exit(1);
  }
}

async function main() {
  const skipDbPush = process.argv.includes('--skip-db-push');

  console.log('════════════════════════════════════════');
  console.log('  TIK TAK RUN — Database Reset & Seed  ');
  console.log('════════════════════════════════════════');
  console.log('⚠️  این عملیات همه داده‌ها را پاک می‌کند!');

  if (!skipDbPush) {
    runCommand('npx prisma db push --force-reset', 'Reset دیتابیس با prisma db push');
  }

  // اجرای seed سازگار با MongoDB
  runCommand('npx ts-node prisma/seed.ts', 'اجرای Seed');

  console.log('\n🎉 Reset و Seed با موفقیت انجام شد!');
  console.log('   برای مشاهده دیتا: npx prisma studio');
}

main().catch((e) => {
  console.error('❌ خطا:', e);
  process.exit(1);
});
