# TIK TAK RUN — Task Manager

> **Purpose:** Layer-by-layer completion plan for making the platform fully functional.  
> **Audience:** Implementation team (handoff document).  
> **Focus:** Backend (`apps/api`) is the primary gap; frontend (`apps/web`, `apps/admin`) is largely UI-complete but blocked by API contract mismatches.  
> **Policy reference:** [`docs/PROJECT_MODULES_AND_POLICIES.md`](./docs/PROJECT_MODULES_AND_POLICIES.md)  
> **Last reviewed:** 2026-06-22

---

## How to use this document

1. Work **phase by phase**, in order. Tasks within a phase are numbered; lower numbers should be completed before higher numbers in the same phase when a dependency is noted.
2. **Do not skip Phase 0–2.** Most authenticated flows, chat, payments, and notifications depend on them.
3. After each task, verify against Swagger (`/api/v1/docs`) and the relevant e2e test (or add one).
4. When a task touches business rules, update `PROJECT_MODULES_AND_POLICIES.md` if behavior changes.

### Status legend

| Symbol | Meaning |
|--------|---------|
| 🔴 Critical | Blocks production or core user flows |
| 🟠 High | Major feature incomplete or broken |
| 🟡 Medium | Partial implementation / drift / tech debt |
| 🟢 Low | Polish, optional endpoints, docs |

---

## Current state summary

| Layer | Completeness | Notes |
|-------|--------------|-------|
| **API modules** | ~70% | 32 NestJS modules exist; several use stub bridges, mock data, or PostgreSQL leftovers |
| **WebSocket / Chat** | ~55% | Gateway exists; protocol mismatches, missing events, teams kick not wired |
| **MongoDB migration** | ~85% | Schema on MongoDB; seed, tickets stats, docs/scripts still PostgreSQL-oriented |
| **Web frontend** | ~95% UI / ~25% API wiring | Dual API clients, three auth token keys, demo fallbacks mask failures |
| **Admin frontend** | ~90% UI / ~60% API wiring | Settings pages UI-only; CRM path drift; no admin socket backend |
| **Infra** | ~90% | Docker/Nginx OK; some legacy postgres scripts remain |

---

## Phase 0 — Foundation, schema, and canonical types

> **Goal:** Single source of truth for enums, settings keys, and database tooling. Everything else depends on this.

| # | Priority | Task | Description |
|---|----------|------|-------------|
| **0.1** | 🔴 | `[done]` Align `packages/shared-types` with Prisma schema | Audit `packages/shared-types/src/enums.ts` and models against `apps/api/prisma/schema.prisma`. Add missing notification types (`TEAM_FULL`, `MONTHLY_WINNER`, `CAMPAIGN`, etc.), ensure `UserRole` uses `CUSTOMER` (not `USER`), pipeline stage `LEADS` (not `LEAD`), campaign type `INAPP` (not `IN_APP`). Export types used by web/admin. |
| **0.2** | 🔴 | `[done]` Remove or replace `phase3-stubs.interface.ts` drift | File `apps/api/src/common/interfaces/phase3-stubs.interface.ts` duplicates shared types with wrong values (`UserRole.USER`, local `NotificationType`). Migrate all imports to `@tiktakrun/shared-types` or Prisma-generated enums; delete conflicting definitions. |
| **0.3** | 🔴 | `[done]` Fix Prisma shims for missing schema enums | `apps/api/src/common/prisma-shims.ts` stubs `AuditAction`, `TransactionRefType`, etc. Either add enums to schema or formalize string constants in shared-types; remove silent runtime aliases. |
| **0.4** | 🟠 | `[done]` MongoDB seed script rewrite | `apps/api/prisma/seed.ts` still uses PostgreSQL `TRUNCATE TABLE`. Rewrite for MongoDB (`deleteMany` per collection or drop/recreate). Verify seed runs clean on fresh `prisma db push`. |
| **0.5** | 🟠 | `[done]` Update Prisma tooling and docs for MongoDB | Fix: `prisma/migrations/migration_lock.toml` (still `postgresql`), `prisma/README.md`, `apps/api/package.json` description, `.env.example` comments, `prisma/scripts/validate-schema.ts`, `prisma/scripts/backup-dump.sh` (still `pg_dump`). Document `db push` + replica set requirement. |
| **0.6** | 🟡 | `[done]` Remove or archive PostgreSQL artifacts | `prisma/schema.postgres.prisma.bak`, PostgreSQL migration SQL files — move to `docs/archive/` or delete after confirming MongoDB schema is canonical. |
| **0.7** | 🟡 | `[done]` Verify MongoDB replica set in Docker | Confirm `docker-compose.yml` starts MongoDB as `rs0`; document that wallet/booking transactions fail without it. Test `prisma.$transaction` in a smoke script. |

