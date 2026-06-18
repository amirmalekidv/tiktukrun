# وضعیت پیشرفت پروژه TIK TAK RUN — تبدیل به MongoDB و تکمیل

> آخرین به‌روزرسانی: مرحله رفع خطاهای TypeScript بک‌اند پس از مهاجرت به MongoDB

## خلاصه کلی

پروژه یک مونوریپو (pnpm + Turborepo) با سه اپ است:
- `apps/api` — NestJS 10 + Prisma 5.22 (کانکتور MongoDB) + Redis + Socket.io
- `apps/web` — Next.js 14 (سایت کاربر) — هنوز در حالت mock
- `apps/admin` — Next.js 14 (داشبورد مدیریت، پورت 3001)

## ✅ کارهای انجام‌شده

1. استخراج و تحلیل پروژه آپلودشده
2. تصمیم استراتژی مهاجرت: Prisma MongoDB connector
3. **تبدیل کامل اسکیمای Prisma از PostgreSQL به MongoDB** (`apps/api/prisma/schema.prisma`) — معتبر، کلاینت تولید شد
   - تمام ID ها: `String @id @default(auto()) @map("_id") @db.ObjectId`
   - `Level.id` به‌صورت `Int @id @map("_id")` باقی ماند
   - BigInt → Int ، Decimal → Float
   - روابط m2m ضمنی → صریح با `String[] @db.ObjectId`
   - روابط self برای MongoDB با `onDelete: NoAction, onUpdate: NoAction`
4. **افزودن enum جدید `GameTier { STANDARD SILVER GOLD PLATINUM DIAMOND }`** + فیلدهای `Game.tier/likesCount/commentsCount`
5. **افزودن مدل‌های `GameLike`, `GameComment`, `GameCommentLike`** به اسکیما
6. افزودن فیلدهای ردیابی `CampaignRecipient` (trackingToken/openedAt/clickedAt/convertedAt + index)
7. به‌روزرسانی `apps/api/.env` به MongoDB (`mongodb://...replicaSet=rs0&directConnection=true`, API_PORT=4010, SMS_MOCK_MODE=true)
8. **رفع خطاهای TypeScript بک‌اند از ۲۴۷ خطا به ۲۳ خطا** (پیشرفت: 247→213→198→155→132→97→64→43→23)

### فایل‌های بک‌اند رفع‌شده (۰ خطا):
- `config/validation.ts` (حذف joi)
- `auth/strategies/jwt.strategy.ts` (sub/sessionId → string)
- `modules/users/users.service.ts`
- `modules/bookings/services/bookings.service.ts`
- `modules/payments/providers/payment-provider.interface.ts` (bigint→number)
- `modules/payments/payments.service.ts` (gatewayAuthority/paidAt)
- `modules/gamification/leveling.service.ts`
- `modules/wheel/wheel.service.ts` (بازنویسی)
- `modules/discounts/services/discounts.service.ts`
- `modules/monthly/monthly.service.ts`
- `modules/analytics/analytics.service.ts`
- `prisma/prisma.service.ts` (stub برای $queryRaw و ...)
- `modules/notifications/notifications.service.ts`
- `modules/gamification/badge.service.ts`
- `modules/campaigns/campaign-executor.ts`
- `modules/campaigns/campaigns.service.ts`
- `modules/chat/chat.service.ts` (room-based: roomId به‌جای roomType)
- `modules/chat/chat.gateway.ts`
- `modules/chat/admin-chat.controller.ts`
- `modules/games/services/games-admin.service.ts` (difficulty enum، tier، حذف thumbnailUrl، totalReviews)
- `modules/games/dto/create-game.dto.ts` (افزودن GameTierEnum + tier)
- `modules/customers/customers.service.ts` (string IDs)
- `modules/segments/segments.service.ts` + `segment-evaluator.ts` (string IDs)
- `modules/tickets/tickets.service.ts` (senderId/body/isStaffReply)
- `modules/users/avatar.service.ts`
- `modules/profile/badge.service.ts`
- `modules/roles/roles.service.ts` (تا حدی)
- `modules/settings/settings.service.ts` (Json→string)
- `modules/top/top.service.ts`
- `modules/wheel/admin-wheel.controller.ts`

## ⏳ ۲۳ خطای TypeScript باقی‌مانده (لیست دقیق برای ادامه)

