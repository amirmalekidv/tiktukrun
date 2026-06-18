/**
 * Phase 3 Stubs — موقت تا ادغام با کد فاز ۳
 * این فایل interface/wrapper‌های موقت است که در فاز ادغام با پیاده‌سازی
 * واقعی فاز ۳ جایگزین خواهند شد.
 */

// ─── JWT Payload ───────────────────────────────────────────────────────────────
export interface JwtPayload {
  sub: string;       // userId
  phone: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// ─── User Roles ────────────────────────────────────────────────────────────────
export enum UserRole {
  SUPER_ADMIN    = 'SUPER_ADMIN',
  ADMIN          = 'ADMIN',
  BRANCH_MANAGER = 'BRANCH_MANAGER',
  USER           = 'USER',
}

// ─── Current User (from JWT) ────────────────────────────────────────────────────
export interface CurrentUserPayload {
  id: string;
  phone: string;
  role: UserRole;
  branchId?: string; // for BRANCH_MANAGER
}

// ─── Wallet Service Interface ───────────────────────────────────────────────────
export interface IWalletService {
  applyTransaction(params: WalletTransactionParams): Promise<WalletTransactionResult>;
  getBalance(userId: string): Promise<bigint>;
}

export interface WalletTransactionParams {
  userId: string;
  amount: bigint;           // positive = credit, negative = debit
  type: WalletTxType;
  description: string;
  refId?: string;           // bookingId / paymentId
}

export enum WalletTxType {
  BOOKING_PAYMENT  = 'BOOKING_PAYMENT',
  REFUND           = 'REFUND',
  REWARD           = 'REWARD',
  MANUAL           = 'MANUAL',
}

export interface WalletTransactionResult {
  transactionId: string;
  newBalance: bigint;
}

// ─── Notifications Service Interface ───────────────────────────────────────────
export interface INotificationsService {
  send(params: NotificationParams): Promise<void>;
}

export interface NotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export enum NotificationType {
  BOOKING_CONFIRMED  = 'BOOKING_CONFIRMED',
  BOOKING_CANCELLED  = 'BOOKING_CANCELLED',
  BOOKING_COMPLETED  = 'BOOKING_COMPLETED',
  REVIEW_APPROVED    = 'REVIEW_APPROVED',
  REVIEW_REJECTED    = 'REVIEW_REJECTED',
  LEVEL_UP           = 'LEVEL_UP',
  BADGE_EARNED       = 'BADGE_EARNED',
  REFUND_ISSUED      = 'REFUND_ISSUED',
  PAYMENT_FAILED     = 'PAYMENT_FAILED',
}

// ─── Gamification / XP Service Interface ────────────────────────────────────────
export interface IGamificationService {
  awardXP(userId: string, amount: number, reason: string): Promise<XPAwardResult>;
  awardCoins(userId: string, amount: number, reason: string): Promise<void>;
  checkBadges(userId: string): Promise<string[]>; // returns newly earned badge ids
}

export interface XPAwardResult {
  newXP: number;
  leveledUp: boolean;
  newLevel?: number;
}

// ─── Settings Service Interface ─────────────────────────────────────────────────
export interface ISettingsService {
  get<T = string>(key: string, defaultValue?: T): Promise<T>;
}

// ─── Standard API Response ──────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