**Depends on:** nothing  
**Blocks:** Phases 1–11

---

## Phase 1 — Service unification (stub removal)

> **Goal:** One `NotificationsService`, one `WalletService`, injected globally — no shadow copies in feature modules.

| # | Priority | Task | Description |
|---|----------|------|-------------|
| **1.1** | 🔴 | `[done]` Export real services from modules | Ensure `WalletModule` and `NotificationsModule` export their services for DI. Add `@Global()` or explicit exports if needed. |
| **1.2** | 🔴 | `[done]` Remove stub providers from `BookingsModule` | `apps/api/src/modules/bookings/bookings.module.ts` registers local `notifications-stub.service` and `wallet-stub.service`. Replace with injected `NotificationsService` and `WalletService` from real modules. Update `bookings.service.ts`, `bookings-admin.service.ts`, `booking-cron.service.ts`, `booking-rewards.service.ts`. |
| **1.3** | 🔴 | `[done]` Remove stub provider from `ReviewsModule` | Same pattern in `reviews.module.ts` / `reviews.service.ts` — use global notifications service. |
| **1.4** | 🟠 | `[done]` Delete stub bridge files after migration | Once all consumers use real services, remove `apps/api/src/common/interfaces/notifications-stub.service.ts` and `wallet-stub.service.ts`. Ensure booking wallet debits use proper `WalletTxType` (not always `MANUAL_ADJUST`). |
| **1.5** | 🟠 | `[done]` Unify notification type mapping | Real `notifications.service.ts` and former stub used different type strings. Align all callers to Prisma `NotificationType` enum; add missing values to schema if needed (task 0.1). |

**Depends on:** 0.1, 0.2  
**Blocks:** Phase 4 (bookings/reviews rewards), Phase 6 (campaigns)

---

## Phase 2 — Auth, SMS, and payments

> **Goal:** OTP, wallet top-up, and booking payment flows work end-to-end in production.

| # | Priority | Task | Description |
|---|----------|------|-------------|
| **2.1** | 🔴 | `[done]` Wire SMS.ir provider | `apps/api/src/modules/sms/sms.service.ts` has `// TODO: Real SMS.ir implementation`. Connect existing `smsir.provider.ts` / `mock-sms.provider.ts` via `SmsModule` factory based on `SMS_MOCK_MODE` and `SMSIR_API_KEY`. Respect `settings` keys `sms.provider`, `sms.sendOtp`, `sms.sendBookingConfirm`. |
| **2.2** | 🔴 | `[done]` Fix campaign SMS recipient field | `campaign-executor.ts` uses `user.phone`; User model field is `mobile`. Fix mapping and add null checks for users without mobile. |
| **2.3** | 🔴 | `[done]` Implement wallet charge + ZarinPal callback | `wallet.service.ts` `chargeWallet()` references `/api/v1/wallet/charge/callback` but **no route exists**. Add controller endpoint that verifies via `PaymentsService` / `ZarinpalProvider`, credits wallet, marks `Payment` SUCCESS. Support sandbox and production (`payments.sandboxMode` setting). |
| **2.4** | 🟠 | `[done]` Integrate wallet charge with PaymentsService | Non-sandbox path should call `PaymentsService.initiate()` like bookings do, not fake URLs. Return real `paymentUrl` to client. |
| **2.5** | 🟠 | `[done]` Read OTP/security timing from settings | `otp.service.ts` hardcodes TTL and rate limits. Read `security.otpExpiry`, `security.maxLoginAttempts`, `security.lockoutMinutes` from `SettingsService` with sensible defaults. |
| **2.6** | 🟡 | `[done]` IDPay provider (optional) | Schema/env mention IDPay; only ZarinPal is implemented. Either implement provider or remove from schema/docs to avoid confusion. |
| **2.7** | 🟡 | `[done]` Booking payment callback documentation | Ensure `GET /payments/zarinpal/verify` handles both booking and wallet `Payment` records by `Authority` / metadata. Add integration test. |

