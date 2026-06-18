# 📝 Changelog

همه تغییرات این پروژه در این فایل ثبت می‌شود.

قالب: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)

---

## [1.0.0] — 2026-05-25 — Initial Release 🎉

### ✨ ویژگی‌های اصلی

#### 🌐 سایت اصلی (apps/web)
- صفحه اصلی با Hero، فیلتر شهر/ژانر/دسته، بازی‌های هفته، بهترین بازیکنان، Stories
- صفحه لیست بازی‌ها با sidebar filter
- صفحه جزئیات بازی با gallery، تیزر، نظرات، booking widget
- جریان رزرو ۴ مرحله‌ای با کد تخفیف
- ورود OTP (SMS) + invite code
- داشبورد کاربر:
  - پروفایل + Avatar Customizer
  - کیف پول (تومان + سکه + الماس) + شارژ ZarinPal + تبدیل
  - گردونه شانس با ۳ روش (XP/سکه/الماس)
  - تاریخچه رزروها + لغو + ثبت نظر
  - Leaderboard هفتگی/ماهانه
  - Community: تیم‌سازی + چت زنده (Socket.io)
  - سیستم دعوت (+5 XP)
  - اعلان‌ها (Bell + Dropdown + Page)
  - تیکت‌های پشتیبانی
  - تنظیمات
- صفحات public: درباره ما، تماس، Section
- RTL کامل، تم Shadow Realm Gothic
- اعداد فارسی + تاریخ شمسی + تومان با کاما فارسی
- Sitemap و robots.txt داینامیک
- Meta tags + Open Graph + Twitter Card

#### 👨‍💼 داشبورد ادمین (apps/admin)
- Layout دو ستونه (Sidebar + Topbar) با تم تاریک
- Login مخصوص ادمین
- Dashboard Overview: KPI cards با sparkline، Revenue chart، Category pie، Live Activities (real-time)، Recent Bookings، Top Customers، Quick Actions
- CRM: Customers، Segments، Pipeline Kanban، Campaigns، Activities
- Operations: Bookings (List + Calendar)، Games (CRUD + Images + Stats)، Branches، Cities، Categories، Reviews، Chats، Tickets
- Finance: Transactions، Payments، Reports (Financial/Games/Cohort/Heatmap)
- Gamification: Wheel، Badges، Levels، Avatars، Discounts، Monthly winners
- Settings (8 صفحه): General، Financial، Chat، Security، Gamification، Payments، SMS، Theme
- RBAC: Roles + permissions matrix، Staff، Audit Log، Backup
- Export Excel/PDF/CSV
- Real-time updates با Socket.io

#### ⚙️ بک‌اند (apps/api)
- 32 ماژول NestJS
- 51 Prisma model با indexها و relations کامل
- JWT با refresh rotation
- OTP system با rate limiting Redis-backed
- ZarinPal payment integration (sandbox + production)
- SMS.ir + Mock provider
- File upload با Sharp resize + MIME validation
- Socket.io Gateway برای chat + notifications + live activities
- Cron jobs (booking timeout، auto-complete، monthly rewards)
- Helmet + Compression + CORS configurable
- Swagger UI کامل در /api/v1/docs
- BigInt serialization برای فیلدهای پولی
- Asia/Tehran timezone
- Pino structured logging

#### 🏗 زیرساخت (infra)
- Docker Compose با 6 سرویس: postgres، redis، api، web، admin، nginx
- Multi-stage Dockerfiles با Next.js standalone output
- Nginx با SSL، gzip، rate limiting، WebSocket support، security headers
- Let's Encrypt با auto-renewal cron
- بکاپ روزانه (DB + uploads) با retention 14 روز
- Restore script
- Update script
- Healthcheck برای همه containerها
- Init scripts برای Postgres extensions (citext, pgcrypto)

#### 📦 Monorepo
- pnpm workspaces
- Turborepo برای parallel builds
- Shared types package
- Shared UI package
- Shared config packages

### 🔒 امنیت
- Helmet headers (CSP, X-Frame-Options, HSTS, ...)
- CORS با whitelist
- Rate limiting (Throttler + Nginx)
- Auth endpoints با rate stricter
- Input validation با class-validator
- SQL injection guard (Prisma)
- XSS protection
- File upload validation
- Cookie signing
- .env خارج از git

### ⚡ Performance
- Next.js standalone output
- Redis caching برای leaderboard، top، analytics
- Database indexing کامل
- Code splitting و dynamic imports
- Image optimization با Sharp + next/image
- Nginx gzip + static caching

### 📚 مستندات
- README.md جامع
- DEPLOYMENT.md (راهنمای VPS Ubuntu)
- API_DOCS.md (REST + WebSocket)
- MERGE_LOG.md (لاگ ادغام فازها)
- QA_REPORT.md (لیست QA + رفع)
- DELIVERY_REPORT.md (گزارش تحویل)
- QUICK_START.md (راهنمای 5 دقیقه‌ای)

---

## ساخت این Release

این release از ادغام 10 فاز توسعه ساخته شده است:

| فاز | محتوا |
|-----|--------|
| 1 | Monorepo scaffold + Docker + Nginx + Health |
| 2 | Database Schema + Prisma + Seed (1657 خط) |
| 3 | Auth + Users + Profile + Wallet + Invites + Notifications + SMS |
| 4 | Cities + Branches + Categories + Games + Bookings + Reviews + Discounts + Payments + Top + Weekly |
| 5 | Gamification + Wheel + Chat + Teams + Tickets + Customers + Segments + Pipeline + Campaigns + Settings + Roles + Monthly + Audit + Backup + Analytics |
| 6 | Frontend Home + Games + Booking + Auth UI |
| 7 | Frontend Authenticated User pages |
| 8 | Admin Layout + Dashboard + CRM |
| 9 | Admin Operations + Finance + Gamification + Settings |
| 10 | Final Merge + QA + Optimization + Production Package |
