# 🎮 TIK TAK RUN

> پلتفرم فارسی رزرو آنلاین سرگرمی‌های هیجانی — اتاق فرار، سینما ترس، لیزرتگ، پینت‌بال، واقعیت مجازی، بردگیم و ...

[![Version](https://img.shields.io/badge/version-1.0.0-red)](./CHANGELOG.md)
[![Node](https://img.shields.io/badge/node-20+-green)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-Private-blue)](#)
[![Docker](https://img.shields.io/badge/docker-ready-blue)](./docker-compose.yml)

---

## 📌 معرفی

**TIK TAK RUN** یک پلتفرم کامل با دو رابط است:

| رابط | نقش | تکنولوژی |
|------|-----|----------|
| 🌐 **سایت اصلی** (web) | کاربران نهایی — رزرو بازی، پرداخت، گردونه، چت، تیم | Next.js 14 + Tailwind RTL |
| 👨‍💼 **داشبورد ادمین** (admin) | پنل CRM/Operations برای مدیران و کارکنان | Next.js 14 + Chart.js + DnD-Kit |
| ⚙️ **API بک‌اند** (api) | NestJS + Prisma + Socket.io | REST + WebSocket |

تم بصری: **Shadow Realm Gothic** (قرمز خونی روی مشکی، فونت Cinzel + Vazirmatn، انیمیشن‌های flicker و heartbeat).

---

## ✨ ویژگی‌های کلیدی

### کاربر نهایی
- ✅ ورود با OTP (SMS.ir)
- ✅ کیف پول سه‌گانه: **تومان** + **سکه** + **الماس**
- ✅ شارژ کیف با **ZarinPal**
- ✅ رزرو ۴ مرحله‌ای با کد تخفیف
- ✅ سیستم گیمیفیکیشن کامل: **۲۰ سطح** + Bronze/Silver/Gold/Legend
- ✅ گردونه شانس با ۳ روش: XP، سکه، الماس
- ✅ آواتار سفارشی با خرید accessories
- ✅ چت زنده + تیم‌سازی
- ✅ سیستم دعوت (+5 XP پاداش)
- ✅ نظرات و امتیازدهی دوطرفه
- ✅ بهترین بازی‌ها/بازیکنان هفته و ماه + جایزه ماهانه
- ✅ فیلتر شهرها (تهران، کرج، ...) + ژانر + دسته
- ✅ پشتیبانی تیکتی

### ادمین
- ✅ **Dashboard Overview**: KPIs، نمودارهای real-time، Live Activities
- ✅ **CRM کامل**: مشتریان 360°، Segments، Pipeline Kanban، Campaigns
- ✅ **Operations**: مدیریت رزروها (لیست + تقویم)، بازی‌ها، شعب
- ✅ **Finance**: تراکنش‌ها، پرداخت‌ها، گزارش مالی
- ✅ **Gamification**: مدیریت گردونه، بج‌ها، سطوح، آواتارها
- ✅ **Reports**: مالی، بازی‌ها، Cohort، Heatmap
- ✅ **Settings**: عمومی، مالی، چت، امنیت، گیمیفیکیشن، پرداخت، SMS، تم
- ✅ **RBAC**: نقش‌ها + permissions matrix + ممیزی (Audit Log)
- ✅ **Backup/Restore** دیتابیس
- ✅ Real-time updates با Socket.io
- ✅ خروجی Excel/PDF/CSV
- ✅ ۲ زبانی (UI فارسی، نام‌های فنی انگلیسی)
- ✅ **بدون حالت دمو/Mock**: کل پنل ادمین به بک‌اند واقعی متصل است (`USE_MOCK=false` به‌صورت سخت) — همه صفحات روی API واقعی کار می‌کنند
- ✅ **رزرو دستی ادمین**: ساخت رزرو از پنل (`POST /admin/bookings`) با جست‌وجوی مشتری، انتخاب بازی/اسلات/تعداد بازیکن/روش پرداخت

---

## 🗄️ وضعیت دیتابیس و حالت دمو

| مورد | وضعیت |
|------|--------|
| **دیتابیس** | ✅ مهاجرت کامل از PostgreSQL به **MongoDB 7** (Prisma MongoDB connector) |
| **Analytics** | ✅ همه کوئری‌های `$queryRaw` (SQL) به Prisma + تجمیع JS بازنویسی شد (سازگار با MongoDB) |
| **Backup/Restore** | ✅ از `pg_dump` به **`mongodump --archive --gzip`** تغییر کرد (restore با `mongorestore`) |
| **حالت دمو ادمین** | ✅ کاملاً حذف شد — `USE_MOCK=false`، همه صفحات به API واقعی متصل‌اند |
| **Transactions** | نیازمند MongoDB به‌صورت **replica set** (`rs0`) |

---

## 🛠 استک فنی

| لایه | تکنولوژی |
|------|----------|
| **Frontend Site** | Next.js 14 (App Router) + TypeScript + Tailwind RTL + Framer Motion |
| **Frontend Admin** | Next.js 14 + Chart.js / Recharts + @dnd-kit + react-table |
| **Backend** | NestJS 10 + Prisma 5 + class-validator |
| **Database** | MongoDB 7 (replica set `rs0` برای transactionها) |
| **Cache** | Redis 7 |
| **Real-time** | Socket.io 4 |
| **Auth** | JWT + OTP موبایل |
| **Payment** | ZarinPal |
| **SMS** | SMS.ir |
| **Calendar** | jalali-moment (UI) / ISO 8601 (DB) |
| **Reverse Proxy** | Nginx + Let's Encrypt SSL |
| **Container** | Docker Compose |
| **Monorepo** | pnpm workspaces + Turborepo |

---

## 🚀 شروع سریع (Quick Start)

### پیش‌نیازها
- Docker 24+ و Docker Compose v2
- (اختیاری برای dev) Node.js 20+ و pnpm 9+

### نصب در 5 دقیقه

```bash
# 1. کلون پروژه
git clone <repo-url> tiktakrun
cd tiktakrun

# 2. کپی و تنظیم متغیرها
cp .env.example .env
nano .env  # حداقل DATABASE_URL (MongoDB)، JWT_SECRET، COOKIE_SECRET را تنظیم کن
# نمونه DATABASE_URL:
# mongodb://localhost:27017/tiktakrun?replicaSet=rs0&directConnection=true

# 3. بالا آوردن سرویس‌ها (MongoDB با replica set راه‌اندازی می‌شود)
docker compose up -d

# 4. اعمال schema و seed (MongoDB از prisma db push استفاده می‌کند، نه migrate)
docker compose exec api npx prisma db push
docker compose exec api pnpm seed
```

**خروجی:**
- 🌐 سایت کاربران: http://localhost:3000
- 👨‍💼 داشبورد ادمین: http://localhost:3001
- 📚 Swagger API: http://localhost:4000/api/v1/docs
- ❤️ Health: http://localhost:4000/health

### ورود پیش‌فرض (Seed)
| نقش | موبایل | پسورد |
|-----|--------|-------|
| Super Admin | `09120000001` | `Admin@123456` (حتماً تغییر دهید!) |
| Branch Manager | `09120000002` | `Manager@123` |
| Customer | `09121111111` | با OTP |

---

## 📁 ساختار پروژه

```
tiktakrun/
├── apps/
│   ├── api/                  # NestJS Backend (port 4000)
│   │   ├── src/
│   │   │   ├── modules/      # 31 ماژول
│   │   │   ├── common/       # decorators, filters, guards, ...
│   │   │   ├── prisma/       # Prisma service
│   │   │   └── main.ts       # bootstrap
│   │   ├── prisma/
│   │   │   ├── schema.prisma # 51 model
│   │   │   ├── seed.ts       # seed داده اولیه
│   │   │   └── migrations/
│   │   └── test/             # e2e tests
│   ├── web/                  # سایت اصلی (port 3000)
│   │   └── src/
│   │       ├── app/          # App Router
│   │       │   ├── (auth)/   # ورود + OTP
│   │       │   ├── (authenticated)/  # داشبورد کاربر
│   │       │   ├── games/
│   │       │   └── section/
│   │       ├── components/
│   │       └── lib/
│   └── admin/                # داشبورد ادمین (port 3001)
│       └── src/
│           ├── app/
│           │   └── (dashboard)/  # 60+ صفحه
│           ├── components/
│           └── lib/
├── packages/
│   ├── shared-types/         # types مشترک
│   ├── ui/                   # کامپوننت‌های UI مشترک
│   └── config/               # tsconfig, eslint, tailwind پایه
├── infra/
│   ├── docker/               # Dockerfile های api/web/admin/nginx
│   ├── nginx/                # nginx.conf + sites
│   ├── postgres/             # init scripts
│   └── scripts/              # deploy, backup, restore, ssl-setup, update
├── storage/
│   ├── uploads/              # فایل‌های آپلودشده
│   └── backups/              # بکاپ‌های دیتابیس
├── docs/                     # مستندات تکمیلی + Postman
├── docker-compose.yml        # Production
├── docker-compose.dev.yml    # Development (hot-reload)
├── .env.example
└── README.md (شما اینجا هستید)
```

---

## 📚 مستندات بیشتر

| فایل | توضیح |
|------|-------|
| [`DEPLOYMENT.md`](./DEPLOYMENT.md) | راهنمای کامل دیپلوی روی VPS اوبونتو |
| [`API_DOCS.md`](./API_DOCS.md) | خلاصه ساختار API + Auth flow + Error codes |
| [`CHANGELOG.md`](./CHANGELOG.md) | تاریخچه نسخه‌ها |
| [`MERGE_LOG.md`](./MERGE_LOG.md) | لاگ تصمیمات ادغام بین ۹ فاز |
| [`QA_REPORT.md`](./QA_REPORT.md) | گزارش QA کامل و رفع باگ‌ها |
| [`DELIVERY_REPORT.md`](./DELIVERY_REPORT.md) | گزارش تحویل برای برنامه‌نویس |
| [`QUICK_START.md`](./QUICK_START.md) | راهنمای ۵ دقیقه‌ای |

---

## 🔧 دستورات مفید

```bash
# دیپلوی production
pnpm deploy:setup

# بکاپ دستی
pnpm deploy:backup

# اعمال schema روی MongoDB (به‌جای migrate در MongoDB از db push استفاده می‌شود)
pnpm --filter @tiktakrun/api exec prisma db push
pnpm seed

# Prisma Studio (GUI دیتابیس)
pnpm prisma:studio

# Build همه
pnpm build

# Dev mode
pnpm dev   # هم api، هم web، هم admin به‌صورت موازی

# Lint و typecheck
pnpm lint
pnpm typecheck

# Logs
docker compose logs -f api
docker compose logs -f web
```

---

## 🐛 Troubleshooting

| مشکل | راه حل |
|------|--------|
| `container restart loop` | `docker compose logs <service>` |
| `DB connection error` | `DATABASE_URL` (MongoDB با `replicaSet=rs0`) در `.env` را چک کنید |
| `Transaction needs replica set` | MongoDB باید به‌صورت replica set اجرا شود (`rs0`) — transactionها بدون آن کار نمی‌کنند |
| `SMS کار نمی‌کند` | `SMS_MOCK_MODE=true` در dev، `SMSIR_API_KEY` در prod |
| `ZarinPal callback fail` | `ZARINPAL_CALLBACK_URL` باید HTTPS باشد |
| `Permission denied uploads` | `chown -R 1001:1001 storage/` |

---

## 🤝 پشتیبانی

برای سوالات و گزارش باگ، با تیم توسعه تماس بگیرید.

---

**ساخته‌شده با ❤️ برای پلتفرم TIK TAK RUN — تجربه‌ای فراتر از یک رزرو ساده.**
