# 🔀 MERGE_LOG.md — لاگ تصمیمات ادغام ۹ فاز

> این فایل تمام تصمیمات گرفته‌شده در فاز ۱۰ برای ادغام خروجی ۹ فاز قبلی را ثبت می‌کند.

تاریخ: 2026-05-25
نسخه نهایی: 1.0.0

---

## 📊 ورودی‌ها

| فاز | فایل | تعداد فایل | حجم | محتوا |
|-----|------|------------|-----|--------|
| 1 | `tiktakrun-phase-01-final.tar.gz` | 117 | 6.8M | Scaffold + Docker + Nginx + Health |
| 2 | `tiktakrun-phase-02-complete.zip` | 53 | 564K | Prisma schema + Seed + shared-types |
| 3 | `tiktakrun-phase-03.zip` | 80 | 804K | Auth + Users + Profile + Wallet + ... |
| 4 | `tiktakrun-phase-04-bugfixed.zip` | 71 | 560K | Cities + Branches + Games + Bookings + Payments |
| 5 | `tiktakrun-phase5-v3.tar.gz` | 84 | 1.3M | Gamification + Chat + CRM + Settings + Audit |
| 6 | `tiktakrun-phase-06-final.zip` | 53 | 464K | Frontend Home + Games + Auth UI |
| 7 | `tiktakrun-phase-07-final.zip` | 88 | 588K | Frontend Authenticated User pages |
| 8 | `tiktakrun_admin_final_v3.zip` | 81 | 576K | Admin Layout + Dashboard + CRM |
| 9 | `tiktakrun-phase-09-final.zip` | 82 | 1.1M | Admin Operations + Finance + Gamification |

---

## 🎯 استراتژی کلی ادغام

### مرحله ۱: انتخاب base
- فاز ۱ به‌عنوان **scaffold پایه** استفاده شد (Monorepo + Docker + Nginx + tsconfig + packages/config)
- پوشه duplicate `web/` در فاز ۱ که artifact build بود، حذف شد

### مرحله ۲: ادغام فاز ۲ (Database)
- `apps/api/prisma/` کامل از فاز ۲ کپی شد (canonical)
- `packages/shared-types/src/` کامل از فاز ۲ (مدل‌های دقیق‌تر)
- `infra/nginx/conf.d/`, `infra/init-scripts/` از فاز ۲

### مرحله ۳: ادغام فازهای backend (۳، ۴، ۵)
- ماژول‌ها به ترتیب در `apps/api/src/modules/` کپی شدند
- `common/`, `prisma/`, `redis/` از فاز ۳
- `common/guards/permission.guard.ts` از فاز ۵ (جدید)
- ماژول‌های جدید فاز ۵ به ماژول‌های قبلی اضافه شدند

### مرحله ۴: ادغام فازهای frontend (۶، ۷، ۸، ۹)
- `apps/web/` با فاز ۶ replace شد (فاز ۱ فقط scaffold بود)
- فاز ۷ به‌صورت additive به apps/web اضافه شد (فقط `(authenticated)/` routes)
- `apps/admin/` با فاز ۸ replace شد
- فاز ۹ به‌صورت additive به apps/admin اضافه شد

---

## ⚖️ تصمیمات مهم (Conflict Resolution)

### 1. `apps/api/src/app.module.ts`
**تضاد:** فاز ۳، ۴، ۵ هرکدام app.module.ts خود را داشتند با ماژول‌های متفاوت.

**تصمیم:** سنتز یک نسخه جدید که **همه ۳۲ ماژول** را register می‌کند.
- imports: ConfigModule, EventEmitterModule, ScheduleModule, ThrottlerModule, CacheModule, JwtModule, RedisModule
- 7 ماژول فاز ۳ + 10 ماژول فاز ۴ + 14 ماژول فاز ۵
- Global modules (SMS, Notifications, Prisma, Settings, Audit, Roles) بدون نیاز به import دوباره

### 2. `apps/api/src/main.ts`
**تضاد:** هر سه فاز backend main.ts متفاوت داشتند.