**Depends on:** 0.5 (env docs), 1.1  
**Blocks:** Phase 4.3, Phase 9 (web wallet/booking flows)

---

## Phase 3 — WebSocket and real-time chat

> **Goal:** Live chat works for web clients; admin moderation events propagate; optional admin activity feed.

| # | Priority | Task | Description |
|---|----------|------|-------------|
| **3.1** | 🔴 | `[done]` Normalize chat gateway protocol | `chat.gateway.ts`: accept `roomType` case-insensitively (`global`/`GLOBAL`, `team`/`TEAM`). Document canonical contract in `API_DOCS.md`. |
| **3.2** | 🔴 | `[done]` Normalize outbound message payload | Gateway emits Prisma shape `{ user: { fullName, avatarUrl } }`; clients expect `{ userId, userName, userAvatar }`. Emit a stable DTO from gateway (create `ChatMessageDto` in shared-types). |
| **3.3** | 🔴 | `[done]` Emit chat history on room join | Web `useChat` listens for `chatHistory`; gateway never emits it. On `joinRoom`, load recent messages via `ChatService` and emit `chatHistory` + `onlineCount` for the room. |
| **3.4** | 🟠 | `[done]` Fix presence field names | Gateway uses `userData?.name`; user model has `fullName`. Fix `userOnline` / `userOffline` payloads. |
| **3.5** | 🟠 | `[done]` Wire team kick to WebSocket | `TeamsService.kick()` does not call `ChatGateway.emitUserKicked()`. Inject gateway (or use EventEmitter) so kicked users leave team room and receive event. |
| **3.6** | 🟠 | `[done]` Enforce `chat.maxMessageLength` | Setting exists in DB defaults but gateway/service may not enforce it server-side. Validate in `ChatService.sendMessage` and gateway. |
| **3.7** | 🟡 | `[done]` Implement `avgResponseTime` in chat stats | `chat.service.ts` returns stub `0` for admin stats; compute from message timestamps if required by admin UI. |
| **3.8** | 🟡 | `[done]` Admin real-time gateway (optional) | Admin listens for `activity`, `bookings:new`, `tickets:new` — **no backend emitter**. Either add `AdminGateway` namespace with events from audit/booking/ticket services, or document polling-only admin UX and remove dead socket clients. |
| **3.9** | 🟡 | `[done]` Notification push over socket (optional) | Web `useNotifications` listens on chat socket for `notification` events. Emit from `NotificationsService.create()` when type is in-app, or remove client listener. |
| **3.10** | 🟢 | `[done]` Redis Socket.io adapter for multi-instance | For horizontal scaling, configure `@socket.io/redis-adapter` using existing Redis connection. |

**Depends on:** 2.1 (optional for SMS alerts), 0.1  
**Blocks:** Phase 9.4 (web community/chat)

---

## Phase 4 — Bookings, wallet, and reviews (business core)

> **Goal:** Booking lifecycle, refunds, rewards, and reviews are policy-correct and settings-driven.

