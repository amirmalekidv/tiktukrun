/**
 * User Models — TIK TAK RUN Shared Types
 * BigInt فیلدها به صورت string در API
 *
 * NOTE: Level, Badge, AvatarItem و مشتقات آن‌ها در gamification.ts تعریف شده‌اند
 *       و از آنجا import می‌شوند تا از تعریف تکراری جلوگیری شود.
 * NOTE: Wallet در wallet.ts تعریف شده و از آنجا import می‌شود.
 */

import type { UserRole, Gender, LevelTier } from '../enums';
import type { Level, UserBadge, UserAvatarItem } from './gamification';
import type { Wallet } from './wallet';

// ─── Re-exports برای backward-compatibility و راحتی consumer ها ──────────────
// gamification types که با User ارتباط نزدیک دارند
export type { Level, LevelPerks, Badge, BadgeCriteria, UserBadge, AvatarItem, UserAvatarItem } from './gamification';
// Wallet از wallet.ts
export type { Wallet } from './wallet';

// ─── Role ─────────────────────────────────────────────────────────────────────

export interface UserRoleAssignment {
  userId: number;
  role: UserRole;
  createdAt: string;
  grantedBy?: number;
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  mobile: string;
  email?: string;
  fullName?: string;
  nickname?: string;
  avatarUrl?: string;
  /** تنظیمات آواتار: {hatId, glassesId, skinId, effectId, backgroundId} */
  avatarConfig?: AvatarConfig;
  isActive: boolean;
  isBanned: boolean;
  isMuted: boolean;
  mutedUntil?: string;
  inviteCode: string;
  invitedById?: number;
  lastLoginAt?: string;
  lastIp?: string;
  settings?: UserSettings;
  createdAt: string;
  updatedAt: string;

  // Relations (optional — loaded on demand)
  profile?: Profile;
  wallet?: Wallet;
  roleAssignments?: UserRoleAssignment[];
  userBadges?: UserBadge[];
  userAvatarItems?: UserAvatarItem[];
}

export interface AvatarConfig {
  hatId?: number;
  glassesId?: number;
  skinId?: number;
  effectId?: number;
  backgroundId?: number;
}

export interface UserSettings {
  notifications?: {
    inapp?: boolean;
    sms?: boolean;
    email?: boolean;
  };
  language?: 'fa' | 'en';
  theme?: 'dark' | 'light';
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export interface Profile {
  id: number;
  userId: number;
  levelId: number;
  xp: number;
  totalBookings: number;
  successfulBookings: number;
  /** BigInt → string در API */
  totalSpent: string;
  averageRating?: string;
  fearLevel: string;
  bio?: string;
  instagramHandle?: string;
  telegramHandle?: string;
  birthDate?: string;
  gender?: Gender;
  address?: string;
  cityId?: number;
  statsCache?: ProfileStatsCache;
  createdAt: string;
  updatedAt: string;

  // Relations
  level?: Level;
}

export interface ProfileStatsCache {
  savesCount?: number;
  completedRooms?: number;
  badgesCount?: number;
  wheelSpinsCount?: number;
  reviewsCount?: number;
}

// ─── Public View ──────────────────────────────────────────────────────────────

/** View model برای پروفایل عمومی کاربر */
export interface PublicUserProfile {
  id: number;
  fullName?: string;
  nickname?: string;
  avatarUrl?: string;
  avatarConfig?: AvatarConfig;
  levelId: number;
  levelName: string;
  levelTier: LevelTier;
  xp: number;
  totalBookings: number;
  badges: UserBadge[];
}
