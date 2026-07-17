/**
 * Gamification Models — TIK TAK RUN Shared Types
 * Level, Badge, AvatarItem, Wheel, InviteCode, MonthlyWinner
 */

import type { LevelTier, AvatarItemType, WheelPrizeType, CurrencyType, MonthlyWinnerType } from '../enums';

// ─── Level ───────────────────────────────────────────────────────────────────

export interface Level {
  id: number;
  name: string;
  tier: LevelTier;
  requiredXp: number;
  perks?: LevelPerks;
  createdAt: string;
}

export interface LevelPerks {
  coinsBonus?: number;
  discountPercent?: number;
  badge?: string;
  specialAvatar?: number;
}

// ─── Badge ───────────────────────────────────────────────────────────────────

export interface Badge {
  id: number;
  code: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  criteria?: BadgeCriteria;
  isActive: boolean;
  createdAt: string;
}

export interface BadgeCriteria {
  type:
    | 'booking_count'
    | 'level'
    | 'tier'
    | 'horror_count'
    | 'escape_count'
    | 'team_games'
    | 'wheel_spins'
    | 'review_count'
    | 'speed_run';
  value: number | string;
}

export interface UserBadge {
  userId: number;
  badgeId: number;
  awardedAt: string;
  awardedBy?: number;
  badge?: Badge;
}

// ─── Avatar ──────────────────────────────────────────────────────────────────

export interface AvatarItem {
  id: number;
  code: string;
  name: string;
  type: AvatarItemType;
  icon: string;
  imageUrl?: string;
  requiredLevel: number;
  priceDiamonds?: number;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface UserAvatarItem {
  userId: number;
  itemId: number;
  isActive: boolean;
  purchasedAt: string;
  item?: AvatarItem;
}

// ─── Wheel ───────────────────────────────────────────────────────────────────

export interface WheelPrize {
  id: number;
  name: string;
  type: WheelPrizeType;
  value: number;
  probabilityWeight: number;
  color: string;
  icon: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WheelSpin {
  id: number;
  userId: number;
  paidWith: CurrencyType;
  costPaid: number;
  prizeId: number;
  prizeSnapshot: WheelPrizeSnapshot;
  awardedAt: string;

  prize?: WheelPrize;
}

export interface WheelPrizeSnapshot {
  name: string;
  type: WheelPrizeType;
  value: number;
  color?: string;
  icon?: string;
}

// ─── Invite ──────────────────────────────────────────────────────────────────

export interface InviteCode {
  id: number;
  userId: number;
  code: string;
  totalUses: number;
  totalRewardXp: number;
  createdAt: string;
}

export interface InviteUsage {
  id: number;
  codeId: number;
  invitedUserId: number;
  createdAt: string;
  rewardXpGiven: number;
}

// ─── Computed / View Models ───────────────────────────────────────────────────

/** اطلاعات گردونه برای نمایش در فرانت */
export interface WheelConfig {
  prizes: WheelPrize[];
  costCoins: number;
  costDiamonds: number;
  userCoins: number;
  userDiamonds: number;
}

/** نتیجه چرخش گردونه */
export interface WheelSpinResult {
  prizeIndex: number;
  prize: WheelPrizeSnapshot;
  spin: WheelSpin;
  newBalance: {
    coinsBalance: number;
    diamondsBalance: number;
    tomanBalance: string;
  };
}

/** اطلاعات لول کاربر */
export interface UserLevelInfo {
  currentLevel: Level;
  nextLevel?: Level;
  xp: number;
  xpToNextLevel: number;
  progressPercent: number;
  tier: LevelTier;
}

// ─── Monthly Winner (Polymorphic) ─────────────────────────────────────────────

/**
 * ماه‌نامه برندگان — ساختار polymorphic
 * هر رکورد فقط یکی از FKها را دارد بر اساس type:
 *   TOP_PLAYER / RAFFLE_WINNER → winnerUserId
 *   TOP_TEAM                  → winnerTeamId
 *   TOP_GAME                  → winnerGameId
 */
export interface MonthlyWinner {
  id: number;
  year: number;
  month: number;
  type: MonthlyWinnerType;

  /** شناسه کاربر برنده — برای TOP_PLAYER و RAFFLE_WINNER */
  winnerUserId?: number | null;
  /** شناسه تیم برنده — فقط برای TOP_TEAM */
  winnerTeamId?: number | null;
  /** شناسه بازی برنده — فقط برای TOP_GAME */
  winnerGameId?: number | null;

  prizeJson: MonthlyPrize;
  distributedAt?: string | null;
  distributedBy?: number | null;
  createdAt: string;

  // ─── Relation snapshots (optional, loaded on demand) ──────────
  /** اطلاعات کاربر برنده */
  winnerUser?: { id: number; fullName?: string | null; avatarUrl?: string | null };
  /** اطلاعات تیم برنده */
  winnerTeam?: { id: number; name: string };
  /** اطلاعات بازی برنده */
  winnerGame?: { id: number; title: string; slug: string };
}

export interface MonthlyPrize {
  toman?: number;
  badge?: string;
  title?: string;
  featuredBadge?: boolean;
  [key: string]: unknown;
}
