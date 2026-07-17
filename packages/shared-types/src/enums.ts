/**
 * TIK TAK RUN — Shared Enums
 * دقیقاً مطابق schema.prisma
 * این فایل هیچ logic ندارد — فقط type definitions
 */

export enum UserRole {
  SUPER_ADMIN    = 'SUPER_ADMIN',
  ADMIN          = 'ADMIN',
  BRANCH_MANAGER = 'BRANCH_MANAGER',
  SUPPORT        = 'SUPPORT',
  MARKETING      = 'MARKETING',
  CUSTOMER       = 'CUSTOMER',
}

export enum BookingStatus {
  PENDING   = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REFUNDED  = 'REFUNDED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED  = 'FAILED',
  REFUND  = 'REFUND',
}

export enum PaymentMethod {
  WALLET        = 'WALLET',
  ZARINPAL      = 'ZARINPAL',
  IDPAY         = 'IDPAY',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CASH          = 'CASH',
}

export enum TransactionType {
  DEPOSIT          = 'DEPOSIT',
  WITHDRAW         = 'WITHDRAW',
  BOOKING_PAYMENT  = 'BOOKING_PAYMENT',
  REFUND           = 'REFUND',
  WHEEL_SPEND      = 'WHEEL_SPEND',
  WHEEL_WIN        = 'WHEEL_WIN',
  DIAMOND_PURCHASE = 'DIAMOND_PURCHASE',
  COIN_PURCHASE    = 'COIN_PURCHASE',
  INVITE_REWARD    = 'INVITE_REWARD',
  MONTHLY_REWARD   = 'MONTHLY_REWARD',
  MANUAL_ADJUST    = 'MANUAL_ADJUST',
  RATING_REWARD    = 'RATING_REWARD',
}

export enum CurrencyType {
  TOMAN    = 'TOMAN',
  COINS    = 'COINS',
  DIAMONDS = 'DIAMONDS',
  XP       = 'XP',
}

export enum ChatRoomType {
  GLOBAL  = 'GLOBAL',
  TEAM    = 'TEAM',
  PRIVATE = 'PRIVATE',
}

export enum ChatMessageStatus {
  NORMAL   = 'NORMAL',
  REPORTED = 'REPORTED',
  HIDDEN   = 'HIDDEN',
  DELETED  = 'DELETED',
}

export enum TicketPriority {
  LOW    = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH   = 'HIGH',
  URGENT = 'URGENT',
}

export enum TicketStatus {
  OPEN         = 'OPEN',
  IN_PROGRESS  = 'IN_PROGRESS',
  WAITING_USER = 'WAITING_USER',
  RESOLVED     = 'RESOLVED',
  CLOSED       = 'CLOSED',
}

export enum CampaignStatus {
  DRAFT     = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  ACTIVE    = 'ACTIVE',
  PAUSED    = 'PAUSED',
  COMPLETED = 'COMPLETED',
}

export enum CampaignType {
  SMS    = 'SMS',
  EMAIL  = 'EMAIL',
  INAPP  = 'INAPP',
  PUSH   = 'PUSH',
}

export enum PipelineStage {
  LEADS       = 'LEADS',
  CONTACTED   = 'CONTACTED',
  PROPOSED    = 'PROPOSED',
  NEGOTIATING = 'NEGOTIATING',
  CLOSED_WON  = 'CLOSED_WON',
  CLOSED_LOST = 'CLOSED_LOST',
}

export enum DiscountType {
  PERCENT = 'PERCENT',
  FIXED   = 'FIXED',
}

export enum AvatarItemType {
  HAT        = 'HAT',
  GLASSES    = 'GLASSES',
  SKIN       = 'SKIN',
  EFFECT     = 'EFFECT',
  BACKGROUND = 'BACKGROUND',
  ACCESSORY  = 'ACCESSORY',
}

export enum WheelPrizeType {
  COINS         = 'COINS',
  DIAMONDS      = 'DIAMONDS',
  XP            = 'XP',
  DISCOUNT_CODE = 'DISCOUNT_CODE',
  FREE_TICKET   = 'FREE_TICKET',
  TOMAN         = 'TOMAN',
}

