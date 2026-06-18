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
  BOOKING   = 'BOOKING',
  PAYMENT   = 'PAYMENT',
  LEVEL     = 'LEVEL',
  BADGE     = 'BADGE',
  WHEEL     = 'WHEEL',
  TEAM      = 'TEAM',
  CHAT      = 'CHAT',
  SYSTEM    = 'SYSTEM',
  PROMOTION = 'PROMOTION',
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
  TOP_PLAYER = 'TOP_PLAYER',
  TOP_TEAM   = 'TOP_TEAM',
  TOP_GAME   = 'TOP_GAME',
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