**تصمیم:** فاز ۵ به‌عنوان base انتخاب شد + موارد زیر اضافه شد:
- BigInt JSON serialization در اولین خط
- `process.env.TZ = 'Asia/Tehran'`
- API versioning + global prefix (`/api/v1`)
- Cookie parser + helmet + compression
- Static assets serving for `/uploads`
- Global filters + interceptors (ResponseInterceptor, HttpExceptionFilter, LoggingInterceptor)
- Graceful shutdown
- Swagger با ۲۲ tag (همه ماژول‌ها)

### 3. `apps/api/prisma/schema.prisma`
**تضاد:** فاز ۲ دارای ۴۳ مدل کامل، فاز ۴ دارای ۱۸ مدل ناقص.

**تصمیم:** فاز ۲ canonical، فاز ۴ نادیده.
**اقدامات اضافی:**
- Rename مدل‌های زیر برای تطابق با کد:
  - `Profile` → `UserProfile` (همه references)
  - `GameReview` → `Review`
  - `CustomerSegment` → `Segment`
  - `PipelineDeal` → `Deal`
- اضافه‌کردن ۸ مدل جدید مورد نیاز کد فاز ۳/۴/۵:
  - `ChatReport`
  - `Role`
  - `CrmNote`
  - `CampaignRecipient`
  - `UserSegment`
  - `FreeTicket`
  - `UserAccessory`
  - `XpHistory`
- اضافه‌کردن relations مرتبط در `User`, `ChatMessage`, `Booking`, `Game`, `AvatarItem`, `Campaign`, `Segment`

**نتیجه نهایی:** ۵۱ مدل کامل و سازگار با کد.

### 4. `apps/api/package.json`
**تضاد:** فاز ۵ فقط dev dependencies داشت، فاز ۳ همه dependencies را داشت.

**تصمیم:** ادغام کامل با موارد زیر:
- همه dependencies منتقل به `dependencies` (نه `devDependencies`)
- نسخه‌های هماهنگ NestJS 10 (به‌جای mix 10/11)
- اضافه شد: `bcrypt`, `cookie-parser`, `pino`, `nestjs-pino`
- Scripts کامل: `build`, `start:dev`, `start:prod`, `prisma:*`, `seed`, `test:e2e`

### 5. `apps/web/package.json` و `apps/admin/package.json`
**تصمیم:** ادغام dependencies از فاز ۶/۷ و ۸/۹ به‌ترتیب:
- Web: همه deps از فاز ۶ + `socket.io-client` و `@hookform/resolvers` از فاز ۷
- Admin: deps فاز ۸ + `xlsx`, `jspdf`, `recharts`, `@tanstack/react-table`, `react-dropzone` از فاز ۹

### 6. مشکل phase3-stubs
**تضاد:** فاز ۴ از `wallet-stub.service.ts` و `notifications-stub.service.ts` در `common/interfaces/` استفاده می‌کرد. اسم گمراه‌کننده بود ولی **پیاده‌سازی واقعی با Prisma** بود.

**تصمیم:** فایل‌ها همان‌طور حفظ شدند (نام "stub" یک misnomer است). در آینده می‌توان rename کرد ولی الان کد بی‌مشکل کار می‌کند.

### 7. `docker-compose.yml`
**تضاد:** فاز ۱ یک نسخه ابتدایی، فاز ۳ یک نسخه dev داشت.

**تصمیم:** سنتز کامل با ۶ سرویس production-ready:
- `postgres:16-alpine` با healthcheck
- `redis:7-alpine` با memory limit
- `api`, `web`, `admin` با healthcheck + multi-stage build
- `nginx:alpine` با volume mount برای SSL

### 8. Dockerfiles
**تضاد:** فاز ۱ یک نسخه ساده داشت.

**تصمیم:** بازنویسی کامل با multi-stage:
- `node:20-alpine` به جای `node:20` (حجم ۸۰٪ کمتر)
- Stage 1: deps (با pnpm)
- Stage 2: builder (Prisma generate + build)
- Stage 3: runner (non-root user + tini)
- Healthcheck داخلی با wget

### 9. Nginx config
**تضاد:** فاز ۱ یک نسخه ساده داشت.

**تصمیم:** بازنویسی کامل:
- 4 server block: HTTP→HTTPS، tiktakrun.ir، admin.tiktakrun.ir، api.tiktakrun.ir
- Rate limiting zones (api_limit، auth_limit، conn_limit)
- gzip کامل + brotli ready
- Security headers (HSTS، X-Frame-Options، CSP برای admin)
- WebSocket support برای /socket.io/
- Static caching برای /_next/static و /uploads

