# 📚 TIK TAK RUN API Documentation

> راهنمای استفاده از REST API و WebSocket پلتفرم TIK TAK RUN

---

## 🌐 Base URLs

| محیط | REST API | WebSocket |
|------|----------|-----------|
| Development | `http://localhost:4000/api/v1` | `ws://localhost:4000` |
| Production | `https://api.tiktakrun.ir/api/v1` | `wss://api.tiktakrun.ir` |

**Swagger UI (live):** `<API_BASE>/docs`

---

## 🔐 Authentication

### روال OTP (کاربر عادی)

```
1. POST /auth/otp/request   → {mobile}
   ↳ سیستم OTP می‌فرستد (SMS.ir یا mock)

2. POST /auth/otp/verify    → {mobile, code, inviteCode?}
   ↳ پاسخ: {accessToken, refreshToken, user}

3. (در requests بعدی) Header: Authorization: Bearer <accessToken>

4. POST /auth/refresh       → {refreshToken}
   ↳ پاسخ: {accessToken, refreshToken جدید}
```

### روال Login ادمین

```
POST /auth/admin/login  → {mobile, password}
↳ پاسخ: {accessToken, refreshToken, user, roles, permissions}
```

### Roles

| نقش | توضیح |
|-----|--------|
| `SUPER_ADMIN` | همه دسترسی‌ها |
| `ADMIN` | اکثر دسترسی‌ها به‌جز system settings |
| `BRANCH_MANAGER` | فقط شعبه خودش + رزروها |
| `SUPPORT` | تیکت‌ها + اطلاعات کاربر (read-only) |
| `MARKETING` | کمپین‌ها + Segments + Pipeline |
| `CUSTOMER` | کاربر نهایی |

---

## 📋 Response Envelope

همه پاسخ‌های موفق در این قالب wrap می‌شوند:

```json
{
  "success": true,
  "data": <پاسخ_اصلی>,
  "meta": {
    "timestamp": "2026-05-25T10:00:00.000Z",
    "version": "1.0.0"
  }
}
```

پاسخ‌های paginated:

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

پاسخ‌های خطا:

```json
{
  "success": false,
  "error": {
    "statusCode": 400,
    "code": "VALIDATION_ERROR",
    "message": "شماره موبایل نامعتبر است",
    "details": [...]
  },
  "meta": { "timestamp": "...", "path": "/api/v1/auth/otp/request" }
}
```

---

## 🚦 Error Codes

| Status | Code | معنی |
|--------|------|------|
| 400 | `VALIDATION_ERROR` | داده ورودی نامعتبر |
| 400 | `INVALID_OTP` | کد OTP اشتباه |
| 400 | `OTP_EXPIRED` | OTP منقضی شده |
| 400 | `INSUFFICIENT_BALANCE` | موجودی کافی نیست |
| 401 | `UNAUTHORIZED` | توکن غایب/منقضی |
| 401 | `INVALID_TOKEN` | توکن نامعتبر |
| 403 | `FORBIDDEN` | دسترسی ندارید |
| 403 | `USER_BANNED` | کاربر بن شده |
| 404 | `NOT_FOUND` | منبع یافت نشد |
| 409 | `CONFLICT` | تضاد (مثلاً موبایل تکراری) |
| 409 | `BOOKING_SLOT_TAKEN` | اسلات رزرو شده |
| 422 | `BUSINESS_RULE_FAILED` | قوانین کسب‌وکار رد کرد |
| 429 | `TOO_MANY_REQUESTS` | rate limit |
| 500 | `INTERNAL_ERROR` | خطای سرور |

---

## 🚀 خلاصه Endpointها

### Public (بدون نیاز به Auth)

```
GET    /                          → معرفی API
GET    /health                    → health check
GET    /api/v1/docs               → Swagger UI

POST   /api/v1/auth/otp/request   → درخواست OTP
POST   /api/v1/auth/otp/verify    → تأیید OTP
POST   /api/v1/auth/refresh       → refresh token
POST   /api/v1/auth/admin/login   → ورود ادمین

GET    /api/v1/cities             → لیست شهرها
GET    /api/v1/branches           → لیست شعب
GET    /api/v1/categories         → دسته‌بندی‌ها
GET    /api/v1/games              → لیست بازی‌ها (با filter)
GET    /api/v1/games/:slug        → جزئیات بازی
GET    /api/v1/games/:slug/reviews → نظرات
GET    /api/v1/top                → برترین‌های هفته/ماه
GET    /api/v1/weekly             → جایزه ماهانه
```

### User (نیاز به Auth)

```
GET    /api/v1/users/me           → پروفایل کامل خودم
PATCH  /api/v1/users/me           → ویرایش پروفایل
GET    /api/v1/profile            → پروفایل گسترده (badges, stats)
PUT    /api/v1/profile/avatar     → به‌روزرسانی avatar config
POST   /api/v1/profile/avatar/purchase → خرید accessory

GET    /api/v1/wallet             → موجودی + transactions اخیر
POST   /api/v1/wallet/charge      → شارژ (شروع ZarinPal)
POST   /api/v1/wallet/convert     → تبدیل سکه ↔ تومان
GET    /api/v1/wallet/transactions → تاریخچه

GET    /api/v1/invites/me         → کد دعوت من
POST   /api/v1/invites/apply      → اعمال کد دعوت

POST   /api/v1/bookings           → ایجاد رزرو
GET    /api/v1/bookings           → رزروهای من
GET    /api/v1/bookings/:id       → جزئیات رزرو
PATCH  /api/v1/bookings/:id/cancel → لغو
POST   /api/v1/bookings/:id/review → ثبت نظر

POST   /api/v1/payments/start     → شروع پرداخت
GET    /api/v1/payments/verify    → callback ZarinPal

GET    /api/v1/notifications      → اعلان‌ها
PATCH  /api/v1/notifications/:id/read → خواندن
PATCH  /api/v1/notifications/read-all → همه را بخوان

GET    /api/v1/wheel/status       → وضعیت گردونه + هزینه
POST   /api/v1/wheel/spin         → چرخش (با cost type)

GET    /api/v1/chat/rooms         → اتاق‌های چت
GET    /api/v1/chat/messages?roomId=... → پیام‌ها (paginated)
POST   /api/v1/chat/report        → گزارش پیام

GET    /api/v1/teams              → لیست تیم‌ها
POST   /api/v1/teams              → ایجاد تیم
GET    /api/v1/teams/:id          → جزئیات
POST   /api/v1/teams/:id/join     → عضویت
POST   /api/v1/teams/:id/leave    → خروج

GET    /api/v1/tickets            → تیکت‌های من
POST   /api/v1/tickets            → ایجاد تیکت
POST   /api/v1/tickets/:id/reply  → پاسخ
```

