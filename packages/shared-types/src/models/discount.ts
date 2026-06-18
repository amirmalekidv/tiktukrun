/**
 * Discount Models — TIK TAK RUN Shared Types
 */

import type { DiscountType, AutoDiscountRule } from '../enums';

export interface DiscountCode {
  id: number;
  code: string;
  name?: string;
  type: DiscountType;
  value: number;
  /** BigInt → string (تومان) */
  minPurchase: string;
  maxDiscount?: string;
  validFrom?: string;
  validUntil?: string;
  maxUses?: number;
  usedCount: number;
  isActive: boolean;
  targetSegmentId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DiscountUsage {
  id: number;
  codeId: number;
  userId: number;
  bookingId: number;
  /** BigInt → string */
  savedAmount: string;
  createdAt: string;
}

export interface AutoDiscount {
  id: number;
  name: string;
  type: DiscountType;
  value: number;
  ruleType: AutoDiscountRule;
  conditions?: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** نتیجه اعمال کد تخفیف */
export interface DiscountValidationResult {
  valid: boolean;
  discountCode?: DiscountCode;
  /** مبلغ تخفیف محاسبه‌شده (تومان) — BigInt → string */
  discountAmount: string;
  finalAmount: string;
  error?: string;
}