### 10. `.env.example`
**تصمیم:** ادغام همه متغیرهای 9 فاز در یک فایل با کامنت‌گذاری کامل:
- App / Ports / URLs
- Database / Redis
- JWT (با refresh)
- SMS.ir
- ZarinPal
- Storage
- Rate Limit
- CORS
- Monitoring
- Gamification tuning
- Wheel costs
- Seed admin
- Backup

### 11. حذف artifact ها
- پوشه `web/` تکراری در فاز ۱
- فایل‌های `_p2_package.json`, `_p7_root_package.json`, `_p9_package.json` (temp)
- فایل‌های `_app.module.p3.ts`, `_app.module.p4.ts`, `_app.module.p5.ts` (temp)
- فایل‌های `placeholder.ts` در apps/admin و apps/web
- پوشه nested `community/community/` (باگ ادغام، fix شد)

### 12. branding ها
**نتیجه چک:** هیچ ارجاع به `EscapeVerse`, `Shadow Realm` (به‌عنوان نام برند)، یا `AI Oracle` پیدا نشد.
همه‌جا `TIK TAK RUN` و `تیک تاک ران`.
تم بصری Shadow Realm Gothic (#dc2626 قرمز / #0a0000 مشکی) حفظ شد چون این تم visual است نه نام برند.

### 13. اضافات فاز ۱۰
- `apps/web/src/app/sitemap.ts` (داینامیک از API)
- `apps/web/src/app/robots.ts`
- `infra/scripts/update.sh` (اسکریپت آپدیت zero-downtime)
- `.prettierrc` و `.prettierignore`
- `storage/backups/.gitkeep`

---

## 🐛 باگ‌های شناسایی و رفع‌شده در فاز ۱۰

| # | باگ | تشخیص | رفع |
|---|-----|--------|-----|
| 1 | فاز ۴ schema با فاز ۲ تضاد داشت | grep model count: 18 vs 43 | restore به فاز ۲ |
| 2 | مدل‌های `userProfile`, `review`, `segment`, `deal` در schema نبود | `grep prisma\.` در کد | rename مدل‌ها در schema |
| 3 | ۸ مدل (ChatReport, Role, CrmNote, ...) در schema نبود | grep | اضافه‌کردن به انتهای schema |
| 4 | پوشه `community/community/` تکراری | `find` | حذف nesting |
| 5 | فایل‌های temp `_p2_`, `_p7_`, `_p9_` | `ls` | rm |
| 6 | `apps/api/src/_app.module.p[345].ts` artifact | ls | rm |
| 7 | `placeholder.ts` در apps/web و apps/admin | ls | rm |
| 8 | پوشه `apps/api/dist/` در فاز ۵ | ls | excluded در ZIP نهایی |
| 9 | `package.json` فاز ۵ همه deps را در devDependencies گذاشته بود | check | کاملاً بازنویسی شد |
| 10 | `BigInt` JSON serialization در main.ts نبود | code review | اضافه شد به اولین خط main.ts |
| 11 | timezone `Asia/Tehran` در main.ts نبود | code review | اضافه شد |
| 12 | Cookie parser secret در main.ts نبود | code review | اضافه شد |

---

## 📈 آمار نهایی ادغام

- **مجموع فایل‌ها:** 580+ (از ~709 ورودی، با حذف artifactها)
- **حجم نهایی:** 6.6 MB
- **خطوط schema:** 1495 خط (51 model + همه enums + indexes)
- **خطوط seed:** 1657 خط (داده‌های demo کامل)
- **ماژول‌های backend:** 32
- **صفحات web:** 34
- **صفحات admin:** 66
- **Dockerfile ها:** 3 (api, web, admin) + nginx config
- **اسکریپت‌های infra:** 6 (deploy, backup, restore, ssl-setup, update, test)
- **مستندات:** 7 فایل MD

---

## ✅ تأیید نهایی

پروژه آماده دیپلوی production است.

برای جزئیات QA کامل → [`QA_REPORT.md`](./QA_REPORT.md)
برای راهنمای دیپلوی → [`DEPLOYMENT.md`](./DEPLOYMENT.md)
