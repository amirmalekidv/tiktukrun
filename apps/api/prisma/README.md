# TIK TAK RUN — Database Documentation (فاز ۲)

## 📌 درباره این پوشه

این پوشه شامل کامل‌ترین طراحی دیتابیس پلتفرم **TIK TAK RUN** است:
- **schema.prisma** — مدل کامل ۴۰+ جدول
- **migrations/** — migration اولیه PostgreSQL
- **seed.ts** — داده‌های اولیه و تستی جامع
- **scripts/** — ابزارهای کمکی

---

## 🚀 راه‌اندازی

### پیش‌نیازها

```bash
# PostgreSQL 16
docker run -d \
  --name tiktakrun-db \
  -e POSTGRES_DB=tiktakrun \
  -e POSTGRES_USER=tiktakrun \
  -e POSTGRES_PASSWORD=secret \
  -p 5432:5432 \
  postgres:16-alpine
```

### متغیر محیطی

```env
# apps/api/.env
DATABASE_URL="postgresql://tiktakrun:secret@localhost:5432/tiktakrun?schema=public"
```

### اجرای Migration

```bash
# بعد از clone پروژه:
pnpm --filter @tiktakrun/api prisma migrate deploy

# یا در حالت development:
pnpm --filter @tiktakrun/api prisma migrate dev --name init

# تولید Prisma Client:
pnpm --filter @tiktakrun/api prisma generate
```

### اجرای Seed

```bash
# Seed کامل:
pnpm --filter @tiktakrun/api prisma db seed

# یا مستقیم:
cd apps/api && npx ts-node prisma/seed.ts

# بدون truncate (اضافه کردن به دیتا موجود):
cd apps/api && npx ts-node prisma/seed.ts --skip-truncate
```

### Reset کامل

```bash
cd apps/api && npx ts-node prisma/scripts/reset-and-seed.ts
```

---

## 📊 مدل‌های داده

### ■ کاربران

| مدل | توضیح |
|---|---|
| `User` | کاربر اصلی با mobile/email، invite code، تنظیمات |
| `UserRoleAssignment` | نقش‌های چندگانه RBAC |
| `Profile` | پروفایل گسترده: XP، لول، آمار، بیو |
| `Session` | جلسات کاربری (refresh token) |
| `OtpRequest` | درخواست OTP با IP، expire |

### ■ جغرافیا و بازی‌ها

| مدل | توضیح |
|---|---|
| `City` | ۸ شهر با slug |
| `Branch` | شعبه‌ها با lat/lng و مدیر |
| `Category` | ۷ دسته‌بندی با genre (HORROR/NON_HORROR) |
| `Game` | بازی با قیمت BigInt، fearLevel، tags، images |
| `GameImage` | تصاویر گالری (یک‌به‌چند) |

### ■ مالی

| مدل | توضیح |
|---|---|
| `Wallet` | ۳ موجودی: toman (BigInt)، coins (Int)، diamonds (Int) |
| `Transaction` | همه تراکنش‌ها با type، currency، balanceAfter |
| `Payment` | پرداخت ZarinPal/کیف پول با authority/refId |

### ■ رزرو

| مدل | توضیح |
|---|---|
| `Booking` | رزرو با code یونیک، slot، discount، rewards |
| `GameReview` | نظر ۱-۵ ستاره، یک‌به‌یک با booking |
| `PlayerRating` | امتیاز مدیر به بازیکن (XP change) |

### ■ گیمیفیکیشن

| مدل | توضیح |
|---|---|
| `Level` | ۲۰ لول (BRONZE/SILVER/GOLD/LEGEND) با perks |
| `Badge` | ۱۳ نشان با criteria JSON |
| `UserBadge` | many-to-many user↔badge |
| `AvatarItem` | ۲۵ آیتم آواتار (HAT/GLASSES/SKIN/EFFECT/BACKGROUND) |
| `UserAvatarItem` | آیتم‌های باز شده با isActive |
| `WheelPrize` | ۸ جایزه گردونه با probabilityWeight |
| `WheelSpin` | تاریخچه چرخش |

### ■ سیستم دعوت

| مدل | توضیح |
|---|---|
| `InviteCode` | کد ۸ کاراکتری یونیک هر کاربر |
| `InviteUsage` | استفاده از کد + XP اعطاشده |

### ■ چت و تیم

| مدل | توضیح |
|---|---|
| `ChatRoom` | GLOBAL/TEAM/PRIVATE |
| `ChatMessage` | با reply، soft delete، report count |
| `ChatModerationAction` | WARN/MUTE/BAN/DELETE |
| `Team` | تیم با captain، capacity، slot |
| `TeamMember` | عضویت با role CAPTAIN/MEMBER |

### ■ CRM و بازاریابی

| مدل | توضیح |
|---|---|
| `CustomerSegment` | بخش‌بندی با conditions JSON |
| `Campaign` | کمپین با type، status، آمار conversion |
| `PipelineDeal` | Kanban با stage، position، value |

### ■ تخفیف

| مدل | توضیح |
|---|---|
| `DiscountCode` | کد CITEXT با validity، maxUses |
| `DiscountUsage` | استفاده با savedAmount |
| `AutoDiscount` | قانون خودکار (VIP/WEEKLY/BIRTHDAY/...) |

### ■ پشتیبانی و اعلان

| مدل | توضیح |
|---|---|
| `Ticket` | تیکت با code یونیک، priority، assignee |
| `TicketMessage` | پیام‌های تیکت (user/staff) |
| `Notification` | اعلان InApp/SMS/Email |
| `SmsLog` | لاگ پیامک با template، vars |

### ■ سیستم

| مدل | توضیح |
|---|---|
| `Setting` | key/value JSON با group‌بندی |
| `AuditLog` | لاگ تغییرات ادمین (who, what, before, after) |
| `MonthlyWinner` | برندگان ماهانه (player/team/game) |

---

## 🗺 ERD — Entity Relationship Diagram

```mermaid
erDiagram
    User {
        int id PK
        citext mobile UK
        citext email
        string fullName
        string inviteCode UK
        int invitedById FK
        bool isActive
        bool isBanned
        json settings
    }

    Profile {
        int id PK
        int userId FK UK
        int levelId FK
        int xp
        bigint totalSpent
        decimal fearLevel
    }

    Wallet {
        int id PK
        int userId FK UK
        bigint tomanBalance
        int coinsBalance
        int diamondsBalance
    }

    Level {
        int id PK
        string name
        LevelTier tier
        int requiredXp
        json perks
    }

    City {
        int id PK
        string name
        string slug UK
    }

    Branch {
        int id PK
        string name
        int cityId FK
        int managerId FK
    }

    Category {
        int id PK
        string name
        string slug UK
        GenreFilter genre
    }

    Game {
        int id PK
        string slug UK
        string title
        int categoryId FK
        int branchId FK
        int fearLevel
        bigint pricePerPerson
        decimal siteRank
    }

    GameImage {
        int id PK
        int gameId FK
        string url
    }

    Booking {
        int id PK
        string code UK
        int userId FK
        int gameId FK
        int branchId FK
        datetime slotDateTime
        bigint totalAmount
        BookingStatus status
    }

    Payment {
        int id PK
        int userId FK
        int bookingId FK UK
        bigint amount
        PaymentMethod method
        PaymentStatus status
    }

    Transaction {
        int id PK
        int walletId FK
        TransactionType type
        CurrencyType currency
        bigint amount
    }

    GameReview {
        int id PK
        int bookingId FK UK
        int userId FK
        int gameId FK
        int rating
        bool isApproved
    }

    Badge {
        int id PK
        string code UK
        string name
        json criteria
    }

    UserBadge {
        int userId FK
        int badgeId FK
    }

    AvatarItem {
        int id PK
        string code UK
        AvatarItemType type
        int requiredLevel
        int priceDiamonds
    }

    WheelPrize {
        int id PK
        WheelPrizeType type
        int value
        int probabilityWeight
    }

    Team {
        int id PK
        string name
        int gameId FK
        int captainId FK
        int capacity
        TeamStatus status
    }

    TeamMember {
        int teamId FK
        int userId FK
        TeamMemberRole role
    }

    ChatRoom {
        int id PK
        ChatRoomType type
        int teamId FK
    }

    ChatMessage {
        int id PK
        int roomId FK
        int userId FK
        string text
        ChatMessageStatus status
    }

    Ticket {
        int id PK
        string code UK
        int userId FK
        int assigneeId FK
        TicketPriority priority
        TicketStatus status
    }

    Campaign {
        int id PK
        string name
        CampaignType type
        CampaignStatus status
        int segmentId FK
        bigint revenue
    }

    CustomerSegment {
        int id PK
        string name
        json conditions
    }

    PipelineDeal {
        int id PK
        string name
        bigint value
        PipelineStage stage
        int position
    }

    DiscountCode {
        int id PK
        citext code UK
        DiscountType type
        int value
    }

    Setting {
        citext key PK
        json value
        string group
    }

    AuditLog {
        int id PK
        int actorId FK
        string action
        string entity
    }

    %% Relations
    User ||--o{ Profile : "has one"
    User ||--o{ Wallet : "has one"
    User ||--o{ Booking : "makes"
    User ||--o{ GameReview : "writes"
    User ||--o{ UserBadge : "earns"
    User ||--o{ TeamMember : "joins"
    User ||--o{ ChatMessage : "sends"
    User ||--o{ Ticket : "opens"
    User ||--|| InviteCode : "owns"
    Profile }o--|| Level : "at"
    Wallet ||--o{ Transaction : "has"
    Booking ||--o| GameReview : "has"
    Booking ||--o| Payment : "paid via"
    Game ||--o{ Booking : "reserved"
    Game ||--o{ GameImage : "has"
    Game }o--|| Category : "in"
    Game }o--|| Branch : "at"
    Branch }o--|| City : "in"
    City ||--o{ Branch : "has"
    Team ||--o{ TeamMember : "has"
    Team }o--|| Game : "plays"
    ChatRoom ||--o{ ChatMessage : "contains"
    Campaign }o--o| CustomerSegment : "targets"
```

---

## 🔒 OnDelete Strategy

| Relation | Strategy | توضیح |
|---|---|---|
| User → Profile, Wallet | `CASCADE` | با حذف user، profile و wallet حذف می‌شوند |
| User → Booking, Review | `RESTRICT` | نمی‌توان user با booking را حذف کرد |
| Booking → Payment | `SET NULL` | پرداخت باقی می‌ماند |
| Game → Booking | `RESTRICT` | بازی با رزرو حذف نمی‌شود |
| Branch → Game | `RESTRICT` | شعبه با بازی حذف نمی‌شود |
| Team → TeamMember | `CASCADE` | اعضا با تیم حذف می‌شوند |
| ChatRoom → ChatMessage | `CASCADE` | پیام‌ها با اتاق حذف می‌شوند |

---

## 📌 نکات مهم

1. **BigInt**: همه مبالغ تومانی `BigInt` هستند. در TypeScript باید با `BigInt()` ساخته شوند.
2. **CITEXT**: فیلدهای `mobile`، `email`، کدهای تخفیف case-insensitive هستند.
3. **JSON**: فیلدهای `settings`، `criteria`، `conditions`، `avatarConfig` از نوع JSONB هستند.
4. **Soft Delete**: پیام‌های چت `deletedAt` دارند (نه `DELETE` واقعی).
5. **Timestamps**: همه مدل‌ها `createdAt` دارند. بیشتر آنها `updatedAt` نیز دارند.

---

## 🛠 ابزارهای مفید Prisma

```bash
# باز کردن Prisma Studio (GUI دیتابیس):
pnpm --filter @tiktakrun/api prisma studio

# چک کردن schema:
pnpm --filter @tiktakrun/api prisma validate

# Format کردن schema:
pnpm --filter @tiktakrun/api prisma format

# تولید TypeScript types:
pnpm --filter @tiktakrun/api prisma generate

# نمایش وضعیت migration:
pnpm --filter @tiktakrun/api prisma migrate status
```