| # | Priority | Task | Description |
|---|----------|------|-------------|
| **4.1** | 🔴 | `[done]` Drive booking rules from settings | Replace hardcoded `maxConcurrent = 1`, refund windows, and timeout values in `bookings.service.ts` with `SettingsService` (`financial.refundWindowHours`, new keys if needed). Match `PROJECT_MODULES_AND_POLICIES.md`. |
| **4.2** | 🟠 | `[done]` Fix wallet transaction types on booking pay/refund | After stub removal (1.2), ensure debits/credits use correct `WalletTxType` and leave auditable trail per policy. |
| **4.3** | 🟠 | `[done]` Booking payment flow e2e test | Add real DB e2e: preview → create → pay (wallet) → confirm → complete → rewards. Current `bookings.e2e-spec.ts` is mostly mocked unit tests — rename or split. |
| **4.4** | 🟠 | `[done]` Review eligibility enforcement | Verify `reviews.service.ts` only allows reviews on `COMPLETED` bookings for the correct user; align with admin moderation (`PENDING`/`APPROVED`). |
| **4.5** | 🟡 | `[done]` Admin booking CSV export pagination | `bookings-admin.service.ts` export limited to 100 rows; implement cursor/page export for production reports. |
| **4.6** | 🟡 | `[done]` Drive gamification rewards from settings | `booking-rewards.service.ts` should read `gamification.xpPerBooking`, coin/diamond grants from settings — not duplicated constants. |
| **4.7** | 🟢 | `[done]` Public review routes alignment | Backend has `GET /reviews/game/:gameId`; web `api.ts` calls `GET /games/:gameId/reviews`. Add alias route or document canonical path (frontend task 9.2). |

**Depends on:** 1.2, 1.3, 2.3  
**Blocks:** Phase 9.3

---

## Phase 5 — Teams, gamification, wheel, and monthly

> **Goal:** Community features and reward loops are complete and consistent.

| # | Priority | Task | Description |
|---|----------|------|-------------|
| **5.1** | 🟠 | `[done]` Implement real `topTeams` | `top.service.ts` stub returns top spenders, not teams. Query teams by activity/bookings/wins per product policy. |
| **5.2** | 🟠 | `[done]` Fix monthly top-team winner logic | `monthly.service.ts` uses member count proxy; should use bookings/XP per team per policy doc. |
| **5.3** | 🟠 | `[done]` Team create/join validation | Align API DTO with web: accept `gameId`, `capacity` (web sends `gameType`, `maxMembers`). Support optional `cityId` filter on list. |
| **5.4** | 🟡 | `[done]` `TEAM_FULL` notification | Add to Prisma `NotificationType` enum; emit when team reaches capacity. |
| **5.5** | 🟡 | `[done]` Optional `TeamsModule` registration | Teams live inside `ChatModule`; consider standalone module in `app.module.ts` for clarity. |
| **5.6** | 🟡 | `[done]` Wheel history endpoint | Web calls `GET /wheel/history`; not implemented. Add paginated spin history for current user. |
| **5.7** | 🟢 | `[done]` `GET /wheel/me/eligibility` alias | Web uses wrong path; add alias or fix client (see Phase 9). |
| **5.8** | 🟢 | `[done]` Validate `paidWith` enum casing | Accept `XP`/`COINS`/`DIAMONDS` case-insensitively in wheel spin DTO. |

**Depends on:** 0.1, 3.5  
**Blocks:** Phase 9.5

---

## Phase 6 — CRM, support, campaigns, and analytics

> **Goal:** Admin CRM/marketing modules have working APIs with correct shapes.