export enum LevelTier {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD   = 'GOLD',
  LEGEND = 'LEGEND',
}

export enum NotificationType {
  BOOKING            = 'BOOKING',
  BOOKING_CONFIRMED  = 'BOOKING_CONFIRMED',
  BOOKING_CANCELLED  = 'BOOKING_CANCELLED',
  BOOKING_COMPLETED  = 'BOOKING_COMPLETED',
  PAYMENT            = 'PAYMENT',
  PAYMENT_FAILED     = 'PAYMENT_FAILED',
  REFUND_ISSUED      = 'REFUND_ISSUED',
  LEVEL              = 'LEVEL',
  LEVEL_UP           = 'LEVEL_UP',
  BADGE              = 'BADGE',
  BADGE_EARNED       = 'BADGE_EARNED',
  WHEEL              = 'WHEEL',
  WHEEL_PRIZE        = 'WHEEL_PRIZE',
  TEAM               = 'TEAM',
  TEAM_FULL          = 'TEAM_FULL',
  CHAT               = 'CHAT',
  SYSTEM             = 'SYSTEM',
  PROMOTION          = 'PROMOTION',
  CAMPAIGN           = 'CAMPAIGN',
  PUSH_CAMPAIGN      = 'PUSH_CAMPAIGN',
  TICKET_REPLY       = 'TICKET_REPLY',
  REVIEW_APPROVED    = 'REVIEW_APPROVED',
  REVIEW_REJECTED    = 'REVIEW_REJECTED',
  MONTHLY_WINNER     = 'MONTHLY_WINNER',
}

export enum NotificationChannel {
  INAPP = 'INAPP',
  SMS   = 'SMS',
  EMAIL = 'EMAIL',
}

export enum GameDifficulty {
  EASY      = 'EASY',
  MEDIUM    = 'MEDIUM',
  HARD      = 'HARD',
  VERY_HARD = 'VERY_HARD',
  LEGENDARY = 'LEGENDARY',
}

export enum GameTier {
  STANDARD  = 'STANDARD',
  SILVER    = 'SILVER',
  GOLD      = 'GOLD',
  PLATINUM  = 'PLATINUM',
  DIAMOND   = 'DIAMOND',
}

export enum GenreFilter {
  HORROR     = 'HORROR',
  NON_HORROR = 'NON_HORROR',
}

export enum ModerationActionType {
  WARN       = 'WARN',
  MUTE_24H   = 'MUTE_24H',
  BAN        = 'BAN',
  DELETE_MSG = 'DELETE_MSG',
}

export enum TeamStatus {
  FORMING   = 'FORMING',
  FULL      = 'FULL',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum TeamMemberRole {
  CAPTAIN = 'CAPTAIN',
  MEMBER  = 'MEMBER',
}

export enum MonthlyWinnerType {
  TOP_PLAYER    = 'TOP_PLAYER',
  TOP_TEAM      = 'TOP_TEAM',
  TOP_GAME      = 'TOP_GAME',
  RAFFLE_WINNER = 'RAFFLE_WINNER',
}

export enum AutoDiscountRule {
  VIP           = 'VIP',
  WEEKLY        = 'WEEKLY',
  FIRST_BOOKING = 'FIRST_BOOKING',
  BIRTHDAY      = 'BIRTHDAY',
  INVITE        = 'INVITE',
}

export enum Gender {
  MALE              = 'MALE',
  FEMALE            = 'FEMALE',
  OTHER             = 'OTHER',
  PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY',
}

// ─── Canonical aliases used across legacy API modules ────────────────────────

export const Role = UserRole;
export type Role = UserRole;

export const WalletTxType = TransactionType;
export type WalletTxType = TransactionType;

export const TransactionCurrency = CurrencyType;
export type TransactionCurrency = CurrencyType;

export const PaymentGateway = PaymentMethod;
export type PaymentGateway = PaymentMethod;

// ─── Canonical string constants for non-schema fields ────────────────────────

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

export type TransactionRefType =
  (typeof TransactionRefType)[keyof typeof TransactionRefType];
