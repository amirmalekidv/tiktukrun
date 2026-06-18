# TIK TAK RUN — Phase 5: Backend Secondary Modules

## ✅ ماژول‌های پیاده‌سازی‌شده

### 1. `gamification/` — گیمیفیکیشن
- **LevelingService**: `applyXp(userId, delta, reason)` — atomic XP + levelUp chain + accessories unlock + Socket emit
- **BadgeService**: `checkAndGrantAutoBadges(userId, event)` + `grantManual()` — 12+ badge types
- Controllers: Public `GET /api/v1/levels`, `GET /api/v1/badges` + Admin CRUD

### 2. `wheel/` — گردونه شانس
- **WheelService**: Weighted random, منابع XP/COINS/DIAMONDS، اعطای TICKET/CASH/DISCOUNT
- Endpoints: `GET /prizes`, `GET /me/eligibility`, `POST /spin`
- Admin: CRUD prizes + toggle-active + spins history + stats

### 3. `chat/` + `teams/` — چت زنده و تیم‌بندی
- **ChatGateway (Socket.io)**: namespace `/chat`, JWT auth, `joinRoom/leaveRoom/message/typing/report/presence`
- Rate limit server-side، ban/mute check، emit `newMessage/messageHidden/messageDeleted/userMuted/userKicked`
- **TeamsService**: Create/join/leave/kick/delete + auto FULL status + notification
- Admin moderation: hide/delete message + mute/warn user + AuditLog

### 4. `tickets/` — پشتیبانی
- کد TKT-XXXXXX، CRUD user + admin، reply (user/staff)، stats با avgResponseTime

### 5. `settings/` — تنظیمات سیستم (@Global)
- 30+ default setting در ۸ گروه، Redis-like in-memory cache
- `GET /settings/public` (public.*) + Admin CRUD + bulk update + AuditLog

### 6. `audit/` — لاگ حسابرسی (@Global)
- `AuditService.log()` در همه ماژول‌های حساس
- Decorator `@Audit('entity.action')` + `AuditInterceptor`
- Admin: paginated filter by actor/action/entity/dateRange

### 7. `customers/` — CRM مشتریان
- لیست پیشرفته با فیلتر LTV/segment/level، computed status (NEW/ACTIVE/VIP/PLATINUM)
- جزئیات کامل + یادداشت CRM + top-LTV + export CSV

### 8. `segments/` — سگمنت‌بندی
- **SegmentEvaluator**: rule-based (`ltv >= X`, `level >= Y`, `lastBookingDays > Z`, category `in [...]`, ...)
- Cron daily 3:00 AM Tehran: recompute all segments
- Admin CRUD + manual recompute + members list

### 9. `pipeline/` — Sales Pipeline Kanban
- 6 stage: LEAD → QUALIFIED → PROPOSAL → NEGOTIATION → CLOSED_WON/LOST
- PATCH `/:id/move` — drag-drop با position reorder
- Stats: totalValue, byStage breakdown, conversionRate

### 10. `campaigns/` — کمپین‌های بازاریابی
- **CampaignExecutor**: SMS/INAPP/PUSH/EMAIL، template variables، tracking token
- `trackClick`, `trackOpen`, `trackConversion` (7 days post-click booking)
- Admin: create/update/start/pause/test + recipients + KPI stats

### 11. `roles/` — نقش‌ها و دسترسی‌ها (@Global)
- 24 hard-coded permissions، 5 built-in roles (SUPER_ADMIN/ADMIN/SUPPORT/MARKETING/BRANCH_MANAGER)
- **PermissionGuard** + `@RequirePermission('bookings.write')`
- Admin: CRUD custom roles + assign multiple roles to user

### 12. `monthly/` — جوایز ماهانه
- Cron `0 9 1 * *` Asia/Tehran: auto-compute + auto-distribute
- compute(): top player by XP, top team by bookings, top game by revenue (raw SQL)
- distribute(): XP + coins + freeTicket + discountCode + notifications

### 13. `backup/` — پشتیبان‌گیری
- `pg_dump | gzip` با spawn + 30min timeout + همزمانی lock
- list/download/delete با path traversal protection

### 14. `analytics/` — آنالیتیکس با Redis Cache (TTL 5min)
- overview, financial (CAC/CLV/churn/NPS), cohort, heatmap, games, cashflow, payment-methods, gamification

### 15. `app.module.ts` + `main.ts`
- Socket.io IoAdapter، Swagger با ۲۴ tag، CORS، Helmet، Compression

---

## 📁 ساختار فایل‌ها

```
apps/api/src/
├── main.ts                         # Bootstrap + Socket.io + Swagger
├── app.module.ts                   # Registration همه ماژول‌های فاز ۵
├── prisma/prisma.service.ts        # Stub (Phase 2)
├── common/
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   └── roles.decorator.ts
│   └── guards/
│       ├── jwt-auth.guard.ts
│       ├── roles.guard.ts
│       └── permission.guard.ts     # @RequirePermission
├── modules/
│   ├── gamification/               # Levels + Badges
│   ├── wheel/                      # گردونه شانس
│   ├── chat/                       # Chat Gateway + REST + Admin
│   ├── teams/                      # تیم‌بندی
│   ├── tickets/                    # پشتیبانی
│   ├── customers/                  # CRM
│   ├── segments/                   # SegmentEvaluator + Cron
│   ├── pipeline/                   # Kanban Deals
│   ├── campaigns/                  # CampaignExecutor
│   ├── settings/                   # @Global تنظیمات
│   ├── roles/                      # @Global نقش‌ها
│   ├── audit/                      # @Global لاگ
│   ├── monthly/                    # Cron ماهانه
│   ├── backup/                     # pg_dump
│   ├── analytics/                  # Redis cached KPIs
│   ├── notifications/              # Stub (Phase 3)
│   └── sms/                        # Stub (Phase 3)
apps/api/test/
├── wheel.e2e-spec.ts
├── chat.socket.e2e-spec.ts         # Socket.io-client inline
├── tickets.e2e-spec.ts
└── campaigns.e2e-spec.ts
docs/
├── postman-collection.json         # کامل ۱۰۰+ endpoint
└── PHASE5-README.md
```

---

## ⚙️ وابستگی‌های npm جدید فاز ۵
```
@nestjs/websockets @nestjs/platform-socket.io socket.io
@nestjs/schedule @nestjs/event-emitter @nestjs/throttler
@nestjs-modules/ioredis ioredis
socket.io-client (devDep for tests)
```

---

## 🔗 یادداشت‌های ادغام
- همه ماژول‌های Phase 5 در `app.module.ts` ثبت شده‌اند
- `SettingsModule`, `AuditModule`, `RolesModule` با `@Global()` مشخص شده‌اند
- `PrismaService`, `NotificationsService`, `SmsService` از Phase 2/3 inject می‌شوند
- Socket.io IoAdapter در `main.ts` ثبت شده
- Prisma schema additions مورد نیاز: `WheelPrize`, `WheelSpin`, `ChatMessage`, `ChatReport`, `Team`, `TeamMember`, `Ticket`, `TicketMessage`, `Deal`, `Campaign`, `CampaignRecipient`, `Segment`, `UserSegment`, `CrmNote`, `AuditLog`, `Setting`, `Role`, `UserRole`, `MonthlyWinner`, `XpHistory`, `UserAccessory`, `UserBadge`, `FreeTicket`