| # | Priority | Task | Description |
|---|----------|------|-------------|
| **6.1** | 🔴 | `[done]` Fix tickets stats for MongoDB | `tickets.service.ts` `getStats()` uses PostgreSQL `$queryRaw` (returns empty via Prisma stub). Rewrite with Prisma aggregations on `Ticket` model. Remove mock `satisfactionRate: 4.2` or compute from reviews/ratings. |
| **6.2** | 🟠 | `[done]` Campaign tracking endpoints | `trackClick`, `trackOpen`, `trackConversion` exist in service but have **no HTTP routes**. Add public `GET /campaigns/track/:token` (or similar) wired to executor. |
| **6.3** | 🟠 | `[done]` Campaign executor completeness | Implement EMAIL channel or return clear 501; fix PUSH to use proper notification channel enum; align `INAPP` vs `IN_APP`. |
| **6.4** | 🟠 | `[done]` Pipeline API response adapter | Backend returns grouped stage map; admin expects flat `Deal[]`. Either add `?format=flat` query or transform in admin — document contract. Map `LEADS` ↔ `LEAD`, `title` ↔ `name`. |
| **6.5** | 🟠 | `[done]` Segments create/preview API | Admin sends `{ logic, rules }`; backend expects `{ conditions: { rules, logic } }`. Add `POST /admin/segments/preview` for count preview. Expose `cachedCount` as `count`. |
| **6.6** | 🟠 | `[done]` Admin activities feed | Admin calls `GET /admin/activities` — **no controller**. Implement as filtered `audit` log stream or dedicated activity aggregation. |
| **6.7** | 🟡 | `[done]` Analytics placeholder KPIs | `analytics.service.ts` hardcodes `cac: 50000`, `nps: 67`. Replace with computed values or settings; document unavailable metrics. |
| **6.8** | 🟡 | `[done]` Customer detail sub-resources | Admin `customersApi` calls `/customers/:id/bookings|transactions|reviews` — use embedded `findOne` or add nested admin routes under `/admin/users/:id/`. |
| **6.9** | 🟡 | `[done]` Campaign admin actions | Implement `resume`, `duplicate`, `delete` or remove from admin client; map `launch` → `start`. |
| **6.10** | 🟢 | `[done]` Ticket close endpoint | Add `POST /tickets/me/:id/close` if product policy allows customer closure. |

**Depends on:** 1.5, 2.2, 0.4  
**Blocks:** Phase 8, Phase 9.6

---

## Phase 7 — Settings, roles, and policy enforcement

> **Goal:** Runtime settings drive behavior; RBAC is consistent everywhere.

| # | Priority | Task | Description |
|---|----------|------|-------------|
| **7.1** | 🔴 | Normalize settings API for admin | `[done]` Backend: `GET /admin/settings?group=general`, `PUT /admin/settings/:key`, `PUT /admin/settings/bulk`. Fix admin `settingsApi` which wrongly uses `/admin/settings/${group}` as path segment. |
| **7.2** | 🟠 | Map admin settings forms to DB keys | `[done]` Wire 8 admin settings pages (currently fake `setTimeout` saves) to real API. Map UI fields to `public.*`, `financial.*`, `chat.*`, `security.*`, `gamification.*`, `sms.*`, `payments.*` keys from `settings.service.ts` `DEFAULT_SETTINGS`. |
| **7.3** | 🟠 | Wallet packages from settings or DB | `[done]` `wallet.service.ts` hardcodes diamond/coin package arrays. Move to settings JSON or `Package` collection for admin configurability. |
| **7.4** | 🟠 | Roles API clarity | `[done]` `roles.service.ts` throws on create/setPermissions (system enum only). Document read-only role matrix; fix admin `roles/[id]` placeholder page to read from API. |
| **7.5** | 🟡 | Permission naming unification | `[done]` Backend uses `bookings.write`; admin uses `bookings.*` and `customers.view`. Generate admin permission helpers from shared-types matching `roles.service.ts` `PERMISSIONS`. |
| **7.6** | 🟡 | Branch-scoped access audit | `[done]` Verify all admin controllers respect `BRANCH_MANAGER` branch filter per policy doc. |
| **7.7** | 🟢 | Maintenance mode enforcement | `[done]` `public.maintenanceMode` setting should block customer APIs (except auth/health) with 503. |

