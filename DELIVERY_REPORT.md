# 📦 DELIVERY_REPORT.md — گزارش تحویل پروژه TIK TAK RUN

> این فایل خلاصه کامل آنچه ساخته شده و آنچه برنامه‌نویس و کارفرما باید انجام دهند.

نسخه تحویل: **1.1.0**
تاریخ تحویل: **2026-06-18**
وضعیت: ✅ **آماده دیپلوی** — مهاجرت کامل به MongoDB + حذف کامل حالت دمو

---

## 📋 فهرست

1. [خلاصه پروژه](#1-خلاصه-پروژه)
2. [آنچه ساخته شده](#2-آنچه-ساخته-شده)
3. [وظایف برنامه‌نویس (روی VPS)](#3-وظایف-برنامه-نویس-روی-vps)
4. [وظایف کارفرما (در داشبورد)](#4-وظایف-کارفرما-در-داشبورد)
5. [Login پیش‌فرض](#5-login-پیش-فرض)
6. [پشتیبانی](#6-پشتیبانی)

---

## 1. خلاصه پروژه

**TIK TAK RUN** یک پلتفرم فارسی RTL برای رزرو آنلاین سرگرمی‌های هیجانی (اتاق فرار، سینما ترس، لیزرتگ، پینت‌بال، VR، بردگیم، ...) است.

پروژه شامل ۳ بخش است:
- **سایت اصلی** (port 3000): برای کاربران نهایی
- **داشبورد ادمین** (port 3001): برای مدیریت
- **API** (port 4000): NestJS + Prisma + **MongoDB** + Redis + Socket.io

تم بصری: **Shadow Realm Gothic** (قرمز خونی روی مشکی). برندینگ: **TIK TAK RUN**.

---

## 1.1 تغییرات نسخه 1.1.0 (مهاجرت MongoDB + حذف دمو)

این نسخه شامل دو کار بزرگ است:

### 🗄️ مهاجرت دیتابیس از PostgreSQL به MongoDB
- **schema.prisma**: provider به `mongodb` تغییر کرد.
- **Analytics** (`analytics.service.ts`): همه ۶ بلوک `$queryRaw` (که SQL خام Postgres بودند و در MongoDB کار نمی‌کنند) به Prisma `findMany/groupBy/aggregate` + تجمیع در JavaScript بازنویسی شدند — شامل: `revenueTrend`، `categoryBreakdown`، `cohort`، `heatmap`، `games`، `cashflow`. Heatmap با offset تهران (`+3:30`) محاسبه می‌شود.
- **Backup** (`backup.service.ts`): از `pg_dump | gzip` به **`mongodump --archive --gzip`** تغییر کرد؛ فایل خروجی `backup-<timestamp>.archive.gz`؛ restore با `mongorestore --gzip --archive`.
- **Transactions**: نیازمند MongoDB به‌صورت **replica set** (`rs0`). نمونه‌ی `DATABASE_URL`:
  `mongodb://localhost:27017/tiktakrun?replicaSet=rs0&directConnection=true`
- اعمال schema با `prisma db push` (در MongoDB از migrate استفاده نمی‌شود).

### 🚫 حذف کامل حالت دمو/Mock از پنل ادمین
- `USE_MOCK = false` به‌صورت سخت در `apps/admin/src/lib/mock-admin-api.ts`.
- همه صفحات به API واقعی متصل شدند: NotificationsPanel، games/[id] و زیرصفحه‌های images/reviews، chats/reported و ...
- **رزرو دستی ادمین**: endpoint جدید `POST /admin/bookings` (با `AdminCreateBookingDto`؛ رزرو CONFIRMED + پرداخت SUCCESS؛ محدود به شعبه برای branch-manager) و فرم واقعی رزرو در `bookings/new` (جست‌وجوی مشتری، انتخاب بازی/اسلات/تعداد بازیکن/روش پرداخت).

### ✅ وضعیت کیفیت
- **TypeCheck**: API 0 خطا · ADMIN 0 خطا · WEB 0 خطا (۰/۰/۰).
- **Build**: `nest build` (API) و `next build` (ADMIN) هر دو موفق.

---

## 2. آنچه ساخته شده

### ✅ Backend (apps/api)
- 32 ماژول NestJS
- 51 مدل Prisma با indexها و relations کامل
- 1657 خط seed داده دمو
- JWT با refresh rotation
- OTP system با rate limiting
- ZarinPal payment
- SMS.ir + Mock provider
- Socket.io برای real-time
- Cron jobs (booking timeout، monthly rewards، ...)
- Swagger در `/api/v1/docs`
- BigInt serialization
- Asia/Tehran timezone
- Helmet + Compression + CORS
- RBAC با Roles + Permissions matrix
- Audit log

### ✅ Frontend Site (apps/web)
- 34 صفحه با Next.js 14 App Router
- صفحه اصلی + Games (List/Detail) + Booking 4-step
- Auth با OTP + invite
- داشبورد کاربر کامل:
  - Profile + Avatar Customizer
  - Wallet (تومان/سکه/الماس) + شارژ + تبدیل + تاریخچه
  - Wheel of Fortune (3 روش)
  - Bookings (لیست + لغو + نظر)
  - Leaderboard
  - Community (Teams + Live Chat)
  - Invites
  - Notifications
  - Tickets
  - Settings
- Sitemap + robots داینامیک
- RTL کامل، فارسی، تاریخ شمسی، تومان فارسی

### ✅ Admin Dashboard (apps/admin)
- 66 صفحه با Next.js 14
- Dashboard Overview با KPIs + Real-time
- CRM کامل (Customers/Segments/Pipeline/Campaigns/Activities)
- Operations (Bookings/Games/Branches/Reviews/Chats/Tickets)
- Finance (Transactions/Payments/Reports x4)
- Gamification (Wheel/Badges/Levels/Avatars/Discounts/Monthly)
- 8 صفحه Settings
- RBAC (Roles/Staff/Audit/Backup)
- Export Excel/PDF/CSV

### ✅ Infrastructure
- Docker Compose با 6 سرویس
- Multi-stage Dockerfiles (node:20-alpine)
- Nginx + Let's Encrypt + WebSocket
- 6 اسکریپت infra (deploy/backup/restore/ssl/update/test)
- Healthchecks
- Cron برای بکاپ روزانه

### ✅ Docs
- 7 فایل MD کامل (README, DEPLOYMENT, API_DOCS, CHANGELOG, MERGE_LOG, QA_REPORT, این فایل)
- QUICK_START.md جداگانه
- Postman collections در `docs/postman/`

---

## 3. وظایف برنامه‌نویس (روی VPS)

### مرحله ۱: آماده‌سازی VPS (یک‌بار، ۱۵ دقیقه)
```bash
ssh root@<SERVER_IP>
apt update && apt upgrade -y
apt install -y docker.io docker-compose-v2 git curl certbot ufw fail2ban
ufw allow 22,80,443/tcp && ufw enable
timedatectl set-timezone Asia/Tehran
adduser tiktakrun && usermod -aG docker tiktakrun
```

### مرحله ۲: دانلود و تنظیم پروژه (۵ دقیقه)
```bash
su - tiktakrun
cd ~
# (a) از Git:
git clone <REPO_URL> tiktakrun
# (b) یا از ZIP:
# unzip ~/tiktakrun-FINAL-v1.0.0.zip
cd tiktakrun

cp .env.example .env
nano .env  # ⚠️ تنظیم متغیرها → مرحله بعد
```

### مرحله ۳: ⚠️ متغیرهای الزامی در `.env`
```env
# Domain
PROD_DOMAIN=tiktakrun.ir   # دامنه واقعی شما

# Database - MongoDB (به‌صورت replica set برای transactionها)
# در production معمولاً با احراز هویت: mongodb://<user>:<pass>@mongo:27017/tiktakrun?replicaSet=rs0&authSource=admin
DATABASE_URL=mongodb://localhost:27017/tiktakrun?replicaSet=rs0&directConnection=true

# JWT - با openssl rand -base64 48
JWT_SECRET=<...>
JWT_REFRESH_SECRET=<...>
COOKIE_SECRET=<openssl rand -base64 32>

# URLs (با دامنه واقعی)
WEB_URL=https://tiktakrun.ir
ADMIN_URL=https://admin.tiktakrun.ir
NEXT_PUBLIC_API_URL=https://api.tiktakrun.ir/api/v1
NEXT_PUBLIC_SOCKET_URL=wss://api.tiktakrun.ir

# SMS.ir (از پنل SMS.ir)
SMS_MOCK_MODE=false
SMSIR_API_KEY=<از sms.ir>
SMSIR_LINE_NUMBER=<شماره خط شما>
SMSIR_TEMPLATE_ID_OTP=<شناسه الگوی OTP>

# ZarinPal (از پنل zarinpal.com)
ZARINPAL_SANDBOX=false
ZARINPAL_MERCHANT_ID=<شناسه 36 کاراکتری>
ZARINPAL_CALLBACK_URL=https://tiktakrun.ir/api/v1/payments/verify
```

### مرحله ۴: DNS (در پنل دامنه)
```
tiktakrun.ir         A    <SERVER_IP>
www.tiktakrun.ir     A    <SERVER_IP>
admin.tiktakrun.ir   A    <SERVER_IP>
api.tiktakrun.ir     A    <SERVER_IP>
```

### مرحله ۵: دیپلوی (۱۰ دقیقه)
```bash
docker compose build --pull
docker compose up -d
sleep 30
docker compose exec api npx prisma db push   # MongoDB: db push به‌جای migrate
docker compose exec api pnpm seed
```

### مرحله ۶: SSL (۲ دقیقه)
```bash
sudo bash infra/scripts/ssl-setup.sh tiktakrun.ir admin@tiktakrun.ir
```

### مرحله ۷: بکاپ خودکار (۱ دقیقه)
```bash
crontab -e
```
اضافه کنید:
```
0 3 * * * cd /home/tiktakrun/tiktakrun && bash infra/scripts/backup.sh
```

### مرحله ۸: تست نهایی
```bash
curl https://tiktakrun.ir
curl https://admin.tiktakrun.ir
curl https://api.tiktakrun.ir/health
curl https://api.tiktakrun.ir/api/v1/docs
```

✅ **در همین جا کار برنامه‌نویس تمام است!**

برای جزئیات بیشتر → [`DEPLOYMENT.md`](./DEPLOYMENT.md)

---

## 4. وظایف کارفرما (در داشبورد ادمین)

پس از deploy موفق، کارفرما باید این کارها را در داشبورد انجام دهد:

### مرحله ۱: ورود + امنیت
- [ ] برو به `https://admin.tiktakrun.ir`
- [ ] login با حساب SuperAdmin (`09120000001` + پسورد در `.env`)
- [ ] **حتماً پسورد را تغییر بده** (Settings → Security)

### مرحله ۲: Branding
- [ ] Settings → General:
  - نام برند
  - شعار
  - آدرس دفتر مرکزی
  - شماره تماس
- [ ] Settings → Theme:
  - آپلود لوگو (PNG شفاف، 200x60)
  - آپلود favicon (32x32)
  - رنگ‌های اصلی (اگر می‌خواهید تغییر دهید)

### مرحله ۳: داده‌های پایه
- [ ] Cities: شهرهای فعال را تأیید/اضافه کنید (تهران، کرج، اصفهان، ...)
- [ ] Branches: شعب واقعی را اضافه کنید با آدرس و موقعیت
- [ ] Categories: دسته‌بندی‌ها را تأیید کنید (اتاق فرار، سینما ترس، لیزرتگ، ...)
- [ ] Games: بازی‌های واقعی خود را اضافه کنید با:
  - عکس کاور + گالری (3-5 عکس)
  - تیزر ویدئویی (اختیاری)
  - توضیحات و سناریو
  - قیمت پایه
  - مدت زمان
  - تعداد بازیکن (min/max)
  - سطح ترس (1-10)

### مرحله ۴: تنظیمات مالی
- [ ] Settings → Financial:
  - مالیات (٪) 
  - حداقل/حداکثر شارژ کیف
  - نرخ تبدیل سکه ↔ تومان
- [ ] Settings → Payments:
  - بررسی `ZarinPal Merchant ID` (از .env آمده)
  - تست پرداخت با مبلغ ۱۰۰۰ تومان

### مرحله ۵: SMS و اطلاع‌رسانی
- [ ] Settings → SMS:
  - تست ارسال OTP به شماره خود
  - تست ارسال notification template
- [ ] اگر OTP نرسد: چک کنید `SMSIR_API_KEY` و `SMS_MOCK_MODE=false`

### مرحله ۶: گیمیفیکیشن
- [ ] Settings → Gamification:
  - تنظیم XP per booking/review/invite
  - تنظیم COINS_PER_LEVEL_UP
- [ ] Wheel → Prizes: تنظیم جوایز گردونه
- [ ] Badges: تأیید/اضافه‌کردن بج‌ها
- [ ] Levels: ۲۰ سطح را بررسی کنید

### مرحله ۷: امنیت و دسترسی
- [ ] Roles: نقش‌ها را بررسی کنید (یا کاستوم کنید)
- [ ] Staff: کارمندان را اضافه کنید با نقش مناسب
- [ ] Audit Log: روی روال بازرسی فعال‌سازی شود

### مرحله ۸: محتوای صفحات
- [ ] درباره ما / تماس / FAQ را در فایل `apps/web/src/app/about/page.tsx` و `contact/page.tsx` ویرایش کنید (یا با شماره با تیم توسعه)

---

## 5. Login پیش‌فرض

| نقش | موبایل | پسورد | توضیح |
|-----|--------|-------|--------|
| **Super Admin** | `09120000001` | از `SEED_SUPERADMIN_PASSWORD` در `.env` | حتماً تغییر دهید! |
| **Branch Manager** | `09120000002` | `Manager@123` | تست branch manager |
| **Customer Demo** | `09121111111` | OTP | با کد ۵ رقمی |

**⚠️ هشدار:** Login های پیش‌فرض فقط برای dev/staging هستند. در production:
1. پسورد Super Admin را در همان login اول تغییر دهید
2. کاربران تست (Branch Manager, Customer Demo) را غیرفعال یا حذف کنید

---

## 6. پشتیبانی

### مشکلات تکنیکی
- اول [`QA_REPORT.md`](./QA_REPORT.md) را ببینید
- سپس [`DEPLOYMENT.md`](./DEPLOYMENT.md) → بخش Troubleshooting
- اگر باز هم مشکل بود → تماس با تیم توسعه

### مستندات
- [`README.md`](./README.md) — معرفی پروژه
- [`API_DOCS.md`](./API_DOCS.md) — REST + WebSocket
- [`DEPLOYMENT.md`](./DEPLOYMENT.md) — دیپلوی VPS
- [`CHANGELOG.md`](./CHANGELOG.md) — تاریخچه نسخه‌ها
- [`MERGE_LOG.md`](./MERGE_LOG.md) — تصمیمات ادغام
- [`QA_REPORT.md`](./QA_REPORT.md) — گزارش QA کامل
- [`QUICK_START.md`](./QUICK_START.md) — راهنمای ۵ دقیقه‌ای

### تماس
**تیم توسعه:** [اطلاعات تماس واقعی را اینجا قرار دهید]
- ایمیل: dev@tiktakrun.ir
- تلگرام: @tiktakrun_dev
- وب: https://tiktakrun.ir

---

## ✅ تأییدیه تحویل

**این پروژه با همه ویژگی‌های مورد توافق کارفرما تحویل داده می‌شود:**
- ✅ پلتفرم رزرو سرگرمی فارسی RTL
- ✅ سایت اصلی + داشبورد ادمین
- ✅ تم Shadow Realm Gothic
- ✅ لوگو TIK TAK RUN در همه‌جا
- ✅ AI Oracle حذف شده (طبق درخواست)
- ✅ ۲۰ سطح + Bronze/Silver/Gold/Legend
- ✅ کیف پول سه‌گانه (تومان/سکه/الماس)
- ✅ گردونه با ۳ روش
- ✅ چت زنده + تیم‌سازی
- ✅ کد دعوت +5 XP
- ✅ فیلتر شهر/ژانر/دسته
- ✅ ادمین کامل با ۶۶ صفحه
- ✅ دیپلوی Docker آماده
- ✅ مستندات کامل

---

**موفق باشید! 🎮🚀**

با احترام،
تیم توسعه TIK TAK RUN