```
src/modules/auth/auth.service.ts(199,15): Property 'deviceInfo' does not exist  → فیلد deviceInfo روی Session نیست؛ از userAgent/ip یا حذف
src/modules/bookings/services/bookings-admin.service.ts(200,18): 'tomanBalance' does not exist in UserProfileUpdateInput → tomanBalance روی Wallet است نه UserProfile
src/modules/bookings/services/bookings-admin.service.ts(202,16): 'walletTransaction' does not exist → از prisma.transaction استفاده شود
src/modules/bookings/services/bookings-admin.service.ts(255,9): 'userId' در PlayerRatingCreateInput → باید toUserId / fromUserId باشد
src/modules/discounts/services/discount-resolver.service.ts(87,9): 'tomanBalance' در UserProfileSelect → باید از Wallet خوانده شود
src/modules/games/services/games.service.ts(183,62): groupBy circular → cast (this.prisma.booking as any).groupBy
src/modules/games/services/games.service.ts(190,32): '.map' on string → نتیجه groupBy را any کن
src/modules/gamification/admin-badges.controller.ts(129,9): 'rarity' در BadgeCreateInput → Badge فیلد rarity ندارد؛ حذف یا داخل criteria
src/modules/gamification/admin-levels.controller.ts(50,16): Type 'string' not assignable to 'number' → Level.id عددی است؛ Number(id)
src/modules/gamification/admin-levels.controller.ts(51,7): requiredXp bigint → number؛ perks باید Json باشد
src/modules/invites/invites.service.ts(153,34): NotificationType.INVITE وجود ندارد → از SYSTEM/PROMOTION
src/modules/invites/invites.service.ts(156,40): NotificationChannel.IN_APP → INAPP
src/modules/pipeline/pipeline.service.ts(59,9): value bigint → number
src/modules/pipeline/pipeline.service.ts(79,7): Deal update value bigint → number
src/modules/profile/profile.service.ts(55,35): TransactionType.DEBIT وجود ندارد → WITHDRAW
src/modules/profile/profile.service.ts(223,42): TransactionType.DEBIT → WITHDRAW
src/modules/reviews/reviews.service.ts(147,34): 'approvedAt' در ReviewUpdateInput → Review فیلد approvedAt ندارد؛ از isApproved (یا حذف approvedAt)
src/modules/reviews/reviews.service.ts(200,9): 'averageRating' در GameUpdateInput → siteRank/totalReviews/userRankCached
src/modules/roles/admin-roles.controller.ts(56,49): CreateRoleDto نوع permissions ناسازگار → cast as any یا اصلاح DTO
src/modules/roles/admin-roles.controller.ts(66,57): string→number → اصلاح امضای متد (string ID)
src/modules/roles/roles.service.ts(123,47): number→string → امضای متد را string کن
src/modules/settings/settings.controller.ts(18,7): JsonValue→string → از settings.get که string برمی‌گرداند یا coerce
src/modules/teams/teams.service.ts(50,74): 'level' در UserSelect → پروفایل را include کن یا حذف level
```

## ❌ کارهای باقی‌مانده (طبق پرامت اول کاربر)

### بک‌اند
- [ ] رفع ۲۳ خطای باقی‌مانده TypeScript (لیست بالا)
- [ ] ساخت ماژول‌های بک‌اند `GameLike`/`GameComment`/`GameCommentLike` + کنترلر + اندپوینت‌ها (لایک هر بازی، کامنت‌ها)
- [ ] افزودن پشتیبانی tier در سرویس/کنترلر/DTO ادمین بازی‌ها (سطح‌بندی: استاندارد/نقره‌ای/طلایی/پلاتینیوم/دایموند)
- [ ] افزودن دسته‌های `مافیا (mafia)` و `لیزرتگ (lasertag)` به `findBySection` و sectionWhereMap
- [ ] نوشتن اسکریپت seed مخصوص MongoDB (`prisma/seed.ts` فعلی PostgreSQL است): seed دسته‌های mafia/lasertag/cinema-horror/board-game + tier بازی‌ها + داده نمونه

### وب (apps/web) — حذف حالت دمو
- [ ] غیرفعال‌کردن mock mode (`NEXT_PUBLIC_USE_MOCK=false`) و اتصال به API واقعی
- [ ] افزودن UI بخش معرفی/توضیحات + کامنت‌ها + لایک در صفحه جزئیات بازی
- [ ] نمایش tier بازی در UI
- [ ] افزودن دسته‌های mafia + lasertag به ناوبری/فیلترها

### داشبورد ادمین (apps/admin)
- [ ] تکمیل/رفع داشبورد: مدیریت tier، مدیریت/مودریشن کامنت‌ها، آمار لایک‌ها، مدیریت دسته‌ها
- [ ] اطمینان از اتصال کامل به API واقعی