**Depends on:** 0.1, 4.1  
**Blocks:** Phase 8.3, Phase 9.7

---

## Phase 8 — Admin API alignment (backend routes)

> **Goal:** Every admin page that claims to be "connected to real API" has a matching backend endpoint.

| # | Priority | Task | Description |
|---|----------|------|-------------|
| **8.1** | 🔴 | Admin auth path aliases (if needed) | `[done]` Admin client fixed to use `/api/v1/auth/*` (Phase 9.6). |
| **8.2** | 🟠 | Analytics overview response shape | `[done]` `GET /admin/analytics/overview?format=formatted` returns nested `OverviewData` shape. |
| **8.3** | 🟠 | Customer mutation routes | `[done]` CRM aliases on `/admin/customers/:id/*` delegate to `UsersService`; admin client bodies fixed. |
| **8.4** | 🟡 | Backup restore endpoint | `[done]` `POST /admin/backup/restore` with `confirmToken` safeguard + pre-restore backup. |
| **8.5** | 🟡 | Contact form endpoint | `[done]` `POST /api/v1/public/contact` creates support ticket; web contact page wired. |
| **8.6** | 🟢 | Invites admin endpoints | `[done]` `GET /invites/me/users`, `POST /invites/regenerate`; field aliases on `GET /invites/me`. |

**Depends on:** 6.6, 6.8, 7.1  
**Blocks:** Phase 9.8

---

## Phase 9 — Frontend integration (web + admin)

> **Goal:** UI connects to backend with one auth story and no silent demo fallbacks.  
> **Note:** Smaller than backend scope but required for "fully functional" product.

| # | Priority | Task | Description |
|---|----------|------|-------------|
| **9.1** | 🔴 | Unify auth token storage (web) | `[done]` Single `auth_token` key via `lib/http.ts`; login, axios, fetch, socket aligned. |
| **9.2** | 🔴 | Unify web API client | `[done]` Shared `apiFetch` in `lib/http.ts`; all `lib/api/*.ts` modules migrated. |
| **9.3** | 🔴 | Fix web authenticated API paths | `[done]` Wallet, notifications, tickets, bookings, profile, chat REST paths corrected. |
| **9.4** | 🔴 | Fix web chat socket client | `[done]` WS URL, `auth_token`, `onlineCount` shape, `report` event, REST history preload. |
| **9.5** | 🟠 | Remove silent demo fallbacks | `[done]` Demo data gated behind `NEXT_PUBLIC_USE_MOCK`; errors shown on API failure. |
| **9.6** | 🟠 | Admin: fix auth client paths | `[done]` Auth uses `/api/v1/auth/*`; OTP field `code`; `BRANCH_MANAGER`/`MARKETING` allowed. |
| **9.7** | 🟠 | Admin: wire settings pages | `[done]` Completed in Phase 7 via `useAdminSettings` hook. |
| **9.8** | 🟠 | Admin: unify API client | `[done]` `client.ts` has token refresh on both `apiClient` and `adminApi`; CRM modules fixed. |
| **9.9** | 🟡 | Admin: dashboard analytics adapter | `[done]` `analyticsApi` requests `?format=formatted` from backend mapper. |
| **9.10** | 🟡 | Admin: permissions + sidebar | `[done]` CRM section added to active `ui/Sidebar.tsx`; permissions unified in Phase 7. |
| **9.11** | 🟡 | Web: booking payment return page | `[done]` `bookings/[id]?status=success|failed` shows payment toast on booking detail. |
| **9.12** | 🟢 | Remove dead mock files | `[done]` Deleted `mock-api.ts`/`mock-data.ts`; fixed `ecosystem.config.cjs` USE_MOCK and API URL. |

**Depends on:** Phases 2–8 (backend contracts stable)  
**Blocks:** Phase 10 integration tests

---

## Phase 10 — Testing, quality, and CI

> **Goal:** Confidence to deploy and regress safely.

