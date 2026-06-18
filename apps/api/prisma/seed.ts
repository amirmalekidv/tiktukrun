/**
 * TIK TAK RUN — Seed Data کامل
 * فاز ۲: پر کردن دیتابیس با داده‌های اولیه و تستی
 *
 * اجرا: npx ts-node prisma/seed.ts
 * یا:   pnpm --filter @tiktakrun/api prisma db seed
 */

import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

// ─── Utility helpers ────────────────────────────────────────

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateCode(length = 8): string {
  return crypto.randomBytes(length).toString('hex').toUpperCase().slice(0, length);
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

// ─── Truncate ───────────────────────────────────────────────

async function truncateAll(skip = false) {
  if (skip) return;
  console.log('🗑  پاک کردن جداول...');

  // ترتیب صحیح FK
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE
    otp_requests, sessions, audit_logs, monthly_winners,
    sms_logs, notifications, ticket_messages, tickets,
    pipeline_deals, campaigns, customer_segments,
    discount_usages, auto_discounts, "_GameDiscounts",
    discount_codes, team_members, teams, chat_moderation_actions,
    chat_messages, chat_rooms, invite_usages, invite_codes,
    wheel_spins, wheel_prizes, user_avatar_items, avatar_items,
    user_badges, badges, player_ratings, game_reviews,
    payments, transactions, wallets, bookings,
    profiles, user_role_assignments, users, levels,
    game_images, games, categories, branches, cities, settings
    RESTART IDENTITY CASCADE`);

  console.log('✅ جداول پاک شدند');
}

// ────────────────────────────────────────────────────────────
// ■ LEVELS
// ────────────────────────────────────────────────────────────

async function seedLevels() {
  console.log('📊 ایجاد لول‌ها...');

  const levels = [
    // BRONZE (1-5)
    { id: 1,  name: 'تازه‌کار',      tier: 'BRONZE', requiredXp: 0,    perks: { coinsBonus: 0,  discountPercent: 0  } },
    { id: 2,  name: 'کنجکاو',        tier: 'BRONZE', requiredXp: 100,  perks: { coinsBonus: 5,  discountPercent: 0  } },
    { id: 3,  name: 'کاشف',          tier: 'BRONZE', requiredXp: 250,  perks: { coinsBonus: 10, discountPercent: 0  } },
    { id: 4,  name: 'ماجراجو',       tier: 'BRONZE', requiredXp: 450,  perks: { coinsBonus: 15, discountPercent: 0  } },
    { id: 5,  name: 'دلاور',         tier: 'BRONZE', requiredXp: 700,  perks: { coinsBonus: 20, discountPercent: 2  } },
    // SILVER (6-10)
    { id: 6,  name: 'شجاع',          tier: 'SILVER', requiredXp: 1000, perks: { coinsBonus: 25, discountPercent: 3  } },
    { id: 7,  name: 'قهرمان',        tier: 'SILVER', requiredXp: 1400, perks: { coinsBonus: 30, discountPercent: 4  } },
    { id: 8,  name: 'اسطوره',        tier: 'SILVER', requiredXp: 1900, perks: { coinsBonus: 35, discountPercent: 5  } },
    { id: 9,  name: 'ارباب تاریکی',  tier: 'SILVER', requiredXp: 2500, perks: { coinsBonus: 40, discountPercent: 5  } },
    { id: 10, name: 'فرزانه',        tier: 'SILVER', requiredXp: 3200, perks: { coinsBonus: 50, discountPercent: 6  } },
    // GOLD (11-15)
    { id: 11, name: 'استاد',         tier: 'GOLD',   requiredXp: 4000, perks: { coinsBonus: 60, discountPercent: 7  } },
    { id: 12, name: 'نخبه',          tier: 'GOLD',   requiredXp: 5000, perks: { coinsBonus: 70, discountPercent: 8  } },
    { id: 13, name: 'سرمبارز',       tier: 'GOLD',   requiredXp: 6200, perks: { coinsBonus: 80, discountPercent: 9  } },
    { id: 14, name: 'شاهزاده سایه',  tier: 'GOLD',   requiredXp: 7600, perks: { coinsBonus: 90, discountPercent: 10 } },
    { id: 15, name: 'حاکم سیاه',     tier: 'GOLD',   requiredXp: 9200, perks: { coinsBonus: 100,discountPercent: 10 } },
    // LEGEND (16-20)
    { id: 16, name: 'ابرقهرمان',     tier: 'LEGEND', requiredXp: 11000,perks: { coinsBonus: 120,discountPercent: 12 } },
    { id: 17, name: 'نیمه‌خدا',      tier: 'LEGEND', requiredXp: 13000,perks: { coinsBonus: 140,discountPercent: 14 } },
    { id: 18, name: 'خدای تاریکی',   tier: 'LEGEND', requiredXp: 15500,perks: { coinsBonus: 160,discountPercent: 16 } },
    { id: 19, name: 'امپراتور',      tier: 'LEGEND', requiredXp: 18000,perks: { coinsBonus: 180,discountPercent: 18 } },
    { id: 20, name: 'Shadow Lord',   tier: 'LEGEND', requiredXp: 21000,perks: { coinsBonus: 200,discountPercent: 20, badge: 'shadow_lord' } },
  ];

  for (const level of levels) {
    await prisma.level.create({ data: level as any });
  }
  console.log(`  ✅ ${levels.length} لول ایجاد شد`);
}

// ────────────────────────────────────────────────────────────
// ■ BADGES
// ────────────────────────────────────────────────────────────

async function seedBadges() {
  console.log('🏅 ایجاد نشان‌ها...');

  const badges = [
    { code: 'survivor',    name: 'بازمانده',      description: 'اولین اتاق فرار را با موفقیت تمام کردی!', icon: '🛡️', color: '#4CAF50', criteria: { type: 'escape_count', value: 1 } },
    { code: 'brave',       name: 'شجاع',          description: 'سه بازی ترسناک را تجربه کردی', icon: '🔥', color: '#F44336', criteria: { type: 'horror_count', value: 3 } },
    { code: 'detective',   name: 'کارآگاه',       description: '۵ اتاق فرار را حل کردی', icon: '🔍', color: '#9C27B0', criteria: { type: 'escape_count', value: 5 } },
    { code: 'mind_reader', name: 'ذهن‌خوان',      description: 'رتبه ۱۰ یا بالاتر کسب کردی', icon: '🧠', color: '#3F51B5', criteria: { type: 'level', value: 10 } },
    { code: 'legend',      name: 'افسانه',        description: 'به لول ۲۰ رسیدی', icon: '👑', color: '#FFD700', criteria: { type: 'level', value: 20 } },
    { code: 'speedster',   name: 'سریع‌الحرکت',   description: 'یک بازی را در نصف زمان حل کردی', icon: '⚡', color: '#FF9800', criteria: { type: 'speed_run', value: 1 } },
    { code: 'team_player', name: 'بازیکن تیمی',   description: '۵ بازی تیمی انجام دادی', icon: '👥', color: '#00BCD4', criteria: { type: 'team_games', value: 5 } },
    { code: 'first_booking',name: 'اولین رزرو',   description: 'اولین رزرو خود را ثبت کردی', icon: '🎯', color: '#8BC34A', criteria: { type: 'booking_count', value: 1 } },
    { code: 'loyal',       name: 'وفادار',        description: '۱۰ رزرو موفق داشتی', icon: '❤️', color: '#E91E63', criteria: { type: 'booking_count', value: 10 } },
    { code: 'vip_star',    name: 'ستاره VIP',     description: 'به رتبه طلایی رسیدی', icon: '⭐', color: '#FFC107', criteria: { type: 'tier', value: 'GOLD' } },
    { code: 'wheel_master',name: 'استاد گردونه',  description: '۲۰ بار گردونه شانس را چرخاندی', icon: '🎡', color: '#9E9E9E', criteria: { type: 'wheel_spins', value: 20 } },
    { code: 'reviewer',    name: 'منتقد',         description: '۵ نظر تأییدشده ثبت کردی', icon: '✏️', color: '#607D8B', criteria: { type: 'review_count', value: 5 } },
    { code: 'shadow_lord', name: 'ارباب سایه',    description: 'به بالاترین لول رسیدی - Shadow Lord!', icon: '🌑', color: '#B71C1C', criteria: { type: 'level', value: 20 } },
  ];

  for (const badge of badges) {
    await prisma.badge.create({ data: badge });
  }
  console.log(`  ✅ ${badges.length} نشان ایجاد شد`);
}

// ────────────────────────────────────────────────────────────
// ■ CITIES & BRANCHES
// ────────────────────────────────────────────────────────────

async function seedCities() {
  console.log('🏙  ایجاد شهرها...');

  const cities = [
    { name: 'تهران',  slug: 'tehran',    displayOrder: 1 },
    { name: 'کرج',    slug: 'karaj',     displayOrder: 2 },
    { name: 'اصفهان', slug: 'isfahan',   displayOrder: 3 },
    { name: 'شیراز',  slug: 'shiraz',    displayOrder: 4 },
    { name: 'مشهد',   slug: 'mashhad',   displayOrder: 5 },
    { name: 'تبریز',  slug: 'tabriz',    displayOrder: 6 },
    { name: 'اهواز',  slug: 'ahvaz',     displayOrder: 7 },
    { name: 'رشت',    slug: 'rasht',     displayOrder: 8 },
  ];

  const created = [];
  for (const city of cities) {
    const c = await prisma.city.create({ data: city });
    created.push(c);
  }
  console.log(`  ✅ ${created.length} شهر ایجاد شد`);
  return created;
}

async function seedBranches(cities: any[]) {
  console.log('🏢 ایجاد شعب...');

  const cityMap = Object.fromEntries(cities.map((c) => [c.slug, c.id]));

  const branches = [
    // تهران ۳ شعبه
    { name: 'شعبه تهران — ونک', cityId: cityMap['tehran'], address: 'تهران، بزرگراه شیخ فضل‌الله، مجتمع ونک پارک، طبقه ۳', phone: '021-88001122', lat: 35.7575, lng: 51.4097 },
    { name: 'شعبه تهران — نیاوران', cityId: cityMap['tehran'], address: 'تهران، خیابان نیاوران، نزدیک پارک نیاوران', phone: '021-22221133', lat: 35.8172, lng: 51.4604 },
    { name: 'شعبه تهران — چیتگر', cityId: cityMap['tehran'], address: 'تهران، منطقه ۲۲، پارک چیتگر، مجاور دریاچه', phone: '021-44882255', lat: 35.7558, lng: 51.2089 },
    // کرج ۲ شعبه
    { name: 'شعبه کرج — مرکزی', cityId: cityMap['karaj'], address: 'کرج، بلوار بهشتی، مجتمع فرهنگی ارم', phone: '026-34441122', lat: 35.8327, lng: 50.9916 },
    { name: 'شعبه کرج — گوهردشت', cityId: cityMap['karaj'], address: 'کرج، گوهردشت، خیابان گلستان', phone: '026-36667788', lat: 35.8013, lng: 50.9343 },
    // اصفهان ۲ شعبه
    { name: 'شعبه اصفهان — سپاهان', cityId: cityMap['isfahan'], address: 'اصفهان، خیابان چهارباغ عباسی، نزدیک پل خواجو', phone: '031-32221144', lat: 32.6570, lng: 51.6741 },
    { name: 'شعبه اصفهان — آزادی', cityId: cityMap['isfahan'], address: 'اصفهان، بلوار آزادی، مجتمع تجاری ستاره', phone: '031-36663355', lat: 32.6246, lng: 51.6612 },
    // شیراز
    { name: 'شعبه شیراز — زندیه', cityId: cityMap['shiraz'], address: 'شیراز، خیابان زند، مقابل ارگ کریم‌خان', phone: '071-32331155', lat: 29.6100, lng: 52.5430 },
    // مشهد
    { name: 'شعبه مشهد — بین‌الحرمین', cityId: cityMap['mashhad'], address: 'مشهد، بلوار کشاورز، نزدیک حرم مطهر', phone: '051-38889900', lat: 36.2980, lng: 59.6070 },
    // تبریز
    { name: 'شعبه تبریز — ائل‌گلی', cityId: cityMap['tabriz'], address: 'تبریز، خیابان ائل‌گلی، مجتمع پارک', phone: '041-33344455', lat: 37.8590, lng: 46.2934 },
    // اهواز
    { name: 'شعبه اهواز — کارون', cityId: cityMap['ahvaz'], address: 'اهواز، بلوار پاسداران، مجتمع کارون مال', phone: '061-32221166', lat: 31.3200, lng: 48.6700 },
    // رشت
    { name: 'شعبه رشت — گیلان', cityId: cityMap['rasht'], address: 'رشت، خیابان شهدا، مرکز خرید گیلان', phone: '013-33221144', lat: 37.2800, lng: 49.5832 },
  ];

  const created = [];
  for (const branch of branches) {
    const b = await prisma.branch.create({ data: branch as any });
    created.push(b);
  }
  console.log(`  ✅ ${created.length} شعبه ایجاد شد`);
  return created;
}

// ────────────────────────────────────────────────────────────
// ■ CATEGORIES
// ────────────────────────────────────────────────────────────

async function seedCategories() {
  console.log('📂 ایجاد دسته‌بندی‌ها...');

  const categories = [
    { name: 'اتاق فرار',   slug: 'escape-room',   icon: '🔐', color: '#B71C1C', displayOrder: 1, genre: 'HORROR'     },
    { name: 'سینما ترس',   slug: 'horror-cinema', icon: '🎬', color: '#880E4F', displayOrder: 2, genre: 'HORROR'     },
    { name: 'لیزرتگ',      slug: 'laser-tag',     icon: '🔫', color: '#1A237E', displayOrder: 3, genre: 'NON_HORROR' },
    { name: 'پینت‌بال',    slug: 'paintball',     icon: '🎯', color: '#1B5E20', displayOrder: 4, genre: 'NON_HORROR' },
    { name: 'VR ترس',      slug: 'vr-horror',     icon: '🥽', color: '#4A148C', displayOrder: 5, genre: 'HORROR'     },
    { name: 'بردگیم',      slug: 'board-game',    icon: '♟️', color: '#E65100', displayOrder: 6, genre: 'NON_HORROR' },
    { name: 'سایر',        slug: 'other',         icon: '✨', color: '#37474F', displayOrder: 7, genre: 'NON_HORROR' },
  ];

  const created = [];
  for (const cat of categories) {
    const c = await prisma.category.create({ data: cat as any });
    created.push(c);
  }
  console.log(`  ✅ ${created.length} دسته‌بندی ایجاد شد`);
  return created;
}

// ────────────────────────────────────────────────────────────
// ■ GAMES (20+ بازی)
// ────────────────────────────────────────────────────────────

async function seedGames(categories: any[], branches: any[]) {
  console.log('🎮 ایجاد بازی‌ها...');

  const catMap = Object.fromEntries(categories.map((c) => [c.slug, c.id]));
  const b = branches; // alias

  const gamesData = [
    // ─── اتاق فرار (8 بازی) ─────────────────────────────────
    {
      slug: 'dark-manor', title: 'عمارت تاریک', subtitle: 'رازهای یک خانه قدیمی',
      categoryId: catMap['escape-room'], branchId: b[0].id,
      description: 'در عمارت قرن نوزدهمی گیر افتاده‌اید. دیوارها صدا می‌کنند و زمان در حال سپری شدن است. سرنخ‌ها را پیدا کنید و پیش از آنکه در برای همیشه بسته شود، فرار کنید.',
      scenario: 'شما گروهی از محققان هستید که برای بررسی یک ناپدیدشدن مرموز به عمارت قدیمی باندرفیلد رفته‌اید. با بسته شدن ناگهانی در، متوجه می‌شوید که در دام افتاده‌اید...',
      fearLevel: 4, difficulty: 'HARD', minPlayers: 2, maxPlayers: 6, durationMinutes: 75,
      pricePerPerson: BigInt(180000), siteRank: 4.8, isFeatured: true, isActive: true,
      tags: ['تاریک', 'معما', 'تاریخی', 'ترسناک'], weeklyDiscountPercent: 0,
      teaserUrl: 'https://www.youtube.com/watch?v=sample1',
      coverImage: '/images/escape-room/1.jpg',
    },
    {
      slug: 'cursed-hospital', title: 'بیمارستان ملعون', subtitle: 'بخش مخفی ۱۳',
      categoryId: catMap['escape-room'], branchId: b[1].id,
      description: 'بیمارستان متروک شهر، بخش مخفی خود را نشان می‌دهد. بیماران فراموش‌شده در طول دهه‌ها آرام نگرفته‌اند. آیا می‌توانید اسرار بخش ۱۳ را کشف کنید؟',
      scenario: 'یک پزشک جوان طی تحقیقات خود به مدارکی از آزمایش‌های غیرانسانی در بخش مخفی بیمارستان دست یافته. شما برای نجات او باید به داخل بروید...',
      fearLevel: 5, difficulty: 'VERY_HARD', minPlayers: 2, maxPlayers: 5, durationMinutes: 90,
      pricePerPerson: BigInt(220000), siteRank: 4.9, isFeatured: true, isActive: true,
      tags: ['بیمارستان', 'ترسناک', 'اکشن', 'روانشناختی'], weeklyDiscountPercent: 0,
      coverImage: '/images/escape-room/2.jpg',
    },
    {
      slug: 'pyramid-secret', title: 'راز هرم', subtitle: 'قبر فرعون گمشده',
      categoryId: catMap['escape-room'], branchId: b[2].id,
      description: 'درون هرمی باستانی گیر افتاده‌اید. تله‌های فرعون در انتظار شماست. معماهای کهن را بگشایید تا از این دخمه باستانی جان سالم به در ببرید.',
      scenario: 'اکتشاف باستان‌شناختی در صحرای سینا شما را به کشف هرمی گمنام رسانده. با فروریختن تونل ورودی، تنها راه نجات، حل معماهای داخل هرم است...',
      fearLevel: 3, difficulty: 'MEDIUM', minPlayers: 2, maxPlayers: 8, durationMinutes: 60,
      pricePerPerson: BigInt(150000), siteRank: 4.5, isFeatured: false, isActive: true,
      tags: ['تاریخی', 'ماجراجویی', 'معما', 'مصر'], weeklyDiscountPercent: 20,
      coverImage: '/images/escape-room/3.jpg',
    },
    {
      slug: 'haunted-school', title: 'مدرسه ارواح', subtitle: 'کلاس آخر',
      categoryId: catMap['escape-room'], branchId: b[3].id,
      description: 'مدرسه‌ای که سال‌هاست تعطیل شده، اسرار ناگفته‌ای دارد. دانش‌آموزانی که ناپدید شدند و معلمی که هرگز نرفت. به کلاس آخر خوش آمدید.',
      scenario: 'شما خبرنگاران جوانی هستید که برای تهیه گزارش به این مدرسه آمده‌اید. با بسته شدن دروازه‌ها، اتفاقات عجیبی شروع می‌شود...',
      fearLevel: 4, difficulty: 'HARD', minPlayers: 3, maxPlayers: 7, durationMinutes: 75,
      pricePerPerson: BigInt(170000), siteRank: 4.7, isFeatured: true, isActive: true,
      tags: ['مدرسه', 'ارواح', 'ترسناک', 'معما'], weeklyDiscountPercent: 0,
      coverImage: '/images/escape-room/1.jpg',
    },
    {
      slug: 'lab-escape', title: 'فرار از آزمایشگاه', subtitle: 'پروژه ایکس',
      categoryId: catMap['escape-room'], branchId: b[4].id,
      description: 'آزمایشگاه مخفی دولتی دربرگیرنده یک راز بزرگ است. شما برای کشف حقیقت به اینجا آمده‌اید اما حالا باید از سیستم امنیتی فرار کنید.',
      scenario: 'به عنوان هکرهای زیرزمینی، به شبکه آزمایشگاه نفوذ کرده‌اید. اما هوش مصنوعی آزمایشگاه از ورود شما آگاه شده و در‌ها را قفل کرده...',
      fearLevel: 2, difficulty: 'MEDIUM', minPlayers: 2, maxPlayers: 6, durationMinutes: 60,
      pricePerPerson: BigInt(160000), siteRank: 4.4, isFeatured: false, isActive: true,
      tags: ['علمی', 'تکنولوژی', 'هک', 'معما'], weeklyDiscountPercent: 15,
      coverImage: '/images/escape-room/2.jpg',
    },
    {
      slug: 'vampire-castle', title: 'قلعه خون‌آشام', subtitle: 'شب جاودانگی',
      categoryId: catMap['escape-room'], branchId: b[5].id,
      description: 'در قلعه‌ای قرون وسطایی زندانی شده‌اید. ارباب قلعه، یک خون‌آشام قدیمی، شما را برای مهمانی شام دعوت کرده. پیش از طلوع خورشید باید فرار کنید.',
      scenario: 'اتوبوس توریستی در نزدیکی قلعه خراب می‌شود. تنها پناهگاه موجود همین قلعه است. اما ارباب آن چیزی است که تصور نمی‌کردید...',
      fearLevel: 5, difficulty: 'VERY_HARD', minPlayers: 2, maxPlayers: 6, durationMinutes: 90,
      pricePerPerson: BigInt(250000), siteRank: 4.9, isFeatured: true, isActive: true,
      tags: ['خون‌آشام', 'قرون وسطا', 'ترسناک', 'اکشن'], weeklyDiscountPercent: 0,
      coverImage: '/images/escape-room/3.jpg',
    },
    {
      slug: 'detective-office', title: 'دفتر کارآگاه', subtitle: 'پرونده مفقوده',
      categoryId: catMap['escape-room'], branchId: b[6].id,
      description: 'کارآگاه معروف شهر ناپدید شده و آخرین مکانی که دیده شده دفتر خودش بوده. سرنخ‌ها و پرونده‌ها در انتظار کارآگاه بعدی هستند.',
      scenario: 'کارآگاه رضایی در حال کار روی یک پرونده مرموز بود که ناگهان ناپدید شد. دفترش پر از سرنخ است. آیا می‌توانید معمای ناپدیدشدنش را حل کنید؟',
      fearLevel: 2, difficulty: 'EASY', minPlayers: 2, maxPlayers: 5, durationMinutes: 60,
      pricePerPerson: BigInt(130000), siteRank: 4.3, isFeatured: false, isActive: true,
      tags: ['کارآگاهی', 'معما', 'جنایی'], weeklyDiscountPercent: 20,
      coverImage: '/images/escape-room/1.jpg',
    },
    {
      slug: 'submarine', title: 'زیردریایی مخوف', subtitle: 'عمق ۳۰۰۰ متر',
      categoryId: catMap['escape-room'], branchId: b[7].id,
      description: 'در عمق اقیانوس، زیردریایی به دلیل نقص فنی در حال نشت آب است. تنها ۶۰ دقیقه برای رفع اشکال و صعود به سطح دارید.',
      scenario: 'در یک ماموریت محرمانه زیردریایی، انفجاری رخ می‌دهد. قبل از اینکه همه چیز پایان یابد، باید سیستم‌های اضطراری را فعال کنید...',
      fearLevel: 3, difficulty: 'HARD', minPlayers: 3, maxPlayers: 6, durationMinutes: 60,
      pricePerPerson: BigInt(175000), siteRank: 4.6, isFeatured: true, isActive: true,
      tags: ['دریا', 'بقا', 'فشار', 'اکشن'], weeklyDiscountPercent: 0,
      coverImage: '/images/escape-room/2.jpg',
    },

    // ─── سینما ترس (3 بازی) ──────────────────────────────────
    {
      slug: 'shadow-realm-cinema', title: 'قلمرو سایه', subtitle: 'نمایش ویژه شب',
      categoryId: catMap['horror-cinema'], branchId: b[0].id,
      description: 'یک تجربه سینمایی ۴D هوشمند که با واکنش‌های بینندگان تغییر می‌کند. صداها، لرزش‌ها و افکت‌های جوی این تجربه را فراتر از سینما می‌کند.',
      scenario: 'با استفاده از صندلی‌های ۴D و سیستم صدای ۳۶۰ درجه، خود را در قلب ماجرا احساس خواهید کرد.',
      fearLevel: 4, difficulty: 'MEDIUM', minPlayers: 1, maxPlayers: 20, durationMinutes: 45,
      pricePerPerson: BigInt(120000), siteRank: 4.7, isFeatured: true, isActive: true,
      tags: ['سینما', '۴D', 'ترسناک', 'تعاملی'], weeklyDiscountPercent: 10,
      coverImage: '/images/horror-cinema/1.jpg',
    },
    {
      slug: 'nightmare-show', title: 'نمایش کابوس', subtitle: 'آستانه ترس',
      categoryId: catMap['horror-cinema'], branchId: b[1].id,
      description: 'پروجکشن ۳۶۰ درجه با بازیگران زنده. مرز بین واقعیت و وهم از بین رفته. تنها یک قانون: هرگز چراغ را روشن نکنید!',
      scenario: 'در یک خانه تاریک، بازیگران آموزش‌دیده سورپرایزهای ترسناک برای شما رقم می‌زنند.',
      fearLevel: 5, difficulty: 'VERY_HARD', minPlayers: 4, maxPlayers: 15, durationMinutes: 60,
      pricePerPerson: BigInt(150000), siteRank: 4.8, isFeatured: false, isActive: true,
      tags: ['بازیگران زنده', 'تعاملی', 'ترس'], weeklyDiscountPercent: 0,
      coverImage: '/images/horror-cinema/2.jpg',
    },
    {
      slug: 'haunted-tour', title: 'تور ارواح', subtitle: 'خانه متروک شهر',
      categoryId: catMap['horror-cinema'], branchId: b[2].id,
      description: 'یک تور پیاده‌روی شبانه در خانه‌ای که گفته می‌شود تسخیر شده. راهنماهای ماهر شما را در تاریکی همراهی می‌کنند.',
      scenario: 'با یک راهنمای متخصص از اتاق به اتاق می‌روید. هر اتاق داستان خود را دارد.',
      fearLevel: 3, difficulty: 'EASY', minPlayers: 2, maxPlayers: 10, durationMinutes: 45,
      pricePerPerson: BigInt(100000), siteRank: 4.2, isFeatured: false, isActive: true,
      tags: ['تور', 'شبانه', 'ارواح'], weeklyDiscountPercent: 20,
      coverImage: '/images/horror-cinema/3.jpg',
    },

    // ─── لیزرتگ (2 بازی) ─────────────────────────────────────
    {
      slug: 'laser-battle', title: 'نبرد لیزری', subtitle: 'عملیات سری',
      categoryId: catMap['laser-tag'], branchId: b[3].id,
      description: 'به میدان نبرد لیزری وارد شوید. دو تیم در یک محیط چند طبقه با موانع و پناهگاه‌های متعدد به نبرد می‌پردازند.',
      scenario: 'دو گروه ضدتروریست در یک عملیات شبیه‌سازی شده مقابل هم قرار می‌گیرند. هدف: خنثی کردن بمب دشمن.',
      fearLevel: 1, difficulty: 'MEDIUM', minPlayers: 6, maxPlayers: 20, durationMinutes: 30,
      pricePerPerson: BigInt(80000), siteRank: 4.6, isFeatured: true, isActive: true,
      tags: ['تیمی', 'اکشن', 'رقابتی'], weeklyDiscountPercent: 0,
      coverImage: '/images/laser-tag/1.jpg',
    },
    {
      slug: 'laser-arena', title: 'آرنا لیزر', subtitle: 'دیوانه‌وار',
      categoryId: catMap['laser-tag'], branchId: b[4].id,
      description: 'بازی آزاد در آرنای بزرگ لیزری. هر بازیکن برای خود می‌جنگد. بالاترین امتیاز برنده است.',
      scenario: 'در یک میدان ۵۰۰ متر مربعی با نورهای فلوئورسنت و موزیک الکترونیک، یک نبرد لیزری دیوانه‌وار شروع می‌شود.',
      fearLevel: 1, difficulty: 'EASY', minPlayers: 4, maxPlayers: 16, durationMinutes: 20,
      pricePerPerson: BigInt(60000), siteRank: 4.3, isFeatured: false, isActive: true,
      tags: ['تک‌نفره', 'سریع', 'رقابتی'], weeklyDiscountPercent: 20,
      coverImage: '/images/laser-tag/2.jpg',
    },

    // ─── پینت‌بال (2 بازی) ────────────────────────────────────
    {
      slug: 'paintball-war', title: 'جنگ رنگ', subtitle: 'عملیات طوفان',
      categoryId: catMap['paintball'], branchId: b[5].id,
      description: 'زمین پینت‌بال حرفه‌ای در فضای باز. تجهیزات کامل ایمنی و اسلحه‌های با دقت بالا.',
      scenario: 'دو گروه از بالاترین نقطه زمین به سمت پایین حرکت می‌کنند. تیمی که پرچم حریف را بگیرد برنده است.',
      fearLevel: 1, difficulty: 'HARD', minPlayers: 6, maxPlayers: 20, durationMinutes: 45,
      pricePerPerson: BigInt(200000), siteRank: 4.5, isFeatured: false, isActive: true,
      tags: ['پینت‌بال', 'فضای باز', 'تیمی', 'اکشن'], weeklyDiscountPercent: 0,
      coverImage: '/images/paintball/1.jpg',
    },
    {
      slug: 'paintball-urban', title: 'جنگ شهری رنگ', subtitle: 'خیابان‌های تنگ',
      categoryId: catMap['paintball'], branchId: b[6].id,
      description: 'شبیه‌سازی نبرد شهری با موانع مصنوعی، خانه‌های بلوکی و تاکتیک‌های حرفه‌ای.',
      scenario: 'در یک روستای بلوکی شبیه‌سازی شده، دو تیم برای کنترل نقطه مرکزی مبارزه می‌کنند.',
      fearLevel: 1, difficulty: 'MEDIUM', minPlayers: 8, maxPlayers: 24, durationMinutes: 40,
      pricePerPerson: BigInt(180000), siteRank: 4.4, isFeatured: true, isActive: true,
      tags: ['پینت‌بال', 'شهری', 'تاکتیکی'], weeklyDiscountPercent: 10,
      coverImage: '/images/paintball/2.jpg',
    },

    // ─── VR ترس (2 بازی) ────────────────────────────────────
    {
      slug: 'vr-abyss', title: 'هاویه VR', subtitle: 'ورود به دوزخ',
      categoryId: catMap['vr-horror'], branchId: b[7].id,
      description: 'با هدست‌های VR نسل جدید، خود را در یک دنیای ترسناک غوطه‌ور کنید. هوش مصنوعی بازی با واکنش‌های شما تغییر می‌کند.',
      scenario: 'شما در یک بازی VR گیر افتاده‌اید. هر چالشی که از سر می‌گذرانید، دنیا ترسناک‌تر می‌شود.',
      fearLevel: 5, difficulty: 'LEGENDARY', minPlayers: 1, maxPlayers: 4, durationMinutes: 30,
      pricePerPerson: BigInt(250000), siteRank: 4.8, isFeatured: true, isActive: true,
      tags: ['VR', 'هوش مصنوعی', 'ترسناک', 'نسل جدید'], weeklyDiscountPercent: 0,
      coverImage: '/images/vr-horror/1.jpg',
    },
    {
      slug: 'vr-deep-space', title: 'فضای مخوف VR', subtitle: 'سیاه‌چاله',
      categoryId: catMap['vr-horror'], branchId: b[8].id,
      description: 'تجربه کاوش در فضا که ناگهان تبدیل به کابوس می‌شود. موجودات بیگانه، فضای خالی و تنهایی مطلق.',
      scenario: 'سفینه فضایی شما به یک ناحیه ناشناخته رانده شده. اشکال عجیبی در تاریکی حرکت می‌کنند...',
      fearLevel: 4, difficulty: 'VERY_HARD', minPlayers: 1, maxPlayers: 3, durationMinutes: 25,
      pricePerPerson: BigInt(220000), siteRank: 4.7, isFeatured: false, isActive: true,
      tags: ['VR', 'فضا', 'بیگانه', 'تنهایی'], weeklyDiscountPercent: 15,
      coverImage: '/images/vr-horror/2.jpg',
    },

    // ─── بردگیم (2 بازی) ─────────────────────────────────────
    {
      slug: 'board-mystery', title: 'معمای هیئت', subtitle: 'قتل در قلعه',
      categoryId: catMap['board-game'], branchId: b[9].id,
      description: 'بازی بردگیم زنده با بازیگران واقعی. یک نفر قاتل است و بقیه باید او را پیدا کنند. ۳ ساعت اسرار، دروغ و استدلال!',
      scenario: 'در یک مهمانی شبانه در قلعه‌ای اشرافی، میزبان کشته شده. هر مهمان مظنون است...',
      fearLevel: 2, difficulty: 'MEDIUM', minPlayers: 6, maxPlayers: 12, durationMinutes: 120,
      pricePerPerson: BigInt(100000), siteRank: 4.5, isFeatured: true, isActive: true,
      tags: ['بردگیم', 'جنایی', 'گروهی', 'استراتژی'], weeklyDiscountPercent: 0,
      coverImage: '/images/board-game/1.jpg',
    },
    {
      slug: 'dungeon-and-dragons', title: 'دانجن و اژدها', subtitle: 'سفر به قلب تاریکی',
      categoryId: catMap['board-game'], branchId: b[10].id,
      description: 'نسخه فارسی بازی محبوب D&D با گیم‌مستر حرفه‌ای. یک ماجراجویی حماسی که ساعت‌ها شما را درگیر می‌کند.',
      scenario: 'گروهی از قهرمانان باید برای نجات مملکت از ظلم اژدهای سیاه، به قلب کوه تاریکی بروند...',
      fearLevel: 2, difficulty: 'HARD', minPlayers: 4, maxPlayers: 6, durationMinutes: 180,
      pricePerPerson: BigInt(120000), siteRank: 4.6, isFeatured: false, isActive: true,
      tags: ['RPG', 'فانتزی', 'گیم‌مستر', 'گروهی'], weeklyDiscountPercent: 10,
      coverImage: '/images/board-game/2.jpg',
    },

    // ─── سایر (2 بازی) ────────────────────────────────────────
    {
      slug: 'archery-combat', title: 'نبرد تیروکمان', subtitle: 'آرنای سرخ',
      categoryId: catMap['other'], branchId: b[11].id,
      description: 'مبارزه تیروکمان با تیرهای فوم ایمن. دو تیم در مقابل هم قرار می‌گیرند.',
      scenario: 'مسابقه تیروکمانی حرفه‌ای در میدانی ۲۰۰ متر مربعی.',
      fearLevel: 1, difficulty: 'EASY', minPlayers: 4, maxPlayers: 16, durationMinutes: 30,
      pricePerPerson: BigInt(70000), siteRank: 4.2, isFeatured: false, isActive: true,
      tags: ['ورزشی', 'تیروکمان', 'رقابتی'], weeklyDiscountPercent: 20,
      coverImage: '/images/other/1.jpg',
    },
    {
      slug: 'escape-outdoor', title: 'فرار در فضای باز', subtitle: 'جنگل مه‌آلود',
      categoryId: catMap['other'], branchId: b[0].id,
      description: 'یک تجربه اتاق فرار واقعی در یک فضای باز بزرگ. سرنخ‌ها در طبیعت پخش شده‌اند.',
      scenario: 'در یک جنگل مه‌آلود، آثار یک آزمایش فراموش‌شده را دنبال می‌کنید.',
      fearLevel: 2, difficulty: 'HARD', minPlayers: 4, maxPlayers: 12, durationMinutes: 90,
      pricePerPerson: BigInt(160000), siteRank: 4.4, isFeatured: true, isActive: true,
      tags: ['فضای باز', 'ماجراجویی', 'طبیعت'], weeklyDiscountPercent: 0,
      coverImage: '/images/other/2.jpg',
    },
  ];

  const created = [];
  for (const game of gamesData) {
    const { coverImage, ...rest } = game;
    const g = await prisma.game.create({ data: rest as any });
    // تصاویر گالری (3 تصویر برای هر بازی)
    const catSlug = categories.find((c) => c.id === g.categoryId)?.slug || 'escape-room';
    for (let i = 1; i <= 3; i++) {
      await prisma.gameImage.create({
        data: { gameId: g.id, url: `/images/${catSlug}/${i}.jpg`, displayOrder: i },
      });
    }
    created.push(g);
  }
  console.log(`  ✅ ${created.length} بازی با تصاویر ایجاد شد`);
  return created;
}

// ────────────────────────────────────────────────────────────
// ■ AVATAR ITEMS
// ────────────────────────────────────────────────────────────

async function seedAvatarItems() {
  console.log('👤 ایجاد آیتم‌های آواتار...');

  const items = [
    // کلاه (5 عدد) — 1 پیش‌فرض
    { code: 'hat_default',  name: 'کلاه پایه',        type: 'HAT',        icon: '🎩', requiredLevel: 1,  priceDiamonds: null, isDefault: true  },
    { code: 'hat_wizard',   name: 'کلاه جادوگر',      type: 'HAT',        icon: '🧙', requiredLevel: 3,  priceDiamonds: 50,  isDefault: false },
    { code: 'hat_crown',    name: 'تاج شاهانه',       type: 'HAT',        icon: '👑', requiredLevel: 10, priceDiamonds: 200, isDefault: false },
    { code: 'hat_devil',    name: 'شاخ شیطان',        type: 'HAT',        icon: '😈', requiredLevel: 15, priceDiamonds: 350, isDefault: false },
    { code: 'hat_shadow',   name: 'کلاه سایه',        type: 'HAT',        icon: '🌑', requiredLevel: 18, priceDiamonds: 500, isDefault: false },

    // عینک (5 عدد) — 1 پیش‌فرض
    { code: 'glass_default',name: 'عینک معمولی',      type: 'GLASSES',    icon: '👓', requiredLevel: 1,  priceDiamonds: null, isDefault: true  },
    { code: 'glass_sun',    name: 'عینک آفتابی',      type: 'GLASSES',    icon: '🕶️', requiredLevel: 5,  priceDiamonds: 75,  isDefault: false },
    { code: 'glass_cyber',  name: 'عینک سایبری',      type: 'GLASSES',    icon: '🤓', requiredLevel: 8,  priceDiamonds: 120, isDefault: false },
    { code: 'glass_fire',   name: 'عینک آتش',         type: 'GLASSES',    icon: '🔥', requiredLevel: 12, priceDiamonds: 250, isDefault: false },
    { code: 'glass_dead',   name: 'عینک مرگ',         type: 'GLASSES',    icon: '☠️', requiredLevel: 17, priceDiamonds: 450, isDefault: false },

    // پوست (5 عدد) — 1 پیش‌فرض
    { code: 'skin_default', name: 'پوست معمولی',      type: 'SKIN',       icon: '👤', requiredLevel: 1,  priceDiamonds: null, isDefault: true  },
    { code: 'skin_ghost',   name: 'پوست روح',         type: 'SKIN',       icon: '👻', requiredLevel: 4,  priceDiamonds: 60,  isDefault: false },
    { code: 'skin_zombie',  name: 'پوست زامبی',       type: 'SKIN',       icon: '🧟', requiredLevel: 9,  priceDiamonds: 150, isDefault: false },
    { code: 'skin_vampire', name: 'پوست خون‌آشام',    type: 'SKIN',       icon: '🧛', requiredLevel: 14, priceDiamonds: 300, isDefault: false },
    { code: 'skin_shadow',  name: 'پوست سایه',        type: 'SKIN',       icon: '🌚', requiredLevel: 19, priceDiamonds: 500, isDefault: false },

    // افکت (5 عدد) — 1 پیش‌فرض
    { code: 'effect_none',  name: 'بدون افکت',        type: 'EFFECT',     icon: '✨', requiredLevel: 1,  priceDiamonds: null, isDefault: true  },
    { code: 'effect_fire',  name: 'افکت آتش',         type: 'EFFECT',     icon: '🔥', requiredLevel: 6,  priceDiamonds: 100, isDefault: false },
    { code: 'effect_ice',   name: 'افکت یخ',          type: 'EFFECT',     icon: '❄️', requiredLevel: 11, priceDiamonds: 200, isDefault: false },
    { code: 'effect_dark',  name: 'افکت تاریکی',      type: 'EFFECT',     icon: '🌑', requiredLevel: 16, priceDiamonds: 400, isDefault: false },
    { code: 'effect_gold',  name: 'افکت طلایی',       type: 'EFFECT',     icon: '⭐', requiredLevel: 20, priceDiamonds: 500, isDefault: false },

    // پس‌زمینه (5 عدد) — 1 پیش‌فرض
    { code: 'bg_default',   name: 'پس‌زمینه معمولی',  type: 'BACKGROUND', icon: '🌫️', requiredLevel: 1,  priceDiamonds: null, isDefault: true  },
    { code: 'bg_graveyard', name: 'قبرستان',          type: 'BACKGROUND', icon: '⚰️', requiredLevel: 7,  priceDiamonds: 80,  isDefault: false },
    { code: 'bg_castle',    name: 'قلعه',             type: 'BACKGROUND', icon: '🏰', requiredLevel: 13, priceDiamonds: 180, isDefault: false },
    { code: 'bg_dimension', name: 'بُعد موازی',       type: 'BACKGROUND', icon: '🌀', requiredLevel: 17, priceDiamonds: 350, isDefault: false },
    { code: 'bg_abyss',     name: 'هاویه',            type: 'BACKGROUND', icon: '🌌', requiredLevel: 20, priceDiamonds: 500, isDefault: false },
  ];

  for (const item of items) {
    await prisma.avatarItem.create({ data: item as any });
  }
  console.log(`  ✅ ${items.length} آیتم آواتار ایجاد شد`);
}

// ────────────────────────────────────────────────────────────
// ■ WHEEL PRIZES
// ────────────────────────────────────────────────────────────

async function seedWheelPrizes() {
  console.log('🎡 ایجاد جوایز گردونه...');

  const prizes = [
    { name: '۵۰ سکه',            type: 'COINS',        value: 50,   probabilityWeight: 30, color: '#FFC107', icon: '🪙' },
    { name: '۱۰۰ سکه',           type: 'COINS',        value: 100,  probabilityWeight: 20, color: '#FF9800', icon: '🪙' },
    { name: '۲۰۰ سکه',           type: 'COINS',        value: 200,  probabilityWeight: 10, color: '#FF5722', icon: '🪙' },
    { name: '۵۰۰ سکه',           type: 'COINS',        value: 500,  probabilityWeight: 5,  color: '#F44336', icon: '🪙' },
    { name: '۱۰ الماس',          type: 'DIAMONDS',     value: 10,   probabilityWeight: 15, color: '#00BCD4', icon: '💎' },
    { name: '۵۰ الماس',          type: 'DIAMONDS',     value: 50,   probabilityWeight: 5,  color: '#009688', icon: '💎' },
    { name: '۲۰ XP',             type: 'XP',           value: 20,   probabilityWeight: 10, color: '#8BC34A', icon: '⚡' },
    { name: 'تیکت رایگان',       type: 'FREE_TICKET',  value: 1,    probabilityWeight: 5,  color: '#9C27B0', icon: '🎟️' },
  ];

  for (const prize of prizes) {
    await prisma.wheelPrize.create({ data: prize as any });
  }
  console.log(`  ✅ ${prizes.length} جایزه گردونه ایجاد شد`);
}

// ────────────────────────────────────────────────────────────
// ■ DISCOUNTS
// ────────────────────────────────────────────────────────────

async function seedDiscounts() {
  console.log('💸 ایجاد کدهای تخفیف...');

  const autoDiscounts = [
    { name: 'VIP ۱۰٪', type: 'PERCENT', value: 10, ruleType: 'VIP', conditions: { tier: 'GOLD' }, isActive: true },
    { name: 'هفتگی ۲۰٪', type: 'PERCENT', value: 20, ruleType: 'WEEKLY', conditions: { dayOfWeek: [5, 6] }, isActive: true },
    { name: 'اولین رزرو ۱۵٪', type: 'PERCENT', value: 15, ruleType: 'FIRST_BOOKING', conditions: {}, isActive: true },
    { name: 'تولد ۲۵٪', type: 'PERCENT', value: 25, ruleType: 'BIRTHDAY', conditions: { daysRange: 7 }, isActive: true },
    { name: 'اولین دعوت ۵٪', type: 'PERCENT', value: 5, ruleType: 'INVITE', conditions: { minInvites: 1 }, isActive: true },
  ];

  for (const d of autoDiscounts) {
    await prisma.autoDiscount.create({ data: d as any });
  }

  const codes = [
    { code: 'WELCOME10',  name: 'خوش‌آمد ۱۰٪', type: 'PERCENT', value: 10, minPurchase: BigInt(100000), maxUses: 1000, validUntil: daysFromNow(180), isActive: true },
    { code: 'NIGHT20',    name: 'شب ۲۰٪',       type: 'PERCENT', value: 20, minPurchase: BigInt(200000), maxUses: 500,  validUntil: daysFromNow(90),  isActive: true },
    { code: 'HORROR15',   name: 'ترس ۱۵٪',      type: 'PERCENT', value: 15, minPurchase: BigInt(150000), maxUses: 300,  validUntil: daysFromNow(60),  isActive: true },
    { code: 'VIP25',      name: 'VIP ۲۵٪',      type: 'PERCENT', value: 25, minPurchase: BigInt(300000), maxUses: 100,  validUntil: daysFromNow(120), isActive: true },
    { code: 'WEEKEND30',  name: 'آخر هفته ۳۰٪', type: 'PERCENT', value: 30, minPurchase: BigInt(250000), maxUses: 200,  validUntil: daysFromNow(30),  isActive: true },
    { code: 'SAVE50K',    name: '۵۰ هزار تخفیف',type: 'FIXED',   value: 50000, minPurchase: BigInt(400000), maxUses: 150, validUntil: daysFromNow(45), isActive: true },
    { code: 'ESCAPE10',   name: 'اتاق فرار ۱۰٪', type: 'PERCENT', value: 10, minPurchase: BigInt(80000), maxUses: null, validUntil: daysFromNow(365), isActive: true },
    { code: 'LASER20',    name: 'لیزرتگ ۲۰٪',   type: 'PERCENT', value: 20, minPurchase: BigInt(50000), maxUses: null, validUntil: daysFromNow(365), isActive: true },
    { code: 'GROUPDEAL',  name: 'گروه ۱۲٪',      type: 'PERCENT', value: 12, minPurchase: BigInt(500000), maxUses: 80,  validUntil: daysFromNow(90),  isActive: true },
    { code: 'NEWUSER',    name: 'کاربر جدید',    type: 'FIXED',   value: 30000, minPurchase: BigInt(100000), maxUses: 500, validUntil: daysFromNow(365), isActive: true },
  ];

  const createdCodes = [];
  for (const code of codes) {
    const c = await prisma.discountCode.create({ data: code as any });
    createdCodes.push(c);
  }
  console.log(`  ✅ ${autoDiscounts.length} تخفیف خودکار + ${createdCodes.length} کد تخفیف ایجاد شد`);
  return createdCodes;
}

// ────────────────────────────────────────────────────────────
// ■ CUSTOMER SEGMENTS
// ────────────────────────────────────────────────────────────

async function seedSegments() {
  console.log('👥 ایجاد بخش‌بندی مشتریان...');

  const segments = [
    { name: 'مشتریان VIP',         conditions: { rules: [{ field: 'tier', op: 'in', value: ['GOLD', 'LEGEND'] }] },                 color: '#FFD700', icon: '⭐', cachedCount: 120 },
    { name: 'بازیکنان حرفه‌ای',    conditions: { rules: [{ field: 'totalBookings', op: 'gte', value: 10 }] },                       color: '#9C27B0', icon: '🎮', cachedCount: 340 },
    { name: 'گروه‌های شرکتی',      conditions: { rules: [{ field: 'avgPlayersCount', op: 'gte', value: 6 }] },                      color: '#2196F3', icon: '🏢', cachedCount: 85  },
    { name: 'تازه‌واردها',          conditions: { rules: [{ field: 'totalBookings', op: 'eq', value: 0 }] },                         color: '#4CAF50', icon: '🌱', cachedCount: 520 },
    { name: 'در معرض ریزش',        conditions: { rules: [{ field: 'lastBookingDaysAgo', op: 'gte', value: 60 }] },                  color: '#F44336', icon: '⚠️', cachedCount: 230 },
    { name: 'علاقه‌مند به ترسناک', conditions: { rules: [{ field: 'favoriteGenre', op: 'eq', value: 'HORROR' }] },                  color: '#B71C1C', icon: '👻', cachedCount: 410 },
    { name: 'طرفداران لیزرتگ',     conditions: { rules: [{ field: 'favoriteCategory', op: 'eq', value: 'laser-tag' }] },            color: '#1A237E', icon: '🔫', cachedCount: 180 },
    { name: 'خانوادگی',            conditions: { rules: [{ field: 'avgPlayersCount', op: 'between', value: [3, 5] }, { field: 'hasChild', op: 'eq', value: true }] }, color: '#FF9800', icon: '👨‍👩‍👧', cachedCount: 290 },
  ];

  const created = [];
  for (const seg of segments) {
    const s = await prisma.segment.create({ data: { ...seg, lastComputedAt: new Date() } });
    created.push(s);
  }
  console.log(`  ✅ ${created.length} بخش‌بندی ایجاد شد`);
  return created;
}

// ────────────────────────────────────────────────────────────
// ■ CAMPAIGNS
// ────────────────────────────────────────────────────────────

async function seedCampaigns(adminUserId: number, segments: any[]) {
  console.log('📢 ایجاد کمپین‌ها...');

  const campaigns = [
    {
      name: 'تخفیف ویژه آخر هفته',
      type: 'SMS', status: 'COMPLETED',
      segmentId: segments[0].id,
      content: { subject: 'تخفیف ۳۰٪ آخر هفته', body: 'با کد WEEKEND30 این آخر هفته ۳۰٪ تخفیف بگیرید!', templateId: 'promo_weekend' },
      scheduledAt: daysAgo(14), startedAt: daysAgo(14), completedAt: daysAgo(10),
      budget: BigInt(5000000), revenue: BigInt(18000000),
      sentCount: 450, openedCount: 320, clickedCount: 180, convertedCount: 87, createdBy: adminUserId,
    },
    {
      name: 'بازگشت کاربران غیرفعال',
      type: 'SMS', status: 'ACTIVE',
      segmentId: segments[4].id,
      content: { subject: 'دلتنگت شدیم!', body: 'مدتیه نیومدی. با کد COMEBACK15 جایزه‌ات رو بگیر!', templateId: 'winback' },
      scheduledAt: daysAgo(3), startedAt: daysAgo(3),
      budget: BigInt(3000000), revenue: BigInt(7500000),
      sentCount: 230, openedCount: 140, clickedCount: 65, convertedCount: 28, createdBy: adminUserId,
    },
    {
      name: 'جشن سالگرد TIK TAK RUN',
      type: 'INAPP', status: 'SCHEDULED',
      segmentId: null,
      content: { subject: 'سالگرد TIK TAK RUN', body: 'یک سال با هم بودیم! ۲۵٪ تخفیف برای همه در ۲۴ ساعت', templateId: 'anniversary' },
      scheduledAt: daysFromNow(7),
      budget: BigInt(10000000), revenue: BigInt(0),
      sentCount: 0, openedCount: 0, clickedCount: 0, convertedCount: 0, createdBy: adminUserId,
    },
    {
      name: 'پاداش معرفی دوستان',
      type: 'PUSH', status: 'ACTIVE',
      segmentId: segments[1].id,
      content: { subject: 'دوستتو بیار!', body: 'با کد دعوت خودت، هر دو ۵٪ تخفیف می‌گیرید', templateId: 'referral' },
      scheduledAt: daysAgo(7), startedAt: daysAgo(7),
      budget: BigInt(2000000), revenue: BigInt(5200000),
      sentCount: 340, openedCount: 210, clickedCount: 120, convertedCount: 54, createdBy: adminUserId,
    },
  ];

  for (const c of campaigns) {
    await prisma.campaign.create({ data: c as any });
  }
  console.log(`  ✅ ${campaigns.length} کمپین ایجاد شد`);
}

// ────────────────────────────────────────────────────────────
// ■ USERS (50+)
// ────────────────────────────────────────────────────────────

async function seedUsers(branches: any[]) {
  console.log('👤 ایجاد کاربران...');

  const farsiNames = [
    ['علی', 'احمدی'], ['فاطمه', 'رضایی'], ['محمد', 'حسینی'], ['زینب', 'کریمی'],
    ['رضا', 'محمدی'], ['مریم', 'صادقی'], ['حسین', 'نوری'], ['سارا', 'مرادی'],
    ['امیر', 'قاسمی'], ['نگار', 'یوسفی'], ['مهدی', 'ابراهیمی'], ['لیلا', 'شریفی'],
    ['سیاوش', 'پارسا'], ['نیلوفر', 'طاهری'], ['کاوه', 'جعفری'], ['شیرین', 'میرزایی'],
    ['بهنام', 'رستمی'], ['الناز', 'خانی'], ['داریوش', 'سلیمانی'], ['پریسا', 'موسوی'],
    ['آرمین', 'ذاکری'], ['هدیه', 'فتحی'], ['سهیل', 'باقری'], ['آناهیتا', 'نادری'],
    ['پیام', 'عباسی'], ['غزاله', 'توکلی'], ['نیما', 'کامیاب'], ['آرزو', 'صمدی'],
    ['کیارش', 'لطفی'], ['مهسا', 'حاجی'], ['شاهین', 'ولی'], ['ندا', 'اصغری'],
    ['پارسا', 'ایمانی'], ['روژان', 'کهنمویی'], ['میلاد', 'قربانی'], ['بانو', 'عزیزی'],
    ['آریا', 'شاهی'], ['باران', 'فرامرزی'], ['صدرا', 'خلیلی'], ['دریا', 'تهرانی'],
    ['آیدین', 'رهنما'], ['ماهور', 'صفایی'], ['سپهر', 'نوبخت'], ['سوفیا', 'مشایخی'],
    ['کیان', 'درویشی'], ['ترلان', 'اوغلی'],
  ];

  const usersCreated: any[] = [];

  // کاربر ۱: SuperAdmin
  const superAdmin = await createUser({
    mobile: '09120000001', fullName: 'مدیر ارشد', role: 'SUPER_ADMIN',
    xp: 20000, coinsBalance: 9999, diamondsBalance: 999, levelId: 20,
    tomanBalance: BigInt(5000000),
  });
  usersCreated.push(superAdmin);

  // کاربر ۲: Admin
  const admin = await createUser({
    mobile: '09120000002', fullName: 'مدیر سیستم', role: 'ADMIN',
    xp: 15000, coinsBalance: 5000, diamondsBalance: 500, levelId: 17,
    tomanBalance: BigInt(2000000),
  });
  usersCreated.push(admin);

  // کاربر ۳: BranchManager
  const branchManager = await createUser({
    mobile: '09120000003', fullName: 'مدیر شعبه تهران ونک', role: 'BRANCH_MANAGER',
    xp: 8000, coinsBalance: 2000, diamondsBalance: 200, levelId: 12,
    tomanBalance: BigInt(500000),
  });
  usersCreated.push(branchManager);

  // بروزرسانی managerId اولین شعبه تهران
  await prisma.branch.update({ where: { id: branches[0].id }, data: { managerId: branchManager.id } });

  // کاربر ۴: Support
  const support = await createUser({
    mobile: '09120000004', fullName: 'کارشناس پشتیبانی', role: 'SUPPORT',
    xp: 3000, coinsBalance: 800, diamondsBalance: 80, levelId: 7,
    tomanBalance: BigInt(100000),
  });
  usersCreated.push(support);

  // کاربر ۵: Marketing
  const marketing = await createUser({
    mobile: '09120000005', fullName: 'کارشناس بازاریابی', role: 'MARKETING',
    xp: 4500, coinsBalance: 1200, diamondsBalance: 120, levelId: 9,
    tomanBalance: BigInt(200000),
  });
  usersCreated.push(marketing);

  // ۴۵+ Customer
  let userIndex = 0;
  for (let i = 6; i <= 55; i++) {
    const [fn, ln] = farsiNames[userIndex % farsiNames.length];
    userIndex++;
    const xp = randomBetween(0, 18000);
    const levelId = xpToLevel(xp);
    const mobile = `0912${String(i).padStart(7, '0')}`;
    const user = await createUser({
      mobile, fullName: `${fn} ${ln}`, role: 'CUSTOMER',
      xp, coinsBalance: randomBetween(0, 5000),
      diamondsBalance: randomBetween(0, 300),
      levelId,
      tomanBalance: BigInt(randomBetween(0, 2000000)),
      invitedById: i > 14 && i < 25 ? usersCreated[randomBetween(5, 12)]?.id || null : null,
    });
    usersCreated.push(user);
  }

  // آنلاک آیتم‌های آواتار برای ۸ کاربر برتر
  const topUsers = usersCreated.filter((u) => u.profile?.xp > 8000).slice(0, 8);
  const avatarItems = await prisma.avatarItem.findMany();
  for (const user of topUsers) {
    const unlockedItems = avatarItems.filter((i: any) => i.requiredLevel <= (user.profile?.levelId || 1));
    for (const item of unlockedItems.slice(0, 10)) {
      await prisma.userAvatarItem.upsert({
        where: { userId_itemId: { userId: user.id, itemId: item.id } },
        create: { userId: user.id, itemId: item.id, isActive: item.isDefault },
        update: {},
      });
    }
  }

  console.log(`  ✅ ${usersCreated.length} کاربر ایجاد شد`);
  return { superAdmin, admin, branchManager, support, marketing, customers: usersCreated.slice(5) };
}

function xpToLevel(xp: number): number {
  const thresholds = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200, 4000, 5000, 6200, 7600, 9200, 11000, 13000, 15500, 18000, 21000];
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (xp >= thresholds[i]) return i + 1;
  }
  return 1;
}

async function createUser(opts: {
  mobile: string; fullName: string; role: string;
  xp: number; coinsBalance: number; diamondsBalance: number;
  levelId: number; tomanBalance: bigint; invitedById?: number | null;
}) {
  const inviteCode = generateCode(8);
  const user = await prisma.user.create({
    data: {
      mobile: opts.mobile,
      fullName: opts.fullName,
      inviteCode,
      invitedById: opts.invitedById || null,
      isActive: true,
      settings: { notifications: { inapp: true, sms: true }, language: 'fa' },
    },
  });

  // role
  await prisma.userRoleAssignment.create({ data: { userId: user.id, role: opts.role as any } });

  // profile
  const profile = await prisma.userProfile.create({
    data: {
      userId: user.id, levelId: opts.levelId, xp: opts.xp,
      totalBookings: randomBetween(0, 30),
      successfulBookings: randomBetween(0, 25),
      totalSpent: BigInt(randomBetween(0, 10000000)),
      fearLevel: parseFloat((Math.random() * 5).toFixed(1)),
      statsCache: { savesCount: 0, completedRooms: randomBetween(0, 20), badgesCount: 0 },
    },
  });

  // wallet
  await prisma.wallet.create({
    data: {
      userId: user.id,
      tomanBalance: opts.tomanBalance,
      coinsBalance: opts.coinsBalance,
      diamondsBalance: opts.diamondsBalance,
    },
  });

  // invite code record
  await prisma.inviteCode.create({ data: { userId: user.id, code: inviteCode } });

  return { ...user, profile };
}

// ────────────────────────────────────────────────────────────
// ■ PIPELINE DEALS
// ────────────────────────────────────────────────────────────

async function seedPipelineDeals(ownerId: number, customers: any[]) {
  console.log('📊 ایجاد پایپ‌لاین فروش...');

  const deals = [
    { name: 'رزرو گروهی شرکت فناوری رایانه', customerId: customers[0].id, value: BigInt(3500000), stage: 'LEADS',        position: 1, tag: 'corporate' },
    { name: 'قرارداد تیم‌سازی آموزشگاه زبان', customerId: customers[1].id, value: BigInt(2800000), stage: 'CONTACTED',    position: 1, tag: 'teambuilding' },
    { name: 'پکیج ماهانه مجتمع تفریحی',       customerId: customers[2].id, value: BigInt(8000000), stage: 'PROPOSED',     position: 1, tag: 'package' },
    { name: 'رزرو تولد شرکتی ۵۰ نفره',        customerId: customers[3].id, value: BigInt(5000000), stage: 'NEGOTIATING',  position: 1, tag: 'birthday' },
    { name: 'اشتراک سالانه باشگاه',           customerId: customers[4].id, value: BigInt(12000000),stage: 'CLOSED_WON',   position: 1, tag: 'subscription' },
    { name: 'تور گروه دانشگاهی',              customerId: customers[5].id, value: BigInt(1500000), stage: 'LEADS',        position: 2, tag: 'education' },
    { name: 'پکیج رویداد شرکتی',              customerId: customers[6].id, value: BigInt(6000000), stage: 'CLOSED_LOST',  position: 1, tag: 'corporate', lostReason: 'بودجه ناکافی' },
    { name: 'قرارداد فرانچایز شهرستان',       customerId: null,            value: BigInt(50000000),stage: 'PROPOSED',     position: 2, tag: 'franchise', notes: 'در حال مذاکره با سرمایه‌گذار اهواز' },
  ];

  for (const deal of deals) {
    await prisma.deal.create({ data: { ...deal, ownerId } as any });
  }
  console.log(`  ✅ ${deals.length} معامله ایجاد شد`);
}

// ────────────────────────────────────────────────────────────
// ■ BOOKINGS (150+)
// ────────────────────────────────────────────────────────────

async function seedBookings(users: any, games: any[], branches: any[]) {
  console.log('📅 ایجاد رزروها...');

  const { customers } = users;
  const statuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'CANCELLED', 'REFUNDED'] as const;
  const bookings = [];

  for (let i = 0; i < 160; i++) {
    const customer = randomItem(customers);
    const game = randomItem(games);
    const branch = branches.find((b: any) => b.id === game.branchId) || branches[0];
    const daysBack = randomBetween(1, 90);
    const status = i < 100 ? 'COMPLETED' : randomItem(statuses);
    const playersCount = randomBetween(game.minPlayers, Math.min(game.maxPlayers, 6));
    const basePrice = game.pricePerPerson * BigInt(playersCount);
    const discountApplied = i % 7 === 0 ? basePrice / BigInt(10) : BigInt(0);
    const totalAmount = basePrice - discountApplied;

    const booking = await prisma.booking.create({
      data: {
        code: generateCode(8),
        userId: customer.id,
        gameId: game.id,
        branchId: branch.id,
        slotDateTime: daysAgo(daysBack),
        playersCount,
        basePrice,
        discountApplied,
        totalAmount,
        status,
        paymentMethod: i % 3 === 0 ? 'ZARINPAL' : 'WALLET',
        rewardsEarnedXp: status === 'COMPLETED' ? 10 : 0,
        rewardsEarnedCoins: status === 'COMPLETED' ? 20 : 0,
        completedAt: status === 'COMPLETED' ? daysAgo(daysBack) : null,
        cancelledAt: status === 'CANCELLED' ? daysAgo(daysBack) : null,
      },
    });
    bookings.push(booking);

    // پرداخت برای رزروهای COMPLETED
    if (status === 'COMPLETED' || status === 'CONFIRMED') {
      await prisma.payment.create({
        data: {
          userId: customer.id,
          bookingId: booking.id,
          amount: totalAmount,
          method: booking.paymentMethod as any,
          status: 'SUCCESS',
          gateway: booking.paymentMethod === 'ZARINPAL' ? 'zarinpal' : null,
          gatewayRefId: booking.paymentMethod === 'ZARINPAL' ? String(randomBetween(100000, 999999)) : null,
          paidAt: daysAgo(daysBack),
        },
      });
    }
  }

  console.log(`  ✅ ${bookings.length} رزرو ایجاد شد`);
  return bookings;
}

// ────────────────────────────────────────────────────────────
// ■ REVIEWS (80+)
// ────────────────────────────────────────────────────────────

async function seedReviews(bookings: any[]) {
  console.log('⭐ ایجاد نظرات...');

  const completedBookings = bookings.filter((b: any) => b.status === 'COMPLETED');
  const sampleTexts = [
    'تجربه‌ای فوق‌العاده! واقعاً هیجان‌انگیز بود و گروهمون خیلی خوش‌گذشت.',
    'طراحی اتاق خیلی خوب بود. سناریو منطقی و معماها هوشمندانه.',
    'دمای محیط کمی بالا بود ولی کلاً ارزش تجربه رو داشت.',
    'بهترین اتاق فراری که تا حالا رفتم. حتماً دوباره میام!',
    'گیم‌مستر خیلی حرفه‌ای و صبور بود. ممنونم از پشتیبانی عالی.',
    'ترسناک‌تر از چیزی که فکر می‌کردم! یکی از بچه‌ها جیغ زد 😂',
    'قیمت نسبت به کیفیت مناسبه. پیشنهاد می‌کنم.',
    'طراحی دکور عالی بود. احساس می‌کردی واقعاً تو قصر قرون وسطا هستی.',
    'دوستام تولدم رو اینجا جشن گرفتن. بهترین کادوی تولدم بود!',
    'تجربه جدیدی بود. VR با اتاق فرار ترکیب جالبیه.',
    'مدت زمان ۷۵ دقیقه کافیه. نه خیلی کم نه خیلی زیاد.',
    'سیستم صدا عالی بود. موسیقی متن فضا رو کاملاً درآورده بود.',
  ];

  let reviewCount = 0;
  for (let i = 0; i < Math.min(completedBookings.length, 90); i++) {
    const booking = completedBookings[i];
    try {
      await prisma.review.create({
        data: {
          bookingId: booking.id,
          userId: booking.userId,
          gameId: booking.gameId,
          rating: randomBetween(4, 5),
          text: randomItem(sampleTexts),
          isApproved: i < 75,
          helpfulCount: randomBetween(0, 20),
        },
      });
      reviewCount++;
    } catch (e) {
      // skip duplicates
    }
  }
  console.log(`  ✅ ${reviewCount} نظر ایجاد شد`);
}

// ────────────────────────────────────────────────────────────
// ■ TRANSACTIONS (200+)
// ────────────────────────────────────────────────────────────

async function seedTransactions(users: any) {
  console.log('💳 ایجاد تراکنش‌ها...');

  const { customers } = users;
  const types = ['DEPOSIT', 'BOOKING_PAYMENT', 'WHEEL_WIN', 'INVITE_REWARD', 'MONTHLY_REWARD'] as const;
  let count = 0;

  for (let i = 0; i < 220; i++) {
    const user = randomItem(customers);
    const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
    if (!wallet) continue;

    const type = randomItem(types);
    const currency = type === 'BOOKING_PAYMENT' ? 'TOMAN' : type === 'WHEEL_WIN' ? randomItem(['COINS', 'DIAMONDS']) as any : 'TOMAN';
    const amount = type === 'BOOKING_PAYMENT' ? BigInt(randomBetween(100000, 500000)) : BigInt(randomBetween(50, 5000));

    await prisma.transaction.create({
      data: {
        walletId: wallet.id, type, currency: currency as any, amount,
        balanceAfter: wallet.tomanBalance + amount,
        description: type === 'DEPOSIT' ? 'شارژ کیف پول' : type === 'BOOKING_PAYMENT' ? 'پرداخت رزرو' : 'جایزه',
        createdAt: daysAgo(randomBetween(0, 90)),
      },
    });
    count++;
  }
  console.log(`  ✅ ${count} تراکنش ایجاد شد`);
}

// ────────────────────────────────────────────────────────────
// ■ WHEEL SPINS
// ────────────────────────────────────────────────────────────

async function seedWheelSpins(users: any) {
  console.log('🎡 ایجاد چرخش‌های گردونه...');

  const prizes = await prisma.wheelPrize.findMany();
  const { customers } = users;

  for (let i = 0; i < 60; i++) {
    const user = randomItem(customers);
    const prize = randomItem(prizes);
    await prisma.wheelSpin.create({
      data: {
        userId: user.id,
        paidWith: 'COINS',
        costPaid: 500,
        prizeId: prize.id,
        prizeSnapshot: { name: prize.name, type: prize.type, value: prize.value },
        awardedAt: daysAgo(randomBetween(0, 60)),
      },
    });
  }
  console.log('  ✅ ۶۰ چرخش گردونه ایجاد شد');
}

// ────────────────────────────────────────────────────────────
// ■ CHAT
// ────────────────────────────────────────────────────────────

async function seedChat(users: any) {
  console.log('💬 ایجاد چت...');

  // یک اتاق global
  const globalRoom = await prisma.chatRoom.create({ data: { type: 'GLOBAL', name: 'اتاق عمومی TIK TAK RUN', isActive: true } });

  const { customers } = users;
  const messages = [
    'سلام به همه! کی رو اتاق ونک رفته؟',
    'من دیشب رفتم عمارت تاریک. واقعاً ترسناک بود!',
    'کی برای بیمارستان ملعون تیم داریم؟',
    'من و ۳ نفر دیگه هستیم. کی میاد؟',
    'فردا جمعه‌ست. VR هاویه چطوره؟',
    'من ترس از تاریکی دارم ولی همیشه میرم 😂',
    'گردونه شانس رو چطور می‌چرخونن؟',
    'با ۵۰۰ سکه می‌تونید بچرخونید.',
    'اتاق فرار هرم معماش عالیه!',
    'کی با من تیم لیزرتگ درست می‌کنه؟',
    'نبرد لیزری آخر هفته کیه؟',
    'منم هستم! بگو چند نفریم',
    'فعلاً ۳ نفریم. ۳ نفر دیگه لازمه',
    'گفتن کد تخفیف HORROR15 هنوز فعاله',
    'ممنون، الان چک می‌کنم',
    'پینت‌بال شهری بهتره یا میدانی؟',
    'شهری هیجان بیشتری داره به نظرم',
    'شعبه اصفهان کی افتتاح می‌کنه؟',
    'فکر کنم ماه دیگه',
    'خیلی ممنون از پشتیبانی TIK TAK RUN. عالی بودید!',
    'VR هاویه رو امتحان کردین؟ نظرتون چیه؟',
    'من رفتم. صبر بکش! اما خیلی باحاله',
    'سینما کابوس برای کسایی که قلب ضعیف دارن پیشنهاد نمیشه 😂',
    'این ماه برنده ماهانه کیه؟',
    'فکر کنم هنوز اعلام نشده',
    'لول ۱۰ شدم! نشان جدیدم رو دریافت کردم',
    'تبریک! من لول ۷ هستم',
    'کی می‌دونه چطور می‌شه الماس خرید؟',
    'از قسمت فروشگاه تو اپ',
    'ممنون!',
  ];

  for (let i = 0; i < messages.length; i++) {
    const user = randomItem(customers);
    await prisma.chatMessage.create({
      data: {
        roomId: globalRoom.id, userId: user.id, text: messages[i],
        createdAt: daysAgo(randomBetween(0, 30)),
      },
    });
  }
  console.log('  ✅ ۱ اتاق global + ۳۰ پیام ایجاد شد');
  return globalRoom;
}

// ────────────────────────────────────────────────────────────
// ■ TEAMS
// ────────────────────────────────────────────────────────────

async function seedTeams(users: any, games: any[]) {
  console.log('👥 ایجاد تیم‌ها...');

  const { customers } = users;
  const teamNames = [
    'سایه‌نشینان', 'شبروان', 'ارباب تاریکی', 'فرار از مرگ', 'هیولاشکاران',
    'ذهن‌خوانان', 'پیشگویان', 'شکارچیان سایه',
  ];

  for (let i = 0; i < 8; i++) {
    const captain = customers[i];
    const game = randomItem(games);
    const team = await prisma.team.create({
      data: {
        name: teamNames[i],
        gameId: game.id,
        captainId: captain.id,
        capacity: randomBetween(3, 6),
        status: 'FORMING',
        isPublic: true,
        slotDateTime: daysFromNow(randomBetween(3, 14)),
      },
    });

    // captain as member
    await prisma.teamMember.create({ data: { teamId: team.id, userId: captain.id, role: 'CAPTAIN' } });

    // 1-2 members
    const memberCount = randomBetween(1, 2);
    for (let j = 0; j < memberCount; j++) {
      const member = customers[8 + i * 3 + j];
      if (member && member.id !== captain.id) {
        try {
          await prisma.teamMember.create({ data: { teamId: team.id, userId: member.id, role: 'MEMBER' } });
        } catch (e) {}
      }
    }
  }
  console.log('  ✅ ۸ تیم FORMING ایجاد شد');
}

// ────────────────────────────────────────────────────────────
// ■ NOTIFICATIONS (20+)
// ────────────────────────────────────────────────────────────

async function seedNotifications(users: any) {
  console.log('🔔 ایجاد اعلان‌ها...');

  const { customers } = users;
  const notifs = [
    { type: 'BOOKING',   title: 'رزرو تأیید شد',          body: 'رزرو شما برای عمارت تاریک تأیید شد. منتظرتان هستیم!' },
    { type: 'PAYMENT',   title: 'پرداخت موفق',             body: 'مبلغ ۳۶۰,۰۰۰ تومان با موفقیت از کیف پول کسر شد.' },
    { type: 'LEVEL',     title: 'لول‌آپ!',                 body: 'تبریک! به لول ۸ رسیدید. جایزه‌تون رو چک کنید.' },
    { type: 'BADGE',     title: 'نشان جدید',               body: 'نشان "کارآگاه" را دریافت کردید. آفرین!' },
    { type: 'WHEEL',     title: 'برنده گردونه',            body: '۲۰۰ سکه برنده شدید! موجودی کیف پول به‌روزرسانی شد.' },
    { type: 'TEAM',      title: 'عضو جدید تیم',           body: 'یک نفر به تیم شما پیوست. ظرفیت ۳ از ۵ پر شد.' },
    { type: 'PROMOTION', title: 'تخفیف ویژه',             body: 'فقط تا پایان هفته: ۳۰٪ تخفیف با کد WEEKEND30' },
    { type: 'SYSTEM',    title: 'بروزرسانی اپلیکیشن',    body: 'نسخه جدید TIK TAK RUN با قابلیت‌های جدید منتشر شد.' },
    { type: 'BOOKING',   title: 'یادآوری رزرو',           body: 'فردا ساعت ۸ شب رزرو شما است. فراموش نکنید!' },
    { type: 'PAYMENT',   title: 'شارژ کیف پول',          body: 'مبلغ ۵۰۰,۰۰۰ تومان به کیف پولتان اضافه شد.' },
    { type: 'LEVEL',     title: 'XP دریافت شد',           body: '۱۰ XP برای رزرو موفق به شما تعلق گرفت.' },
    { type: 'BADGE',     title: 'نشان "اولین رزرو"',      body: 'اولین رزروتان را ثبت کردید. خوش آمدید!' },
    { type: 'CHAT',      title: 'پیام جدید',              body: 'کاربری در اتاق عمومی به شما پاسخ داد.' },
    { type: 'SYSTEM',    title: 'کد دعوت',                body: 'دوستتان با کد دعوت شما ثبت‌نام کرد. ۵ XP دریافت کردید!' },
    { type: 'BOOKING',   title: 'رزرو کامل شد',          body: 'امیدواریم لحظات خوبی داشته باشید. نظرتان را برای ما بنویسید.' },
    { type: 'WHEEL',     title: 'گردونه در انتظار',       body: 'گردونه شانس امروز شما در انتظار است. شانستان را امتحان کنید!' },
    { type: 'TEAM',      title: 'تیم شما کامل شد',       body: 'همه ظرفیت‌های تیم پر شد. آماده‌ی بازی هستید!' },
    { type: 'PROMOTION', title: 'برنده ماهانه',          body: 'تبریک! شما بازیکن برتر این ماه شدید. جایزه‌تان ارسال خواهد شد.' },
    { type: 'SYSTEM',    title: 'تأیید نظر',             body: 'نظر شما درباره بیمارستان ملعون تأیید و منتشر شد.' },
    { type: 'PAYMENT',   title: 'استرداد وجه',           body: 'مبلغ ۱۷۵,۰۰۰ تومان به دلیل لغو رزرو به کیف پولتان برگشت.' },
  ];

  for (let i = 0; i < notifs.length; i++) {
    const user = randomItem(customers);
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: notifs[i].type as any,
        title: notifs[i].title,
        body: notifs[i].body,
        isRead: i < 10,
        createdAt: daysAgo(randomBetween(0, 30)),
      },
    });
  }
  console.log(`  ✅ ${notifs.length} اعلان ایجاد شد`);
}

// ────────────────────────────────────────────────────────────
// ■ TICKETS
// ────────────────────────────────────────────────────────────

async function seedTickets(users: any) {
  console.log('🎫 ایجاد تیکت‌ها...');

  const { customers, support } = users;
  const ticketData = [
    { subject: 'مشکل در پرداخت', body: 'مبلغ از حساب کسر شده ولی رزرو تأیید نشده', priority: 'HIGH',   status: 'IN_PROGRESS' },
    { subject: 'لغو رزرو و استرداد', body: 'می‌خوام رزروم رو لغو کنم و برگشت وجه بگیرم', priority: 'MEDIUM', status: 'RESOLVED'    },
    { subject: 'مشکل با کد تخفیف', body: 'کد WEEKEND30 کار نمی‌کنه', priority: 'LOW',    status: 'CLOSED'     },
    { subject: 'سوال درباره گردونه', body: 'چطور می‌شه گردونه رو چرخوند؟', priority: 'LOW',    status: 'RESOLVED'   },
    { subject: 'خرابی سیستم VR',   body: 'هدست VR خراب بود و تجربه خوبی نداشتم', priority: 'URGENT', status: 'OPEN'       },
    { subject: 'بج دریافت نشد',    body: 'بعد از ۱۰ رزرو، بج وفادار دریافت نکردم', priority: 'MEDIUM', status: 'OPEN'       },
    { subject: 'تغییر زمان رزرو', body: 'می‌خوام زمان رزروم رو عوض کنم', priority: 'MEDIUM', status: 'WAITING_USER'},
    { subject: 'مشکل ورود',       body: 'کد OTP دریافت نمی‌کنم', priority: 'HIGH',   status: 'RESOLVED'   },
    { subject: 'پیشنهاد بازی جدید', body: 'پیشنهاد می‌کنم بازی شطرنج تیمی اضافه کنید', priority: 'LOW', status: 'CLOSED'   },
    { subject: 'مشکل چت',         body: 'نمی‌تونم در اتاق چت پیام بفرستم', priority: 'MEDIUM', status: 'RESOLVED'  },
    { subject: 'درخواست فاکتور',   body: 'برای شرکتمون فاکتور رسمی لازم دارم', priority: 'HIGH',   status: 'IN_PROGRESS'},
    { subject: 'مشکل با آواتار',   body: 'آیتم‌های آواتار که خریدم نمایش داده نمیشه', priority: 'LOW', status: 'RESOLVED' },
  ];

  for (let i = 0; i < ticketData.length; i++) {
    const user = randomItem(customers);
    const ticket = await prisma.ticket.create({
      data: {
        code: `TKT-${generateCode(6)}`,
        userId: user.id,
        subject: ticketData[i].subject,
        body: ticketData[i].body,
        priority: ticketData[i].priority as any,
        status: ticketData[i].status as any,
        assigneeId: i < 8 ? support.id : null,
        lastReplyAt: new Date(),
      },
    });

    // یک پیام پیگیری
    await prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        senderId: user.id,
        body: ticketData[i].body,
        isStaffReply: false,
        attachments: [],
      },
    });

    if (ticketData[i].status !== 'OPEN') {
      await prisma.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          senderId: support.id,
          body: 'مشکل شما بررسی و حل خواهد شد. در صورت نیاز با ما در تماس باشید.',
          isStaffReply: true,
          attachments: [],
        },
      });
    }
  }
  console.log(`  ✅ ${ticketData.length} تیکت ایجاد شد`);
}

// ────────────────────────────────────────────────────────────
// ■ SMS LOGS
// ────────────────────────────────────────────────────────────

async function seedSmsLogs(users: any) {
  console.log('📱 ایجاد لاگ پیامک‌ها...');

  const { customers } = users;
  const templates = ['otp_login', 'booking_confirm', 'booking_cancel', 'promo_weekend', 'winback', 'level_up'];

  for (let i = 0; i < 10; i++) {
    const user = randomItem(customers);
    await prisma.smsLog.create({
      data: {
        mobile: user.mobile,
        template: randomItem(templates),
        vars: { code: String(randomBetween(10000, 99999)), name: user.fullName },
        status: i < 8 ? 'SUCCESS' : 'FAILED',
        providerRef: `SMS-${generateCode(8)}`,
        sentAt: daysAgo(randomBetween(0, 30)),
        userId: user.id,
      },
    });
  }
  console.log('  ✅ ۱۰ لاگ پیامک ایجاد شد');
}

// ────────────────────────────────────────────────────────────
// ■ SETTINGS
// ────────────────────────────────────────────────────────────

async function seedSettings() {
  console.log('⚙️  ایجاد تنظیمات سیستم...');

  const settings = [
    // general
    { key: 'general.appName',         value: 'TIK TAK RUN',              group: 'general'       },
    { key: 'general.supportEmail',    value: 'support@tiktakrun.ir',      group: 'general'       },
    { key: 'general.supportPhone',    value: '021-88001122',              group: 'general'       },
    { key: 'general.maintenanceMode', value: false,                       group: 'general'       },
    { key: 'general.appVersion',      value: '1.0.0',                     group: 'general'       },
    // financial
    { key: 'financial.commissionPercent',    value: 15,                   group: 'financial'     },
    { key: 'financial.minWalletCharge',      value: 50000,                group: 'financial'     },
    { key: 'financial.maxWalletCharge',      value: 50000000,             group: 'financial'     },
    { key: 'financial.vipCashbackPercent',   value: 5,                    group: 'financial'     },
    { key: 'financial.refundDays',           value: 3,                    group: 'financial'     },
    // chat
    { key: 'chat.maxMessagesPerMinute', value: 5,                         group: 'chat'          },
    { key: 'chat.autoMuteAt3Reports',   value: true,                      group: 'chat'          },
    { key: 'chat.bannedWords',          value: ['فحش', 'ناسزا'],          group: 'chat'          },
    { key: 'chat.globalRoomEnabled',    value: true,                      group: 'chat'          },
    // gamification
    { key: 'gamification.xpPerBooking',       value: 10,                  group: 'gamification'  },
    { key: 'gamification.xpPerInvite',        value: 5,                   group: 'gamification'  },
    { key: 'gamification.coinsPerBooking',    value: 20,                  group: 'gamification'  },
    { key: 'gamification.wheelCostCoins',     value: 500,                 group: 'gamification'  },
    { key: 'gamification.wheelCostDiamonds',  value: 5,                   group: 'gamification'  },
    { key: 'gamification.wheelXpThreshold',   value: 20,                  group: 'gamification'  },
    { key: 'gamification.inviteXpReward',     value: 5,                   group: 'gamification'  },
    // security
    { key: 'security.twoFactorEnabled',     value: false,                 group: 'security'      },
    { key: 'security.maxLoginAttempts',     value: 5,                     group: 'security'      },
    { key: 'security.sessionExpireDays',    value: 30,                    group: 'security'      },
    { key: 'security.otpExpireMinutes',     value: 5,                     group: 'security'      },
    // ai
    { key: 'ai.recommendationsEnabled',    value: true,                   group: 'ai'            },
    { key: 'ai.chatbotEnabled',            value: false,                  group: 'ai'            },
  ];

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      create: { key: s.key, value: s.value as any, group: s.group },
      update: { value: s.value as any },
    });
  }
  console.log(`  ✅ ${settings.length} تنظیم ایجاد شد`);
}

// ────────────────────────────────────────────────────────────
// ■ AUDIT LOGS
// ────────────────────────────────────────────────────────────

async function seedAuditLogs(adminId: number) {
  console.log('📋 ایجاد لاگ حسابرسی...');

  const logs = [
    { action: 'user.ban',       entity: 'User',    entityId: '12',  beforeJson: { isBanned: false }, afterJson: { isBanned: true },  ip: '192.168.1.100' },
    { action: 'setting.update', entity: 'Setting', entityId: 'financial.commissionPercent', beforeJson: { value: 10 }, afterJson: { value: 15 }, ip: '192.168.1.100' },
    { action: 'game.create',    entity: 'Game',    entityId: '1',   beforeJson: null, afterJson: { title: 'عمارت تاریک' }, ip: '192.168.1.101' },
    { action: 'booking.cancel', entity: 'Booking', entityId: '5',   beforeJson: { status: 'CONFIRMED' }, afterJson: { status: 'CANCELLED' }, ip: '192.168.1.102' },
    { action: 'discount.create',entity: 'DiscountCode', entityId: '1', beforeJson: null, afterJson: { code: 'WELCOME10' }, ip: '192.168.1.100' },
    { action: 'user.level_adjust', entity: 'Profile', entityId: '20', beforeJson: { xp: 5000 }, afterJson: { xp: 6000 }, ip: '192.168.1.100' },
    { action: 'branch.update',  entity: 'Branch',  entityId: '1',   beforeJson: { phone: '021-88001100' }, afterJson: { phone: '021-88001122' }, ip: '192.168.1.101' },
    { action: 'badge.award',    entity: 'UserBadge', entityId: '45', beforeJson: null, afterJson: { badgeCode: 'brave' }, ip: '192.168.1.100' },
    { action: 'campaign.launch',entity: 'Campaign', entityId: '1',  beforeJson: { status: 'DRAFT' }, afterJson: { status: 'ACTIVE' }, ip: '192.168.1.100' },
    { action: 'review.approve', entity: 'GameReview', entityId: '10', beforeJson: { isApproved: false }, afterJson: { isApproved: true }, ip: '192.168.1.101' },
  ];

  for (const log of logs) {
    await prisma.auditLog.create({ data: { ...log, actorId: adminId, ua: 'Mozilla/5.0', createdAt: daysAgo(randomBetween(0, 30)) } });
  }
  console.log(`  ✅ ${logs.length} رکورد audit ایجاد شد`);
}

// ────────────────────────────────────────────────────────────
// ■ INVITE USAGES (صریح)
// ────────────────────────────────────────────────────────────

async function seedInviteUsages(users: any) {
  console.log('🔗 ایجاد استفاده از کدهای دعوت...');

  const { customers } = users;
  let count = 0;

  // کاربرانی که invitedById دارند، باید InviteUsage صریح هم داشته باشند
  // customers[8..24] در seedUsers با invitedById ایجاد شده‌اند
  for (let i = 8; i < Math.min(14, customers.length); i++) {
    const invitedUser = customers[i];
    if (!invitedUser?.invitedById) continue;

    // پیدا کردن InviteCode مربوط به دعوت‌کننده
    const inviterInviteCode = await prisma.inviteCode.findUnique({
      where: { userId: invitedUser.invitedById },
    });
    if (!inviterInviteCode) continue;

    // بررسی عدم وجود تکراری
    const existing = await prisma.inviteUsage.findUnique({
      where: { invitedUserId: invitedUser.id },
    });
    if (existing) continue;

    try {
      await prisma.inviteUsage.create({
        data: {
          codeId: inviterInviteCode.id,
          invitedUserId: invitedUser.id,
          rewardXpGiven: 5,
          createdAt: daysAgo(randomBetween(1, 30)),
        },
      });

      // بروزرسانی totalUses در InviteCode
      await prisma.inviteCode.update({
        where: { id: inviterInviteCode.id },
        data: { totalUses: { increment: 1 }, totalRewardXp: { increment: 5 } },
      });

      count++;
    } catch (e) {
      // skip duplicates
    }
  }

  console.log(`  ✅ ${count} InviteUsage صریح ایجاد شد`);
}

// ────────────────────────────────────────────────────────────
// ■ PLAYER RATINGS
// ────────────────────────────────────────────────────────────

async function seedPlayerRatings(users: any, bookings: any[]) {
  console.log('⭐ ایجاد امتیازدهی مدیر به بازیکنان...');

  const { branchManager, customers } = users;
  const completedBookings = bookings.filter((b: any) => b.status === 'COMPLETED');
  let count = 0;

  // مدیر شعبه به ۱۵ بازیکن امتیاز می‌دهد
  const sampleReasons = [
    'رفتار عالی در طول بازی',
    'همکاری تیمی ممتاز',
    'رعایت کامل قوانین',
    'بازیکن ارزشمند — پیشنهاد بازی مجدد',
    'تلاش بالا در حل معماها',
    'سکوت و احترام به سایر بازیکنان',
    'سرعت بالا در حل چالش‌ها',
    'خلاقیت در حل معماها',
  ];

  const negativeReasons = [
    'عدم رعایت قوانین امنیتی',
    'رفتار نامناسب با سایر بازیکنان',
  ];

  for (let i = 0; i < Math.min(15, completedBookings.length); i++) {
    const booking = completedBookings[i];
    const isPositive = i < 13;
    const xpChange = isPositive ? randomBetween(5, 20) : -randomBetween(5, 10);

    try {
      await prisma.playerRating.create({
        data: {
          fromUserId: branchManager.id,
          toUserId: booking.userId,
          bookingId: booking.id,
          xpChange,
          reason: isPositive ? randomItem(sampleReasons) : randomItem(negativeReasons),
          createdAt: new Date(booking.slotDateTime),
        },
      });
      count++;
    } catch (e) {
      // skip
    }
  }

  // تعدادی امتیاز بین مشتریان (Peer Rating — اختیاری در سیستم)
  for (let i = 0; i < 5; i++) {
    const fromUser = customers[i];
    const toUser = customers[i + 10];
    if (!fromUser || !toUser || fromUser.id === toUser.id) continue;

    try {
      await prisma.playerRating.create({
        data: {
          fromUserId: fromUser.id,
          toUserId: toUser.id,
          bookingId: null,
          xpChange: randomBetween(1, 5),
          reason: 'همبازی خوب',
          createdAt: daysAgo(randomBetween(1, 60)),
        },
      });
      count++;
    } catch (e) {}
  }

  console.log(`  ✅ ${count} امتیاز بازیکن ایجاد شد`);
}

// ────────────────────────────────────────────────────────────
// ■ MONTHLY WINNERS
// ────────────────────────────────────────────────────────────

async function seedMonthlyWinners(users: any, games: any[]) {
  console.log('🏆 ایجاد برندگان ماهانه...');

  const { customers } = users;

  // برندگان — طراحی polymorphic اصلاح‌شده:
  // TOP_PLAYER: winnerUserId دارد
  // TOP_TEAM:   winnerTeamId دارد
  // TOP_GAME:   winnerGameId دارد
  const winners = [
    {
      year: 2026, month: 2, type: 'TOP_PLAYER',
      winnerUserId: customers[0].id,
      winnerTeamId: null, winnerGameId: null,
      prizeJson: { toman: 500000, badge: 'top_player', title: 'بازیکن برتر اسفند ۱۴۰۴' },
      distributedAt: daysAgo(20),
    },
    {
      year: 2026, month: 1, type: 'TOP_PLAYER',
      winnerUserId: customers[1].id,
      winnerTeamId: null, winnerGameId: null,
      prizeJson: { toman: 500000, badge: 'top_player', title: 'بازیکن برتر بهمن ۱۴۰۴' },
      distributedAt: daysAgo(50),
    },
    {
      year: 2026, month: 1, type: 'TOP_GAME',
      winnerUserId: null,
      winnerTeamId: null, winnerGameId: games[0].id,
      prizeJson: { featuredBadge: true, title: 'بازی برتر بهمن ۱۴۰۴ — عمارت تاریک' },
      distributedAt: daysAgo(50),
    },
    {
      year: 2026, month: 2, type: 'TOP_GAME',
      winnerUserId: null,
      winnerTeamId: null, winnerGameId: games[1].id,
      prizeJson: { featuredBadge: true, title: 'بازی برتر اسفند ۱۴۰۴ — بیمارستان ملعون' },
      distributedAt: daysAgo(18),
    },
  ];

  let count = 0;
  for (const w of winners) {
    try {
      await prisma.monthlyWinner.create({ data: w as any });
      count++;
    } catch (e) {}
  }
  console.log(`  ✅ ${count} برنده ماهانه ایجاد شد`);
}

// ────────────────────────────────────────────────────────────
// ■ USER BADGES
// ────────────────────────────────────────────────────────────

async function seedUserBadges(users: any, adminId: number) {
  console.log('🏅 اعطای نشان به کاربران...');

  const { customers } = users;
  const badges = await prisma.badge.findMany();
  const badgeMap = Object.fromEntries(badges.map((b) => [b.code, b.id]));

  // اعطای نشان‌های اولیه
  const assignments = [
    { userId: customers[0].id, badgeCode: 'first_booking' },
    { userId: customers[0].id, badgeCode: 'survivor' },
    { userId: customers[1].id, badgeCode: 'first_booking' },
    { userId: customers[1].id, badgeCode: 'brave' },
    { userId: customers[2].id, badgeCode: 'first_booking' },
    { userId: customers[3].id, badgeCode: 'first_booking' },
    { userId: customers[3].id, badgeCode: 'team_player' },
    { userId: customers[4].id, badgeCode: 'first_booking' },
    { userId: customers[4].id, badgeCode: 'loyal' },
    { userId: customers[5].id, badgeCode: 'first_booking' },
    { userId: customers[5].id, badgeCode: 'reviewer' },
    { userId: customers[6].id, badgeCode: 'speedster' },
    { userId: customers[7].id, badgeCode: 'detective' },
  ];

  for (const a of assignments) {
    const badgeId = badgeMap[a.badgeCode];
    if (!badgeId) continue;
    try {
      await prisma.userBadge.create({
        data: { userId: a.userId, badgeId, awardedBy: adminId, awardedAt: daysAgo(randomBetween(1, 60)) },
      });
    } catch (e) {}
  }
  console.log(`  ✅ ${assignments.length} نشان اعطا شد`);
}

// ────────────────────────────────────────────────────────────
// ■ MAIN
// ────────────────────────────────────────────────────────────

async function main() {
  const skipTruncate = process.argv.includes('--skip-truncate');
  console.log('\n🚀 شروع Seed دیتابیس TIK TAK RUN...\n');

  await truncateAll(skipTruncate);

  await seedLevels();
  await seedBadges();
  const cities = await seedCities();
  const branches = await seedBranches(cities);
  const categories = await seedCategories();
  const games = await seedGames(categories, branches);
  await seedAvatarItems();
  await seedWheelPrizes();
  const discountCodes = await seedDiscounts();
  const segments = await seedSegments();

  const users = await seedUsers(branches);
  const { superAdmin, admin, customers } = users;

  await seedCampaigns(admin.id, segments);
  await seedPipelineDeals(admin.id, customers);

  const bookings = await seedBookings(users, games, branches);
  await seedReviews(bookings);
  await seedPlayerRatings(users, bookings);
  await seedTransactions(users);
  await seedWheelSpins(users);

  await seedChat(users);
  await seedTeams(users, games);
  await seedNotifications(users);
  await seedTickets(users);
  await seedSmsLogs(users);
  await seedSettings();
  await seedAuditLogs(admin.id);
  await seedInviteUsages(users);
  await seedMonthlyWinners(users, games);
  await seedUserBadges(users, admin.id);

  // آمار نهایی
  console.log('\n📊 آمار نهایی:');
  const stats = {
    levels:           await prisma.level.count(),
    cities:           await prisma.city.count(),
    branches:         await prisma.branch.count(),
    categories:       await prisma.category.count(),
    games:            await prisma.game.count(),
    gameImages:       await prisma.gameImage.count(),
    badges:           await prisma.badge.count(),
    avatarItems:      await prisma.avatarItem.count(),
    wheelPrizes:      await prisma.wheelPrize.count(),
    users:            await prisma.user.count(),
    bookings:         await prisma.booking.count(),
    reviews:          await prisma.review.count(),
    transactions:     await prisma.transaction.count(),
    payments:         await prisma.payment.count(),
    wheelSpins:       await prisma.wheelSpin.count(),
    notifications:    await prisma.notification.count(),
    teams:            await prisma.team.count(),
    tickets:          await prisma.ticket.count(),
    discountCodes:    await prisma.discountCode.count(),
    campaigns:        await prisma.campaign.count(),
    segments:         await prisma.segment.count(),
    pipelineDeals:    await prisma.deal.count(),
    playerRatings:    await prisma.playerRating.count(),
    inviteUsages:     await prisma.inviteUsage.count(),
    settings:         await prisma.setting.count(),
    auditLogs:        await prisma.auditLog.count(),
    monthlyWinners:   await prisma.monthlyWinner.count(),
  };

  for (const [key, count] of Object.entries(stats)) {
    console.log(`  ${key.padEnd(20)}: ${count}`);
  }

  console.log('\n✅ Seed با موفقیت انجام شد!\n');
}

main()
  .catch((e) => {
    console.error('❌ خطا در Seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