### زیرساخت و استقرار
- [ ] به‌روزرسانی `docker-compose.yml` با MongoDB (replica set / rs0) به‌جای PostgreSQL
- [ ] به‌روزرسانی nginx و فایل‌های env
- [ ] ساخت راهنمای HTML زیبای فارسی استقرار full-stack روی Ubuntu (گام‌به‌گام: بک‌اند، اتصال داشبورد، سرور، دیتابیس، وب‌سوکت)

### تحویل نهایی
- [ ] اجرای typecheck/build نهایی (api + web + admin)
- [ ] بسته‌بندی نهایی به‌صورت zip و تحویل

## نکات فنی کلیدی برای ادامه

- **پول‌ها**: همه از BigInt به Int (number) تبدیل شده‌اند. `serializeBigInts` تقریباً no-op است.
- **موجودی‌ها**: روی `Wallet` هستند: `tomanBalance/coinsBalance/diamondsBalance` (Int). `UserProfile` فقط `xp/levelId/totalSpent/totalBookings` دارد.
- **Transaction**: فیلدها `walletId/type/currency/amount/balanceAfter/refType/refId` — بدون `userId`، بدون `balanceBefore`. `TransactionType` شامل WITHDRAW است (نه DEBIT). `currency` از نوع `CurrencyType`.
- **TransactionType موجود**: DEPOSIT, WITHDRAW, BOOKING_PAYMENT, REFUND, WHEEL_SPEND, WHEEL_WIN, DIAMOND_PURCHASE, ... RATING_REWARD
- **NotificationType موجود**: BOOKING, PAYMENT, LEVEL, BADGE, WHEEL, TEAM, CHAT, SYSTEM, PROMOTION (هیچ INVITE/WARNING/LEVEL_UP نیست)
- **NotificationChannel**: INAPP, SMS, EMAIL (نه IN_APP)
- **Notification**: فیلد `metadata` (نه `data`).
- **Chat**: room-based است. `ChatRoom { type, teamId? }` و `ChatMessage { roomId, ... }`. هیچ roomType/teamId روی ChatMessage نیست. از `ChatService.resolveRoomId(roomType, teamId)` استفاده شده.
- **Game**: فیلدها شامل `difficulty: GameDifficulty (EASY/MEDIUM/HARD/VERY_HARD/LEGENDARY)`, `tier: GameTier`, `pricePerPerson: Int`, `siteRank: Float`, `totalReviews: Int`, `userRankCached: Float?`, `likesCount`, `commentsCount`. هیچ `genre`/`averageRating`/`reviewsCount` ندارد.
- **GameImage**: فقط `url/displayOrder/caption` (نه thumbnailUrl).
- **TicketMessage**: `senderId/body/isStaffReply` (نه userId/text/isStaff). رابطه `sender`.
- **TicketStatus**: OPEN, IN_PROGRESS, WAITING_USER, RESOLVED, CLOSED (نه WAITING_STAFF).
- **Badge**: `criteria` (Json، نه condition)، هیچ `isAutomatic`/`rarity` ندارد. `UserBadge { awardedAt/awardedBy }` — بدون reason.
- **Payment**: `gatewayAuthority/gatewayRefId/paidAt` (نه authority/confirmedAt). status شامل SUCCESS/FAILED.
- **MongoDB createMany**: از `skipDuplicates` پشتیبانی نمی‌کند — حذف شود.
- **MongoDB raw SQL**: پشتیبانی نمی‌شود — از groupBy/aggregate استفاده شود؛ stub های $queryRaw در prisma.service موجودند.
- **MongoDB نیاز به replica set دارد** برای transaction ها: `directConnection=true&replicaSet=rs0`.
- **groupBy با orchestration پیچیده/circular**: delegate را به `any` کست کنید: `(this.prisma.X as any).groupBy(...)`.

## دستورات مفید

```bash
# شمارش خطاها
cd /home/user/webapp/apps/api && npx tsc --noEmit 2>&1 | grep "error TS" | wc -l

# خطاها بر اساس فایل
cd /home/user/webapp/apps/api && npx tsc --noEmit 2>&1 | grep "error TS" | sed -E 's/\(.*//' | sort | uniq -c | sort -rn

# تولید مجدد کلاینت پس از تغییر اسکیما
cd /home/user/webapp/apps/api && npx prisma generate

# اعتبارسنجی اسکیما
cd /home/user/webapp/apps/api && npx prisma validate
```