| # | Priority | Task | Description |
|---|----------|------|-------------|
| **10.1** | 🟠 | Expand API e2e coverage | Add e2e for: bookings+payment, wallet charge callback, chat socket (with test JWT helper), teams, reviews, discounts, settings admin. |
| **10.2** | 🟠 | CI pipeline | GitHub Actions: `pnpm install`, `lint`, `typecheck`, `test`, `build` for api/web/admin. |
| **10.3** | 🟡 | Integration test env documented | Document `TEST_JWT_TOKEN`, `ADMIN_JWT_TOKEN` generation in `apps/api/test/README.md`. |
| **10.4** | 🟡 | Rename misleading tests | `bookings.e2e-spec.ts` → `bookings.unit-spec.ts` or split true e2e. |
| **10.5** | 🟢 | Postman collection update | Sync `docs/postman/` with final routes from Phase 8. |
| **10.6** | 🟢 | Smoke test script | Shell script hitting health, OTP mock, public games, admin login for staging verification. |

**Depends on:** 9.1–9.4 minimum  
**Blocks:** production sign-off

---

## Phase 11 — Infrastructure and operations

> **Goal:** Deploy, backup, and monitor reliably on MongoDB stack.

| # | Priority | Task | Description |
|---|----------|------|-------------|
| **11.1** | 🟠 | Verify backup/restore runbook | Test `mongodump` from API container; document restore steps; ensure `/storage/backups` volume and `mongodb-database-tools` in image. |
| **11.2** | 🟡 | Nginx WebSocket proxy check | Confirm `/socket.io/` upgrade headers work for chat namespace in production `infra/nginx/`. |
| **11.3** | 🟡 | Cron monitoring | Log output from booking cron, segment recompute, monthly rewards; optional healthchecks.io pings. |
| **11.4** | 🟢 | Sentry / error tracking | Optional DSN in `.env.example`; global exception filter integration. |
| **11.5** | 🟢 | Off-site backup | rclone or S3 sync for `storage/backups/` per QA recommendations. |

**Depends on:** 0.7, 2.3  
**Blocks:** none

---

## Module completion matrix (backend)

Quick reference for implementers — **backend module status** after audit:

| Module | Status | Primary tasks |
|--------|--------|---------------|
| `auth` | ✅ Mostly complete | 2.5 |
| `sms` | 🔴 Stub | 2.1, 2.2 |
| `users` / `profile` | ✅ Complete | 8.3 |
| `wallet` | 🟠 Partial | 1.2, 2.3, 2.4, 7.3 |
| `notifications` | ✅ Complete (underused) | 1.1–1.5, 3.9 |
| `payments` | 🟠 Partial | 2.3, 2.7 |
| `bookings` | 🟠 Partial | 1.2, 4.1–4.6 |
| `reviews` | 🟠 Partial | 1.3, 4.4 |
| `discounts` | ✅ Complete | — |
| `games` / `cities` / `branches` / `categories` | ✅ Complete | — |
| `chat` | 🟠 Partial | 3.1–3.7 |
| `teams` | 🟠 Partial | 3.5, 5.1–5.5 |
| `gamification` / `wheel` | ✅ Mostly complete | 5.6–5.8 |
| `monthly` / `weekly` / `top` | 🟠 Partial | 5.1–5.2 |
| `tickets` | 🟠 Partial | 6.1, 6.10 |
| `campaigns` | 🟠 Partial | 2.2, 6.2–6.3, 6.9 |
| `segments` / `pipeline` / `customers` | 🟠 Partial | 6.4–6.8 |
| `analytics` | 🟠 Partial | 6.7, 8.2 |
| `settings` | ✅ Complete (underconsumed) | 4.1, 7.1–7.3 |
| `roles` / `audit` | ✅ Complete | 7.4–7.6 |
| `backup` | 🟠 Partial | 8.4, 11.1 |
| `invites` | ✅ Mostly complete | 8.6 |
| `prisma` (infra) | 🟠 Partial | 0.4–0.6 |

