/**
 * TIK TAK RUN — Seed Data (MongoDB)
 * ----------------------------------
 * اسکریپت seed سازگار با MongoDB (idempotent — قابل اجرای مجدد).
 * شامل: لول‌ها، بج‌ها، شهرها، شعبه‌ها، دسته‌ها (سینما ترس/بردگیم/مافیا/لیزرتگ)،
 * بازی‌ها با سطح‌بندی (tier) مختلف، کاربر ادمین، و جوایز گردونه.
 *
 * اجرا:
 *   npx ts-node prisma/seed.mongo.ts
 * یا (تنظیم‌شده در package.json):
 *   pnpm --filter @tiktakrun/api db:seed
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient({ log: ['warn', 'error'] });

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ─── Levels ──────────────────────────────────────────────────────────────────
async function seedLevels() {
  const levels = [
    { id: 1,  name: 'تازه‌کار',     tier: 'BRONZE', requiredXp: 0,     perks: { coinsBonus: 0,   discountPercent: 0  } },
    { id: 2,  name: 'کنجکاو',       tier: 'BRONZE', requiredXp: 100,   perks: { coinsBonus: 5,   discountPercent: 0  } },
    { id: 3,  name: 'کاشف',         tier: 'BRONZE', requiredXp: 250,   perks: { coinsBonus: 10,  discountPercent: 0  } },
    { id: 4,  name: 'ماجراجو',      tier: 'BRONZE', requiredXp: 450,   perks: { coinsBonus: 15,  discountPercent: 0  } },
    { id: 5,  name: 'دلاور',        tier: 'BRONZE', requiredXp: 700,   perks: { coinsBonus: 20,  discountPercent: 2  } },
    { id: 6,  name: 'شجاع',         tier: 'SILVER', requiredXp: 1000,  perks: { coinsBonus: 25,  discountPercent: 3  } },
    { id: 7,  name: 'قهرمان',       tier: 'SILVER', requiredXp: 1400,  perks: { coinsBonus: 30,  discountPercent: 4  } },
    { id: 8,  name: 'اسطوره',       tier: 'SILVER', requiredXp: 1900,  perks: { coinsBonus: 35,  discountPercent: 5  } },
    { id: 9,  name: 'ارباب تاریکی', tier: 'SILVER', requiredXp: 2500,  perks: { coinsBonus: 40,  discountPercent: 5  } },
    { id: 10, name: 'فرزانه',       tier: 'SILVER', requiredXp: 3200,  perks: { coinsBonus: 50,  discountPercent: 6  } },
    { id: 11, name: 'استاد',        tier: 'GOLD',   requiredXp: 4000,  perks: { coinsBonus: 60,  discountPercent: 7  } },
    { id: 12, name: 'نخبه',         tier: 'GOLD',   requiredXp: 5000,  perks: { coinsBonus: 70,  discountPercent: 8  } },
    { id: 13, name: 'سرمبارز',      tier: 'GOLD',   requiredXp: 6200,  perks: { coinsBonus: 80,  discountPercent: 9  } },
    { id: 14, name: 'شاهزاده سایه', tier: 'GOLD',   requiredXp: 7600,  perks: { coinsBonus: 90,  discountPercent: 10 } },
    { id: 15, name: 'حاکم سیاه',    tier: 'GOLD',   requiredXp: 9200,  perks: { coinsBonus: 100, discountPercent: 10 } },
    { id: 16, name: 'ابرقهرمان',    tier: 'LEGEND', requiredXp: 11000, perks: { coinsBonus: 120, discountPercent: 12 } },
    { id: 17, name: 'نیمه‌خدا',     tier: 'LEGEND', requiredXp: 13000, perks: { coinsBonus: 140, discountPercent: 14 } },
    { id: 18, name: 'خدای تاریکی',  tier: 'LEGEND', requiredXp: 15500, perks: { coinsBonus: 160, discountPercent: 16 } },
    { id: 19, name: 'امپراتور',     tier: 'LEGEND', requiredXp: 18000, perks: { coinsBonus: 180, discountPercent: 18 } },
    { id: 20, name: 'Shadow Lord',  tier: 'LEGEND', requiredXp: 21000, perks: { coinsBonus: 200, discountPercent: 20, badge: 'shadow_lord' } },
  ];

  for (const lvl of levels) {
    await prisma.level.upsert({
      where: { id: lvl.id },
      update: { name: lvl.name, tier: lvl.tier as any, requiredXp: lvl.requiredXp, perks: lvl.perks },
      create: lvl as any,
    });
  }
  console.log(`  ✅ ${levels.length} لول`);
}

// ─── Badges ──────────────────────────────────────────────────────────────────
async function seedBadges() {
  const badges = [
    { code: 'first_booking', name: 'اولین رزرو',  description: 'اولین رزرو خود را ثبت کردی', icon: '🎟️', color: '#4CAF50', criteria: { type: 'bookings', value: 1, operator: '>=' } },
    { code: 'explorer',      name: 'کاشف',         description: '۵ بازی مختلف تجربه کردی',     icon: '🧭', color: '#2196F3', criteria: { type: 'bookings', value: 5, operator: '>=' } },
    { code: 'mind_reader',   name: 'ذهن‌خوان',     description: 'به لول ۱۰ رسیدی',             icon: '🧠', color: '#3F51B5', criteria: { type: 'level', value: 10, operator: '>=' } },
    { code: 'vip_member',    name: 'عضو VIP',      description: 'بیش از ۵ میلیون تومان خرج کردی', icon: '💎', color: '#9C27B0', criteria: { type: 'spent', value: 5000000, operator: '>=' } },
    { code: 'inviter',       name: 'دعوت‌کننده',   description: '۳ دوست دعوت کردی',            icon: '🤝', color: '#FF9800', criteria: { type: 'invites', value: 3, operator: '>=' } },
    { code: 'legend',        name: 'افسانه',       description: 'به لول ۲۰ رسیدی',             icon: '👑', color: '#FFD700', criteria: { type: 'level', value: 20, operator: '>=' } },
    { code: 'shadow_lord',   name: 'ارباب سایه',   description: 'بالاترین لول - Shadow Lord!',  icon: '🌑', color: '#B71C1C', criteria: { type: 'level', value: 20, operator: '>=' } },
  ];

  for (const b of badges) {
    await prisma.badge.upsert({
      where: { code: b.code },
      update: { name: b.name, description: b.description, icon: b.icon, color: b.color, criteria: b.criteria },
      create: b as any,
    });
  }
  console.log(`  ✅ ${badges.length} بج`);
}

// ─── Cities ──────────────────────────────────────────────────────────────────
async function seedCities() {
  const cities = [
    { name: 'تهران', slug: 'tehran', displayOrder: 1 },
    { name: 'کرج',   slug: 'karaj',  displayOrder: 2 },
  ];
  const map: Record<string, string> = {};
  for (const city of cities) {
    const c = await prisma.city.upsert({
      where: { slug: city.slug },
      update: { name: city.name, displayOrder: city.displayOrder },
      create: city,
    });
    map[city.slug] = c.id;
  }
  console.log(`  ✅ ${cities.length} شهر`);
  return map;
}

// ─── Branches ────────────────────────────────────────────────────────────────
async function seedBranches(cityMap: Record<string, string>) {
  const branches = [
    { name: 'شعبه مرکزی تهران', citySlug: 'tehran', address: 'تهران، خیابان ولیعصر، پلاک ۱۰۰', phone: '02112345678' },
    { name: 'شعبه سعادت‌آباد',   citySlug: 'tehran', address: 'تهران، سعادت‌آباد، میدان کاج', phone: '02187654321' },
    { name: 'شعبه کرج',          citySlug: 'karaj',  address: 'کرج، عظیمیه، بلوار اصلی',        phone: '02633334444' },
  ];
  const ids: string[] = [];
  for (const br of branches) {
    // برای idempotency بر اساس نام جستجو می‌کنیم
    const existing = await prisma.branch.findFirst({ where: { name: br.name } });
    const data = {
      name: br.name,
      cityId: cityMap[br.citySlug],
      address: br.address,
      phone: br.phone,
    };
    const b = existing
      ? await prisma.branch.update({ where: { id: existing.id }, data })
      : await prisma.branch.create({ data });
    ids.push(b.id);
  }
  console.log(`  ✅ ${branches.length} شعبه`);
  return ids;
}

// ─── Categories (شامل مافیا و لیزرتگ جدید) ─────────────────────────────────────
async function seedCategories() {
  const cats = [
    { name: 'سینما ترس', slug: 'cinema-horror', icon: '🎬', color: '#880E4F', displayOrder: 1 },
    { name: 'بردگیم',    slug: 'board-games',   icon: '♟️', color: '#E65100', displayOrder: 2 },
    { name: 'مافیا',      slug: 'mafia',         icon: '🕵️', color: '#1A237E', displayOrder: 3 },
    { name: 'لیزرتگ',     slug: 'lasertag',      icon: '🔫', color: '#00695C', displayOrder: 4 },
  ];
  const map: Record<string, string> = {};
  for (const cat of cats) {
    const c = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, icon: cat.icon, color: cat.color, displayOrder: cat.displayOrder },
      create: cat,
    });
    map[cat.slug] = c.id;
  }
  console.log(`  ✅ ${cats.length} دسته (سینما ترس، بردگیم، مافیا، لیزرتگ)`);
  return map;
}

// ─── Games (با tier مختلف) ─────────────────────────────────────────────────────
async function seedGames(catMap: Record<string, string>, branchIds: string[]) {
  const TIERS = ['STANDARD', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'];
  const games = [
    // سینما ترس
    { title: 'خانه ارواح',        slug: 'haunted-house',    category: 'cinema-horror', tier: 'DIAMOND',  difficulty: 'VERY_HARD', fearLevel: 5, price: 350000, tags: ['ترسناک', 'سینمایی'], desc: 'تجربه‌ای ترسناک در خانه‌ای متروکه پر از راز و معما.' },
    { title: 'جیغ در تاریکی',     slug: 'scream-dark',      category: 'cinema-horror', tier: 'GOLD',     difficulty: 'HARD',      fearLevel: 4, price: 280000, tags: ['ترسناک'],            desc: 'در تاریکی مطلق باید راه خروج را پیدا کنید.' },
    { title: 'آسایشگاه',          slug: 'asylum',           category: 'cinema-horror', tier: 'PLATINUM', difficulty: 'VERY_HARD', fearLevel: 5, price: 320000, tags: ['ترسناک', 'روانی'],  desc: 'آسایشگاه روانی متروکه با داستانی هولناک.' },
    // بردگیم
    { title: 'شب مافیای کلاسیک',  slug: 'classic-board',    category: 'board-games',   tier: 'STANDARD', difficulty: 'EASY',      fearLevel: 0, price: 120000, tags: ['دسته‌جمعی'],         desc: 'مجموعه‌ای از بردگیم‌های محبوب برای دورهمی.' },
    { title: 'اتاق استراتژی',     slug: 'strategy-room',    category: 'board-games',   tier: 'SILVER',   difficulty: 'MEDIUM',    fearLevel: 0, price: 150000, tags: ['فکری'],              desc: 'بازی‌های استراتژیک و فکری برای گروه‌ها.' },
    // مافیا
    { title: 'مافیای حرفه‌ای',    slug: 'mafia-pro',        category: 'mafia',         tier: 'GOLD',     difficulty: 'MEDIUM',    fearLevel: 1, price: 180000, tags: ['مافیا', 'نقش‌آفرینی'], desc: 'بازی مافیا با گردانندهٔ حرفه‌ای و سناریوهای متنوع.' },
    { title: 'مافیا شهر خاموش',   slug: 'mafia-silent',     category: 'mafia',         tier: 'PLATINUM', difficulty: 'HARD',      fearLevel: 2, price: 220000, tags: ['مافیا', 'معمایی'],   desc: 'سناریوی پیشرفته مافیا با نقش‌های ویژه و فضای معمایی.' },
    { title: 'مافیا مبتدی',       slug: 'mafia-starter',    category: 'mafia',         tier: 'STANDARD', difficulty: 'EASY',      fearLevel: 0, price: 120000, tags: ['مافیا'],             desc: 'مناسب تازه‌واردان به دنیای مافیا.' },
    // لیزرتگ
    { title: 'لیزرتگ نبرد کهکشانی', slug: 'lasertag-galaxy', category: 'lasertag',     tier: 'GOLD',     difficulty: 'MEDIUM',    fearLevel: 0, price: 200000, tags: ['لیزرتگ', 'تیمی'],     desc: 'نبرد لیزری گروهی در میدانی با تم فضایی.' },
    { title: 'لیزرتگ منطقه جنگی',  slug: 'lasertag-warzone', category: 'lasertag',     tier: 'DIAMOND',  difficulty: 'HARD',      fearLevel: 1, price: 260000, tags: ['لیزرتگ', 'رقابتی'],   desc: 'میدان جنگ لیزری حرفه‌ای با موانع و سنگرها.' },
    { title: 'لیزرتگ خانوادگی',    slug: 'lasertag-family',  category: 'lasertag',     tier: 'STANDARD', difficulty: 'EASY',      fearLevel: 0, price: 150000, tags: ['لیزرتگ', 'خانوادگی'], desc: 'بازی لیزرتگ سرگرم‌کننده برای همه سنین.' },
  ];

  let count = 0;
  for (const g of games) {
    const branchId = branchIds[count % branchIds.length];
    const data = {
      title: g.title,
      slug: g.slug,
      categoryId: catMap[g.category],
      branchId,
      description: g.desc,
      scenario: g.desc,
      fearLevel: g.fearLevel,
      difficulty: g.difficulty as any,
      tier: g.tier as any,
      minPlayers: 2,
      maxPlayers: g.category === 'lasertag' ? 12 : 8,
      durationMinutes: 60,
      pricePerPerson: g.price,
      siteRank: Number((3.8 + Math.random() * 1.2).toFixed(1)),
      tags: g.tags,
      isFeatured: count % 3 === 0,
      isActive: true,
      weeklyDiscountPercent: count % 4 === 0 ? rand(5, 20) : 0,
    };
    await prisma.game.upsert({
      where: { slug: g.slug },
      update: data,
      create: data,
    });
    count++;
  }
  console.log(`  ✅ ${games.length} بازی با سطح‌بندی (tier): ${TIERS.join('، ')}`);
}

// ─── Admin user ────────────────────────────────────────────────────────────────
async function seedAdmin() {
  const mobile = '09120000000';
  const passwordHash = await bcrypt.hash('Admin@12345', 10);

  const admin = await prisma.user.upsert({
    where: { mobile },
    update: { fullName: 'مدیر سیستم', passwordHash },
    create: {
      mobile,
      fullName: 'مدیر سیستم',
      inviteCode: 'ADMIN001',
      passwordHash,
      profile: { create: { levelId: 1 } },
      wallet: { create: { tomanBalance: 0, coinsBalance: 1000, diamondsBalance: 100 } },
    },
  });

  // نقش ADMIN
  const existingRole = await prisma.userRoleAssignment.findFirst({
    where: { userId: admin.id, role: 'ADMIN' as any },
  });
  if (!existingRole) {
    await prisma.userRoleAssignment.create({
      data: { userId: admin.id, role: 'ADMIN' as any },
    });
  }
  console.log('  ✅ کاربر ادمین (موبایل: 09120000000 / رمز: Admin@12345)');
}

// ─── Wheel prizes ────────────────────────────────────────────────────────────
async function seedWheelPrizes() {
  const prizes = [
    { name: '۵۰ سکه',      type: 'COINS',         value: 50,    probabilityWeight: 30, color: '#FFC107', icon: '🪙' },
    { name: '۱۰۰ سکه',     type: 'COINS',         value: 100,   probabilityWeight: 20, color: '#FF9800', icon: '🪙' },
    { name: '۵ الماس',     type: 'DIAMONDS',      value: 5,     probabilityWeight: 15, color: '#00BCD4', icon: '💎' },
    { name: '۱۰٪ تخفیف',   type: 'DISCOUNT_CODE', value: 10,    probabilityWeight: 15, color: '#8BC34A', icon: '🎫' },
    { name: 'بلیط رایگان', type: 'FREE_TICKET',   value: 1,     probabilityWeight: 5,  color: '#E91E63', icon: '🎟️' },
    { name: '۲۰۰ امتیاز',  type: 'XP',            value: 200,   probabilityWeight: 15, color: '#9C27B0', icon: '⭐' },
  ];
  const count = await prisma.wheelPrize.count();
  if (count === 0) {
    for (const p of prizes) {
      await prisma.wheelPrize.create({ data: p as any });
    }
    console.log(`  ✅ ${prizes.length} جایزه گردونه`);
  } else {
    console.log(`  ⏭️  جوایز گردونه از قبل موجود است (${count})`);
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🌱 شروع seed (MongoDB)...\n');
  await seedLevels();
  await seedBadges();
  const cityMap = await seedCities();
  const branchIds = await seedBranches(cityMap);
  const catMap = await seedCategories();
  await seedGames(catMap, branchIds);
  await seedAdmin();
  await seedWheelPrizes();
  console.log('\n✅ Seed با موفقیت کامل شد.');
}

main()
  .catch((e) => {
    console.error('❌ خطا در seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
