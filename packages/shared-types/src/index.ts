/**
 * TIK TAK RUN — @tiktakrun/shared-types
 * یکجا export همه types برای استفاده در apps/api و apps/web و apps/admin
 *
 * ترتیب export مهم است:
 *   1. enums — اول، چون models به آن‌ها وابسته‌اند
 *   2. gamification — قبل از user، چون user از آن re-export می‌کند
 *   3. سایر models
 *   4. API DTOs
 *   5. Utilities
 */

// ─── Enums ───────────────────────────────────────────────────
export * from './enums';
export * from './auth';

// ─── Core Models (dependency order) ──────────────────────────
// gamification باید قبل از user باشد — user از آن re-export می‌کند
export * from './models/gamification';

// user — Level/Badge/AvatarItem را از gamification re-export می‌کند
// (Wallet inline نیز اینجا export می‌شود؛ wallet.ts نسخه کامل‌تر دارد)
export * from './models/user';

// سایر models
export * from './models/game';
export * from './models/booking';
export * from './models/wallet';
export type { ReviewStats } from './models/review';
export * from './models/chat';
export * from './models/notification';
export * from './models/ticket';
export * from './models/crm';
export * from './models/discount';
export type { BranchSummary } from './models/branch';
export * from './models/setting';

// ─── API DTOs ────────────────────────────────────────────────
export * from './api/requests';
export * from './api/responses';
export * from './api/chat.dto';

// ─── Utilities ───────────────────────────────────────────────
export * from './utils/pagination';
export * from './utils/api-response';