---

## Suggested execution order (milestones)

### Milestone A — "Backend boots clean" (Phase 0)
Tasks: 0.1 → 0.7  
**Exit criteria:** `prisma db push` + `pnpm seed` succeed on MongoDB replica set; shared-types match schema.

### Milestone B — "Money and messages work" (Phases 1–2)
Tasks: 1.1 → 1.5 → 2.1 → 2.4  
**Exit criteria:** OTP sends (mock or real); wallet charge completes; booking wallet debit uses real wallet service.

### Milestone C — "Live chat works" (Phase 3)
Tasks: 3.1 → 3.6  
**Exit criteria:** Web client can join global room, see history, send/receive messages; team kick emits socket event.

### Milestone D — "Admin CRM honest" (Phases 6–8)
Tasks: 6.1 → 6.10 → 7.1 → 7.2 → 8.2 → 8.3  
**Exit criteria:** Dashboard loads real KPIs; settings persist; tickets stats non-zero; campaigns send SMS to `mobile`.

### Milestone E — "Customer app wired" (Phase 9)
Tasks: 9.1 → 9.5  
**Exit criteria:** Login → profile → wallet → booking → chat without demo data.

### Milestone F — "Shippable" (Phases 10–11)
Tasks: 10.1 → 10.2 → 11.1  
**Exit criteria:** CI green; staging smoke script passes; backup restore documented.

---

## Files most touched (backend hot spots)

| File | Why |
|------|-----|
| `apps/api/src/common/interfaces/phase3-stubs.interface.ts` | Enum drift — remove |
| `apps/api/src/modules/bookings/bookings.module.ts` | Stub providers |
| `apps/api/src/modules/sms/sms.service.ts` | Mock-only SMS |
| `apps/api/src/modules/wallet/wallet.service.ts` | Missing charge callback |
| `apps/api/src/modules/chat/chat.gateway.ts` | WebSocket protocol |
| `apps/api/src/modules/teams/teams.service.ts` | Kick + notifications |
| `apps/api/src/modules/tickets/tickets.service.ts` | PostgreSQL stats query |
| `apps/api/src/modules/campaigns/campaign-executor.ts` | SMS field bug |
| `apps/api/src/modules/analytics/analytics.service.ts` | Hardcoded KPIs |
| `apps/api/prisma/seed.ts` | PostgreSQL truncate |
| `packages/shared-types/src/enums.ts` | Canonical enums |

---

## Out of scope (v1.1+)

These are noted in QA/DELIVERY docs but not required for initial completion:

- Full unit test coverage across all 32 modules
- IDPay payment gateway
- CDN for uploads (Cloudflare R2 / ArvanCloud)
- WAF / Cloudflare proxy
- Multi-language beyond Persian UI
- Native mobile apps

---

## Handoff checklist for the implementing team

Before marking the project **complete**, verify:

- [x] All Phase 0–2 tasks done (foundation + stubs + SMS/payments)
- [x] Phase 3 chat socket protocol aligned (gateway + API docs)
- [x] Phase 4 booking/wallet/review policy driven from settings
- [x] Phase 5 teams/wheel/monthly community features complete
- [x] Phase 6 CRM/campaigns/analytics admin APIs aligned
- [ ] Chat socket tested with real JWT from web login
- [ ] Wallet charge + booking payment tested with ZarinPal sandbox
- [ ] Admin settings save and load from MongoDB
- [ ] No `$queryRaw` SQL left in services (MongoDB-safe queries only)
- [ ] `pnpm typecheck` and `pnpm build` pass for api, web, admin
- [ ] `PROJECT_MODULES_AND_POLICIES.md` updated for any rule changes
- [ ] `.env.example` reflects MongoDB + all required secrets
- [ ] Integration checklist in `QA_REPORT.md` executed on staging

---

*Generated from full-stack audit of `apps/api`, `apps/web`, `apps/admin`, `packages/shared-types`, and `infra`.*
