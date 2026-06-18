/**
 * Booking Models — TIK TAK RUN Shared Types
 *
 * NOTE: Payment در wallet.ts به عنوان canonical تعریف شده
 *       (چون Payment هم به booking و هم به wallet charging مربوط است)
 *       و از اینجا re-export می‌شود.
 * NOTE: PlayerRating در اینجا تعریف شده چون مستقیماً به booking session مربوط است.
 */

import type { BookingStatus, PaymentMethod, PaymentStatus } from '../enums';
import type { Game } from './game';
import type { User } from './user';
import type { Payment } from './wallet';

// ─── Re-export Payment از wallet برای backward-compatibility ──────────────────
export type { Payment } from './wallet';

// ─── Booking ──────────────────────────────────────────────────────────────────

export interface Booking {
  id: number;
  /** کد یونیک ۸ کاراکتری */
  code: string;
  userId: number;
  gameId: number;
  branchId: number;
  slotDateTime: string;
  playersCount: number;
  /** BigInt → string (تومان) */
  basePrice: string;
  discountApplied: string;
  totalAmount: string;
  status: BookingStatus;
  paymentMethod: PaymentMethod;
  discountCodeId?: number;
  note?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  rewardsEarnedXp: number;
  rewardsEarnedCoins: number;
  createdAt: string;
  updatedAt: string;

  // Relations
  user?: Pick<User, 'id' | 'fullName' | 'mobile' | 'avatarUrl'>;
  game?: Game;
  payment?: Payment;
  review?: GameReview;
}

export interface BookingDetail extends Booking {
  user: Pick<User, 'id' | 'fullName' | 'mobile' | 'avatarUrl'>;
  game: Game;
}

// ─── Review ───────────────────────────────────────────────────────────────────

export interface GameReview {
  id: number;
  bookingId: number;
  userId: number;
  gameId: number;
  rating: number;
  text?: string;
  isApproved: boolean;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;

  user?: Pick<User, 'id' | 'fullName' | 'avatarUrl' | 'nickname'>;
}

// ─── Player Rating ────────────────────────────────────────────────────────────

/**
 * امتیاز بازیکن — ثبت شده توسط مدیر شعبه یا سیستم بعد از هر session
 * xpChange می‌تواند مثبت (پاداش) یا منفی (کسر) باشد
 */
export interface PlayerRating {
  id: number;
  /** شناسه کاربر رتبه‌دهنده (مدیر شعبه یا سیستم) */
  fromUserId: number;
  /** شناسه کاربر رتبه‌گیرنده */
  toUserId: number;
  /** شناسه رزرو مربوطه (اختیاری) */
  bookingId?: number;
  /** تغییر XP: مثبت = پاداش / منفی = کسر */
  xpChange: number;
  /** دلیل امتیاز (اختیاری) */
  reason?: string;
  createdAt: string;

  // Relations (optional)
  fromUser?: Pick<User, 'id' | 'fullName' | 'avatarUrl'>;
  toUser?: Pick<User, 'id' | 'fullName' | 'avatarUrl'>;
  booking?: Pick<Booking, 'id' | 'code' | 'slotDateTime'>;
}
