/**
 * Wallet & Transaction & Payment Models — TIK TAK RUN Shared Types
 * BigInt → string در همه فیلدهای مالی
 *
 * این فایل canonical source برای Wallet، Transaction و Payment است.
 * booking.ts و سایر models از اینجا import می‌کنند.
 */

import type { TransactionType, CurrencyType, PaymentStatus, PaymentMethod } from '../enums';

// ─── Wallet ───────────────────────────────────────────────────────────────────

export interface Wallet {
  id: number;
  userId: number;
  /** BigInt → string (تومان) */
  tomanBalance: string;
  coinsBalance: number;
  diamondsBalance: number;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
}

/** خلاصه کیف پول برای header و نمایش سریع */
export interface WalletSummary {
  /** BigInt → string (تومان) */
  tomanBalance: string;
  coinsBalance: number;
  diamondsBalance: number;
  isLocked: boolean;
}

// ─── Transaction ──────────────────────────────────────────────────────────────

export interface Transaction {
  id: number;
  walletId: number;
  type: TransactionType;
  currency: CurrencyType;
  /** BigInt → string */
  amount: string;
  /** BigInt → string — موجودی بعد از تراکنش */
  balanceAfter: string;
  description?: string;
  /** نوع رفرنس: booking، wheel_spin، invite، monthly_reward، ... */
  refType?: string;
  refId?: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// ─── Payment ──────────────────────────────────────────────────────────────────
// CANONICAL SOURCE — booking.ts این را import و re-export می‌کند

export interface Payment {
  id: number;
  userId: number;
  /** شناسه رزرو مربوطه (اختیاری — پرداخت شارژ کیف پول bookingId ندارد) */
  bookingId?: number;
  walletId?: number;
  /** BigInt → string (تومان) */
  amount: string;
  method: PaymentMethod;
  status: PaymentStatus;
  /** نام درگاه پرداخت: zarinpal، idpay، ... */
  gateway?: string;
  /** کد authority درگاه */
  gatewayAuthority?: string;
  /** کد refId پس از موفقیت */
  gatewayRefId?: string;
  /** پاسخ خام درگاه برای ذخیره */
  gatewayResponse?: Record<string, unknown>;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Aggregates ───────────────────────────────────────────────────────────────

/** آمار مالی کاربر برای داشبورد ادمین */
export interface UserFinancialStats {
  /** BigInt → string */
  totalDeposited: string;
  totalSpent: string;
  totalRefunded: string;
  netRevenue: string;
  transactionCount: number;
  lastTransactionAt?: string;
}

/** آمار روزانه درآمد برای چارت */
export interface DailyRevenueStat {
  date: string;
  /** BigInt → string */
  revenue: string;
  bookingCount: number;
  newWalletDeposits: string;
}
