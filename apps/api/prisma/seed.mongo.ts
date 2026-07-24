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
    { name: 'اتاق فرار', slug: 'escape-room', icon: '🚪', color: '#4A148C', displayOrder: 0, genre: 'HORROR' },
    { name: 'سینما ترس', slug: 'cinema-horror', icon: '🎬', color: '#880E4F', displayOrder: 1, genre: 'HORROR' },
    { name: 'بردگیم',    slug: 'board-games',   icon: '♟️', color: '#E65100', displayOrder: 2, genre: 'NON_HORROR' },
    { name: 'مافیا',      slug: 'mafia',         icon: '🕵️', color: '#1A237E', displayOrder: 3, genre: 'NON_HORROR' },
    { name: 'لیزرتگ',     slug: 'lasertag',      icon: '🔫', color: '#00695C', displayOrder: 4, genre: 'NON_HORROR' },
    { name: 'پینت‌بال',   slug: 'paintball',     icon: '🎯', color: '#BF360C', displayOrder: 5, genre: 'NON_HORROR' },
    { name: 'واقعیت مجازی', slug: 'vr',          icon: '🥽', color: '#1565C0', displayOrder: 6, genre: 'NON_HORROR' },
  ];
  const map: Record<string, string> = {};
  for (const cat of cats) {
    const c = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, icon: cat.icon, color: cat.color, displayOrder: cat.displayOrder, genre: cat.genre as any },
      create: { ...cat, genre: cat.genre as any },
    });
    map[cat.slug] = c.id;
  }
  console.log(`  ✅ ${cats.length} دسته`);
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
    { title: 'پینت‌بال جنگل',       slug: 'paintball-jungle', category: 'paintball',    tier: 'GOLD',     difficulty: 'MEDIUM',    fearLevel: 0, price: 190000, tags: ['پینت‌بال', 'تیمی'],     desc: 'میدان پینت‌بال با موانع جنگلی.' },
    // اتاق فرار — تهران
    { title: 'فرار از زندان',       slug: 'escape-prison',    category: 'escape-room',  tier: 'GOLD',     difficulty: 'HARD',      fearLevel: 4, price: 290000, tags: ['ترسناک', 'اتاق فرار'], branchIdx: 0, desc: 'فرار از زندان سیاه با معماهای پیچیده.' },
    { title: 'گنجینه گم‌شده',       slug: 'escape-treasure',  category: 'escape-room',  tier: 'SILVER',   difficulty: 'MEDIUM',    fearLevel: 2, price: 220000, tags: ['اتاق فرار'],           branchIdx: 1, desc: 'جستجوی گنج در معبد باستانی.' },
    { title: 'آزمایشگاه مخفی',      slug: 'escape-lab',       category: 'escape-room',  tier: 'PLATINUM', difficulty: 'VERY_HARD', fearLevel: 5, price: 340000, tags: ['ترسناک', 'اتاق فرار'], branchIdx: 0, desc: 'آزمایشگاه علمی با رازهای تاریک.' },
    // اتاق فرار — کرج
    { title: 'قصر وحشت',            slug: 'escape-castle',    category: 'escape-room',  tier: 'DIAMOND',  difficulty: 'VERY_HARD', fearLevel: 5, price: 310000, tags: ['ترسناک', 'اتاق فرار'], branchIdx: 2, desc: 'قصر متروکه با اتاق‌های مخفی.' },
    { title: 'موزه شب',             slug: 'escape-museum',    category: 'escape-room',  tier: 'GOLD',     difficulty: 'MEDIUM',    fearLevel: 1, price: 210000, tags: ['اتاق فرار'],           branchIdx: 2, desc: 'کشف راز موزه در تاریکی شب.' },
  ];

  let count = 0;
  for (const g of games) {
    const branchId = branchIds[(g as any).branchIdx ?? count % branchIds.length];
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

// ─── Landing page sections ─────────────────────────────────────────────────────
async function seedLandingSections() {
  const sections = [
    {
      key: 'weekly-discount',
      title: 'تخفیف ویژه یا هفتگی',
      description: 'بهترین تخفیف‌های این هفته',
      icon: 'fas fa-bolt',
      displayOrder: 1,
      filterType: 'WEEKLY_DISCOUNT' as const,
    },
    {
      key: 'our-picks',
      title: 'پیشنهاد ما به شما',
      description: 'انتخاب‌های ویژه تیم تیک‌تاک‌ران',
      icon: 'fas fa-heart',
      displayOrder: 2,
      filterType: 'FEATURED' as const,
    },
    {
      key: 'escape-room-tehran',
      title: 'اتاق فرار های تهران',
      description: 'بهترین اتاق فرارهای تهران',
      icon: 'fas fa-door-open',
      displayOrder: 3,
      filterType: 'CATEGORY_CITY' as const,
      categorySlug: 'escape-room',
      citySlug: 'tehran',
    },
    {
      key: 'escape-room-karaj',
      title: 'اتاق فرار های کرج',
      description: 'اتاق فرارهای کرج',
      icon: 'fas fa-door-open',
      displayOrder: 4,
      filterType: 'CATEGORY_CITY' as const,
      categorySlug: 'escape-room',
      citySlug: 'karaj',
    },
    {
      key: 'cinema-horror',
      title: 'سینما ترس',
      description: 'تجربه سینمایی ترسناک',
      icon: 'fas fa-film',
      displayOrder: 5,
      filterType: 'CATEGORY' as const,
      categorySlug: 'cinema-horror',
    },
    {
      key: 'escape-room-horror',
      title: 'اتاق فرار ترسناک',
      description: 'اتاق فرارهای پر از هیجان و ترس',
      icon: 'fas fa-ghost',
      displayOrder: 6,
      filterType: 'CATEGORY' as const,
      categorySlug: 'escape-room',
      tagFilter: 'horror',
    },
    {
      key: 'escape-room-non-horror',
      title: 'اتاق فرار غیرترسناک',
      description: 'اتاق فرارهای مناسب همه',
      icon: 'fas fa-puzzle-piece',
      displayOrder: 7,
      filterType: 'CATEGORY' as const,
      categorySlug: 'escape-room',
      tagFilter: 'non-horror',
    },
    {
      key: 'popular-this-week',
      title: 'پرفروش ترین',
      description: 'پرطرفدارترین بازی‌های این هفته',
      icon: 'fas fa-fire',
      displayOrder: 8,
      filterType: 'POPULAR_THIS_WEEK' as const,
    },
    {
      key: 'other-entertainments',
      title: 'سرگرمی های دیگر، مثل بردگیم، لیزرتگ، پینت بال، مافیا',
      description: 'بردگیم، لیزرتگ، پینت‌بال، مافیا و بیشتر',
      icon: 'fas fa-dice',
      displayOrder: 9,
      filterType: 'MULTI_CATEGORY' as const,
      categorySlugs: ['board-games', 'lasertag', 'paintball', 'mafia'],
    },
  ];

  for (const s of sections) {
    await prisma.landingSection.upsert({
      where: { key: s.key },
      update: {
        title: s.title,
        description: s.description,
        icon: s.icon,
        displayOrder: s.displayOrder,
        filterType: s.filterType,
        categorySlug: (s as any).categorySlug ?? null,
        categorySlugs: (s as any).categorySlugs ?? [],
        citySlug: (s as any).citySlug ?? null,
        tagFilter: (s as any).tagFilter ?? null,
        isActive: true,
      },
      create: {
        key: s.key,
        title: s.title,
        description: s.description,
        icon: s.icon,
        displayOrder: s.displayOrder,
        filterType: s.filterType,
        categorySlug: (s as any).categorySlug ?? null,
        categorySlugs: (s as any).categorySlugs ?? [],
        citySlug: (s as any).citySlug ?? null,
        tagFilter: (s as any).tagFilter ?? null,
        isActive: true,
      },
    });
  }
  console.log(`  ✅ ${sections.length} سکشن صفحهٔ اصلی`);
}

// ─── Admin user ────────────────────────────────────────────────────────────────
async function seedAdmin() {
  const mobile = process.env.SEED_SUPERADMIN_MOBILE || '09120000001';
  const password = process.env.SEED_SUPERADMIN_PASSWORD || 'Admin@123456';
  const email = process.env.SEED_SUPERADMIN_EMAIL || 'admin@tiktakrun.local';
  const nickname = process.env.SEED_SUPERADMIN_NICKNAME || 'superadmin';
  const passwordHash = await bcrypt.hash(password, 10);

  const existing = await prisma.user.findUnique({ where: { mobile } });
  const admin = existing
    ? await prisma.user.update({
        where: { mobile },
        data: { fullName: 'مدیر سیستم', passwordHash, email: existing.email ?? email, nickname: existing.nickname ?? nickname },
      })
    : await prisma.user.create({
        data: {
          mobile,
          email,
          nickname,
          fullName: 'مدیر سیستم',
          inviteCode: 'ADMIN001',
          passwordHash,
          profile: { create: { levelId: 1 } },
          wallet: { create: { tomanBalance: 0, coinsBalance: 1000, diamondsBalance: 100 } },
        },
      });

  const existingRole = await prisma.userRoleAssignment.findFirst({
    where: { userId: admin.id, role: 'SUPER_ADMIN' as any },
  });
  if (!existingRole) {
    await prisma.userRoleAssignment.create({
      data: { userId: admin.id, role: 'SUPER_ADMIN' as any },
    });
  }
  console.log(`  ✅ کاربر ادمین (موبایل: ${mobile} / رمز: ${password})`);
}

type CommunitySeedUser = {
  fullName: string;
  mobile: string;
  nickname: string;
  inviteCode: string;
  citySlug: 'tehran' | 'karaj';
};

const COMMUNITY_SEED_USERS: CommunitySeedUser[] = [
  { fullName: 'آرش محمدی', mobile: '09594683961', nickname: 'community-user-01', inviteCode: 'COMM001', citySlug: 'tehran' },
  { fullName: 'سارا احمدی', mobile: '09321837212', nickname: 'community-user-02', inviteCode: 'COMM002', citySlug: 'tehran' },
  { fullName: 'مهدی رضایی', mobile: '09203719068', nickname: 'community-user-03', inviteCode: 'COMM003', citySlug: 'tehran' },
  { fullName: 'نرگس کریمی', mobile: '09868756319', nickname: 'community-user-04', inviteCode: 'COMM004', citySlug: 'tehran' },
  { fullName: 'کیان حسینی', mobile: '09693869455', nickname: 'community-user-05', inviteCode: 'COMM005', citySlug: 'karaj' },
  { fullName: 'پریا نوری', mobile: '09874389015', nickname: 'community-user-06', inviteCode: 'COMM006', citySlug: 'karaj' },
  { fullName: 'امیر علوی', mobile: '09302035180', nickname: 'community-user-07', inviteCode: 'COMM007', citySlug: 'karaj' },
  { fullName: 'لیلا صادقی', mobile: '09820885148', nickname: 'community-user-08', inviteCode: 'COMM008', citySlug: 'karaj' },
  { fullName: 'رضا موسوی', mobile: '09195915230', nickname: 'community-user-09', inviteCode: 'COMM009', citySlug: 'tehran' },
  { fullName: 'فاطمه جعفری', mobile: '09382371837', nickname: 'community-user-10', inviteCode: 'COMM010', citySlug: 'tehran' },
  { fullName: 'حسین اکبری', mobile: '09594307623', nickname: 'community-user-11', inviteCode: 'COMM011', citySlug: 'tehran' },
  { fullName: 'مریم باقری', mobile: '09377704904', nickname: 'community-user-12', inviteCode: 'COMM012', citySlug: 'tehran' },
  { fullName: 'علی زارعی', mobile: '09715460542', nickname: 'community-user-13', inviteCode: 'COMM013', citySlug: 'karaj' },
  { fullName: 'زهرا طاهری', mobile: '09369413018', nickname: 'community-user-14', inviteCode: 'COMM014', citySlug: 'karaj' },
  { fullName: 'پویا شریفی', mobile: '09779021547', nickname: 'community-user-15', inviteCode: 'COMM015', citySlug: 'karaj' },
  { fullName: 'نازنین فرهادی', mobile: '09187775116', nickname: 'community-user-16', inviteCode: 'COMM016', citySlug: 'karaj' },
  { fullName: 'سینا مرادی', mobile: '09907968209', nickname: 'community-user-17', inviteCode: 'COMM017', citySlug: 'tehran' },
  { fullName: 'الهام قاسمی', mobile: '09248540679', nickname: 'community-user-18', inviteCode: 'COMM018', citySlug: 'tehran' },
  { fullName: 'بهرام یوسفی', mobile: '09841753339', nickname: 'community-user-19', inviteCode: 'COMM019', citySlug: 'tehran' },
  { fullName: 'شیدا رحیمی', mobile: '09718989686', nickname: 'community-user-20', inviteCode: 'COMM020', citySlug: 'tehran' },
];

const COMMUNITY_TEAM_NAME = 'تیم قوی ما ۱';
const COMMUNITY_TEAM_MEMBER_MOBILES = [
  '09594683961',
  '09321837212',
  '09203719068',
  '09868756319',
  '09693869455',
  '09874389015',
];

function communityAvatarUrl(fullName: string) {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}&backgroundColor=dc2626&textColor=ffffff`;
}

function communityEmail(nickname: string) {
  return `${nickname}@community.tiktakrun.local`;
}

async function ensureCustomerRole(userId: string) {
  const role = await prisma.userRoleAssignment.findFirst({
    where: { userId, role: 'CUSTOMER' as any },
  });
  if (!role) {
    await prisma.userRoleAssignment.create({
      data: { userId, role: 'CUSTOMER' as any },
    });
  }
}

async function seedCommunityUsers(cityMap: Record<string, string>) {
  const usersByMobile: Record<string, string> = {};

  for (const item of COMMUNITY_SEED_USERS) {
    const existing = await prisma.user.findUnique({
      where: { mobile: item.mobile },
      select: { id: true, email: true, nickname: true, inviteCode: true },
    });

    const user = existing
      ? await prisma.user.update({
          where: { mobile: item.mobile },
          data: {
            email: existing.email ?? communityEmail(item.nickname),
            fullName: item.fullName,
            avatarUrl: communityAvatarUrl(item.fullName),
            isActive: true,
            deletedAt: null,
            nickname: existing.nickname ?? item.nickname,
          },
          select: { id: true },
        })
      : await prisma.user.create({
        data: {
            mobile: item.mobile,
            email: communityEmail(item.nickname),
            fullName: item.fullName,
            nickname: item.nickname,
            inviteCode: item.inviteCode,
            avatarUrl: communityAvatarUrl(item.fullName),
            isActive: true,
            profile: {
              create: {
                levelId: 1,
                xp: 0,
                cityId: cityMap[item.citySlug],
              },
            },
            wallet: {
              create: {
                tomanBalance: 0,
                coinsBalance: 250,
                diamondsBalance: 10,
              },
            },
          },
          select: { id: true },
        });

    await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: { cityId: cityMap[item.citySlug] },
      create: {
        userId: user.id,
        levelId: 1,
        xp: 0,
        cityId: cityMap[item.citySlug],
      },
    });

    await prisma.wallet.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        tomanBalance: 0,
        coinsBalance: 250,
        diamondsBalance: 10,
      },
    });

    await ensureCustomerRole(user.id);
    usersByMobile[item.mobile] = user.id;
  }

  console.log(`  ✅ ${COMMUNITY_SEED_USERS.length} کاربر تست Community`);
  return usersByMobile;
}

async function seedCommunityTeam(usersByMobile: Record<string, string>) {
  const teamMembers = COMMUNITY_TEAM_MEMBER_MOBILES
    .map((mobile) => usersByMobile[mobile])
    .filter((userId): userId is string => !!userId);

  if (teamMembers.length < 6) {
    throw new Error('کاربران تیم Community کامل ایجاد نشدند');
  }

  const game =
    (await prisma.game.findUnique({
      where: { slug: 'mafia-pro' },
      select: { id: true, branchId: true, title: true },
    })) ||
    (await prisma.game.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
      select: { id: true, branchId: true, title: true },
    }));

  if (!game) {
    throw new Error('برای ساخت تیم Community هیچ بازی فعالی یافت نشد');
  }

  const captainId = teamMembers[0];
  const existing = await prisma.team.findFirst({
    where: { name: COMMUNITY_TEAM_NAME },
    select: { id: true },
  });

  const team = existing
    ? await prisma.team.update({
        where: { id: existing.id },
        data: {
          gameId: game.id,
          branchId: game.branchId,
          captainId,
          capacity: 6,
          status: 'FORMING',
          description: `تیم تست Community برای بازی ${game.title}`,
          isPublic: true,
        },
        select: { id: true },
      })
    : await prisma.team.create({
        data: {
          name: COMMUNITY_TEAM_NAME,
          gameId: game.id,
          branchId: game.branchId,
          captainId,
          capacity: 6,
          status: 'FORMING',
          description: `تیم تست Community برای بازی ${game.title}`,
          isPublic: true,
        },
        select: { id: true },
      });

  for (const [index, userId] of teamMembers.entries()) {
    await prisma.teamMember.upsert({
      where: { teamId_userId: { teamId: team.id, userId } },
      update: { role: index === 0 ? 'CAPTAIN' : 'MEMBER' },
      create: {
        teamId: team.id,
        userId,
        role: index === 0 ? 'CAPTAIN' : 'MEMBER',
      },
    });
  }

  const memberCount = await prisma.teamMember.count({
    where: { teamId: team.id },
  });

  await prisma.team.update({
    where: { id: team.id },
    data: { status: memberCount >= 6 ? 'FULL' : 'FORMING' },
  });

  console.log(`  ✅ تیم ${COMMUNITY_TEAM_NAME} با ${teamMembers.length} عضو`);
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

// ─── Platform intro (video + FAQ) ──────────────────────────────────────────────
async function seedPlatformIntro() {
  const existing = await prisma.platformIntro.findUnique({ where: { key: 'default' } });
  if (existing) {
    console.log('  ⏭️  معرفی پلتفرم از قبل موجود است');
    return;
  }

  await prisma.platformIntro.create({
    data: {
      key: 'default',
      title: 'معرفی پلتفرم تیک‌تاک‌ران',
      faqTitle: 'سوالات متداول اتاق فرار - اسکیپ روم',
      isActive: true,
      faqs: {
        create: [
          {
            question: 'ترسناک‌ترین بازی کدام است؟!',
            answer:
              'بسته به سلیقهٔ شما فرق می‌کند، اما اتاق‌فرارهای با سطح ترس بالا در بخش «اتاق فرار ترسناک» قابل فیلتر و مشاهده هستند. قبل از رزرو، سطح ترس هر بازی را در صفحهٔ جزئیات ببینید.',
            displayOrder: 0,
          },
          {
            question: 'حداقل و حداکثر تعداد بازیکن چقدر است؟',
            answer:
              'هر بازی ظرفیت مخصوص خودش را دارد (معمولاً ۲ تا ۸ نفر). این عدد در کارت بازی و صفحهٔ جزئیات مشخص شده است.',
            displayOrder: 1,
          },
          {
            question: 'چطور رزرو کنم؟',
            answer:
              'بازی موردنظر را انتخاب کنید، تاریخ و ساعت را مشخص کنید، تعداد نفرات را وارد کنید و پرداخت را آنلاین انجام دهید. بلیت شما بلافاصله در پنل کاربری‌تان ثبت می‌شود.',
            displayOrder: 2,
          },
          {
            question: 'آیا امکان لغو یا تغییر رزرو وجود دارد؟',
            answer:
              'بسته به قوانین هر شعبه و زمان باقی‌مانده تا سانس، امکان تغییر یا لغو وجود دارد. جزئیات را در صفحهٔ رزرو یا پشتیبانی بررسی کنید.',
            displayOrder: 3,
          },
        ],
      },
    },
  });
  console.log('  ✅ معرفی پلتفرم + سوالات متداول');
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
  await seedLandingSections();
  await seedPlatformIntro();
  await seedAdmin();
  const communityUsers = await seedCommunityUsers(cityMap);
  await seedCommunityTeam(communityUsers);
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
