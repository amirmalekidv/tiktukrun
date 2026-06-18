/**
 * Prisma Schema Shims
 * ────────────────────────────────────────────────────────────────────────────
 * این فایل enum های گم‌شده‌ای که در کد ارجاع شده ولی در schema موجود نیستن را
 * به‌صورت runtime object تعریف می‌کند تا کد crash نکند.
 *
 * در طول QA (2026-05-25) فهمیدیم که بسیاری از enums در کد ارجاع داده شده‌اند
 * که در `prisma/schema.prisma` تعریف نشده‌اند (مثل AuditAction، TransactionRefType،
 * TransactionCurrency، PaymentGateway).
 *
 * این فایل آن‌ها را برای سازگاری runtime تأمین می‌کند. در آینده schema باید
 * به‌روزرسانی شود تا این enum ها واقعاً اضافه شوند.
 */

// از @prisma/client هر enum واقعی را re-export می‌کنیم
export {
  UserRole,
  BookingStatus,
  PaymentStatus,
  PaymentMethod,
  TransactionType,
  CurrencyType,
  ChatRoomType,
  ChatMessageStatus,
  TicketPriority,
  TicketStatus,
  CampaignStatus,
  CampaignType,
  PipelineStage,
  DiscountType,
  AvatarItemType,
  WheelPrizeType,
  LevelTier,
  NotificationType,
  NotificationChannel,
  GameDifficulty,
  GenreFilter,
  ModerationActionType,
  TeamStatus,
  TeamMemberRole,
  MonthlyWinnerType,
  AutoDiscountRule,
  Gender,
} from '@prisma/client';

// ─── Alias: Role → UserRole ────────────────────────────────────────────
// کد قدیمی از `Role` استفاده می‌کرد، در schema جدید نام `UserRole` شد
import { UserRole } from '@prisma/client';
export const Role = UserRole;
export type Role = UserRole;

// ─── Alias: TransactionCurrency → CurrencyType ─────────────────────────
import { CurrencyType } from '@prisma/client';
export const TransactionCurrency = CurrencyType;
export type TransactionCurrency = CurrencyType;

// ─── Alias: PaymentGateway → PaymentMethod ─────────────────────────────
import { PaymentMethod } from '@prisma/client';
export const PaymentGateway = PaymentMethod;
export type PaymentGateway = PaymentMethod;

// ─── Stub: AuditAction (در schema موجود نیست — string-based) ──────────
export const AuditAction = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  BAN_USER: 'BAN_USER',
  UNBAN_USER: 'UNBAN_USER',
  MUTE_USER: 'MUTE_USER',
  UNMUTE_USER: 'UNMUTE_USER',
  GRANT_BADGE: 'GRANT_BADGE',
  REVOKE_BADGE: 'REVOKE_BADGE',
  ADJUST_WALLET: 'ADJUST_WALLET',
  ADJUST_XP: 'ADJUST_XP',
  ROLE_CHANGE: 'ROLE_CHANGE',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  SETTING_CHANGE: 'SETTING_CHANGE',
  BACKUP_CREATE: 'BACKUP_CREATE',
  BACKUP_RESTORE: 'BACKUP_RESTORE',
  CAMPAIGN_SEND: 'CAMPAIGN_SEND',
  DEAL_MOVE: 'DEAL_MOVE',
  SEGMENT_RECOMPUTE: 'SEGMENT_RECOMPUTE',
  WHEEL_SPIN: 'WHEEL_SPIN',
  PRIZE_DISTRIBUTE: 'PRIZE_DISTRIBUTE',
  BOOKING_CONFIRM: 'BOOKING_CONFIRM',
  BOOKING_CANCEL: 'BOOKING_CANCEL',
  PAYMENT_REFUND: 'PAYMENT_REFUND',
  REVIEW_APPROVE: 'REVIEW_APPROVE',
  REVIEW_REJECT: 'REVIEW_REJECT',
  TICKET_REPLY: 'TICKET_REPLY',
  // ── مقادیر استفاده‌شده در سرویس‌ها ──
  USER_UPDATED: 'USER_UPDATED',
  USER_BANNED: 'USER_BANNED',
  USER_UNBANNED: 'USER_UNBANNED',
  USER_MUTED: 'USER_MUTED',
  USER_UNMUTED: 'USER_UNMUTED',
  BADGE_GRANTED: 'BADGE_GRANTED',
  BADGE_REVOKED: 'BADGE_REVOKED',
  XP_ADJUSTED: 'XP_ADJUSTED',
  WALLET_ADJUSTED: 'WALLET_ADJUSTED',
} as const;
export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];

// ─── Stub: TransactionRefType (در schema موجود نیست) ───────────────────
export const TransactionRefType = {
  BOOKING: 'BOOKING',
  PAYMENT: 'PAYMENT',
  WHEEL_SPIN: 'WHEEL_SPIN',
  INVITE: 'INVITE',
  MONTHLY_REWARD: 'MONTHLY_REWARD',
  ADMIN_ADJUST: 'ADMIN_ADJUST',
  REFUND: 'REFUND',
  LEVEL_UP: 'LEVEL_UP',
  ACCESSORY_PURCHASE: 'ACCESSORY_PURCHASE',
  REVIEW_REWARD: 'REVIEW_REWARD',
  CONVERSION: 'CONVERSION',
  MANUAL_ADJUST: 'MANUAL_ADJUST',
  AVATAR_PURCHASE: 'AVATAR_PURCHASE',
} as const;
export type TransactionRefType = (typeof TransactionRefType)[keyof typeof TransactionRefType];