### Admin (نیاز به نقش ADMIN+)

همه از prefix `/api/v1/admin` استفاده می‌کنند. برای لیست کامل به Swagger مراجعه کنید.

```
GET    /api/v1/admin/dashboard/kpi    → KPIs کلی
GET    /api/v1/admin/dashboard/charts → نمودارها

GET    /api/v1/admin/customers        → لیست (با filter)
GET    /api/v1/admin/customers/:id    → 360 view
POST   /api/v1/admin/customers/:id/ban
POST   /api/v1/admin/customers/:id/wallet/adjust
POST   /api/v1/admin/customers/:id/xp/adjust
POST   /api/v1/admin/customers/:id/badges/grant

GET    /api/v1/admin/segments
POST   /api/v1/admin/segments         → builder
GET    /api/v1/admin/segments/:id/members

GET    /api/v1/admin/pipeline         → Kanban
PATCH  /api/v1/admin/pipeline/:id/move

GET    /api/v1/admin/campaigns
POST   /api/v1/admin/campaigns        → ایجاد + ارسال SMS

GET    /api/v1/admin/bookings         → همه رزروها
PATCH  /api/v1/admin/bookings/:id/status
POST   /api/v1/admin/bookings/:id/refund

GET    /api/v1/admin/games
POST   /api/v1/admin/games            → multipart با تصاویر
PATCH  /api/v1/admin/games/:id
DELETE /api/v1/admin/games/:id

GET    /api/v1/admin/reviews          → برای تایید
PATCH  /api/v1/admin/reviews/:id/approve
PATCH  /api/v1/admin/reviews/:id/reject

GET    /api/v1/admin/chat/messages    → moderation
PATCH  /api/v1/admin/chat/messages/:id/hide

GET    /api/v1/admin/transactions
GET    /api/v1/admin/payments

GET    /api/v1/admin/reports/financial
GET    /api/v1/admin/reports/games
GET    /api/v1/admin/reports/cohort
GET    /api/v1/admin/reports/heatmap

POST   /api/v1/admin/backup/create
GET    /api/v1/admin/backup/list
POST   /api/v1/admin/backup/restore

GET    /api/v1/admin/settings
PATCH  /api/v1/admin/settings/:key

GET    /api/v1/admin/roles
PATCH  /api/v1/admin/roles/:id/permissions

GET    /api/v1/admin/audit            → audit log

GET    /api/v1/admin/analytics/overview
```

---

## 🔌 WebSocket Events

### اتصال

```javascript
const socket = io('wss://api.tiktakrun.ir', {
  auth: { token: '<accessToken>' },
  transports: ['websocket'],
});
```

### Events (سرور → کلاینت)

| Event | Payload | توضیح |
|-------|---------|--------|
| `notification` | `{type, title, body, data}` | اعلان جدید |
| `chat:message` | `{roomId, message, sender}` | پیام جدید چت |
| `chat:typing` | `{roomId, userId, isTyping}` | تایپ |
| `booking:status` | `{bookingId, status}` | تغییر وضعیت رزرو |
| `wallet:update` | `{balance, change}` | تغییر موجودی |
| `level:up` | `{newLevel, rewards}` | level up |
| `badge:earned` | `{badge}` | بج جدید |

### Events (کلاینت → سرور)

| Event | Payload | توضیح |
|-------|---------|--------|
| `chat:join` | `{roomId}` | join چت |
| `chat:leave` | `{roomId}` | leave |
| `chat:send` | `{roomId, text}` | ارسال پیام |
| `chat:typing` | `{roomId, isTyping}` | typing indicator |

---

## 🔄 Rate Limits

| Endpoint | Limit |
|----------|-------|
| `/auth/otp/*` | 5 req / hour / IP |
| `/auth/login` | 10 req / 5min / IP |
| سایر public | 30 req / s / IP |
| Authenticated | 100 req / min / user |

اگر rate limit بخورید: `429 Too Many Requests` + Header `Retry-After: <seconds>`.

---

## 📦 Postman Collection

Postman collection در `docs/postman/` موجود است. برای اضافه کردن:
```
File → Import → docs/postman/phase04.json
```

---

## 🛠 Pagination Standard

همه endpointهای list این query params را قبول می‌کنند:

```
?page=1            # شماره صفحه (default: 1)
&limit=20          # تعداد در صفحه (default: 20, max: 100)
&sortBy=createdAt  # فیلد سورت
&order=desc        # asc | desc
&search=کلمه       # جستجو (اگر پشتیبانی شود)
```

---

برای جزئیات هر endpoint و schema body/response، **Swagger UI** مرجع نهایی است:

🔗 **https://api.tiktakrun.ir/api/v1/docs**
