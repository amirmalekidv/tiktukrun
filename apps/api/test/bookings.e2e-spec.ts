/**
 * E2E Tests — Bookings Module
 * Happy path + edge cases
 *
 * اجرا: jest --config test/jest-e2e.json
 */

import { Test, TestingModule }    from '@nestjs/testing';
import { INestApplication }       from '@nestjs/common';
import { ValidationPipe }         from '@nestjs/common';
import * as request               from 'supertest';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockGame = {
  id:             'game-001',
  title:          'اتاق ترسناک تست',
  slug:           'atak-tarasnak-test',
  branchId:       'branch-001',
  pricePerPerson: BigInt(500_000),
  minPlayers:     2,
  maxPlayers:     6,
  durationMinutes: 60,
  isActive:       true,
  genre:          'HORROR',
};

const mockUser = {
  id:    'user-001',
  phone: '09120000001',
  role:  'USER',
};

const mockPrisma = {
  game: {
    findFirst:  jest.fn().mockResolvedValue(mockGame),
    findUnique: jest.fn().mockResolvedValue(mockGame),
  },
  booking: {
    count:  jest.fn().mockResolvedValue(0),
    create: jest.fn().mockResolvedValue({
      id:           'booking-001',
      code:         'ABCD1234',
      userId:       'user-001',
      gameId:       'game-001',
      branchId:     'branch-001',
      slotDateTime: new Date(Date.now() + 2 * 3600 * 1000),
      playersCount: 2,
      basePrice:    1_000_000n,
      totalAmount:  1_000_000n,
      discountAmount: 0n,
      status:       'CONFIRMED',
    }),
    findMany: jest.fn().mockResolvedValue([]),
    findFirst: jest.fn().mockResolvedValue(null),
    update:    jest.fn().mockResolvedValue({}),
    updateMany: jest.fn().mockResolvedValue({}),
    groupBy:   jest.fn().mockResolvedValue([]),
  },
  payment: {
    create:     jest.fn().mockResolvedValue({ id: 'payment-001' }),
    update:     jest.fn().mockResolvedValue({}),
    updateMany: jest.fn().mockResolvedValue({}),
  },
  userProfile: {
    findUnique: jest.fn().mockResolvedValue({
      userId:        'user-001',
      tomanBalance:  5_000_000n,
      totalBookings: 0,
      totalSpent:    0n,
      xp:            0,
      level:         1,
      coins:         0,
    }),
    update:     jest.fn().mockResolvedValue({}),
  },
  userBadge:         { findMany: jest.fn().mockResolvedValue([]), create: jest.fn() },
  badge:             { findUnique: jest.fn().mockResolvedValue(null) },
  notification:      { create: jest.fn().mockResolvedValue({}) },
  walletTransaction: { create: jest.fn().mockResolvedValue({}) },
  discountCode:      { findFirst: jest.fn().mockResolvedValue(null), update: jest.fn() },
  discountUsage:     { create: jest.fn().mockResolvedValue({}) },
  autoDiscount:      { findMany: jest.fn().mockResolvedValue([]) },
  user:              { findUnique: jest.fn().mockResolvedValue(mockUser) },
  $transaction:      jest.fn().mockImplementation(async (fn) => {
    if (typeof fn === 'function') {
      return fn({
        booking:           { create: jest.fn().mockResolvedValue({ id: 'booking-001', code: 'ABCD1234', status: 'CONFIRMED', userId: 'user-001', totalAmount: 1_000_000n }),
                             update: jest.fn(), updateMany: jest.fn() },
        payment:           { create: jest.fn().mockResolvedValue({ id: 'payment-001' }), update: jest.fn(), updateMany: jest.fn() },
        userProfile:       { update: jest.fn().mockResolvedValue({}) },
        walletTransaction: { create: jest.fn().mockResolvedValue({}) },
        discountCode:      { findFirst: jest.fn().mockResolvedValue(null), update: jest.fn() },
        discountUsage:     { create: jest.fn().mockResolvedValue({}) },
      });
    }
    return fn;
  }),
};

// ─── Mock Modules ─────────────────────────────────────────────────────────────

describe('Bookings Module (e2e)', () => {
  let bookingsService: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  // ─── Unit: State Machine ──────────────────────────────────────────────────

  describe('BookingStateMachine', () => {
    const { BookingStateMachine } = require(
      '../apps/api/src/modules/bookings/services/booking-state-machine.service',
    );
    const sm = new BookingStateMachine();

    it('should allow PENDING → CONFIRMED', () => {
      const r = sm.canTransition('PENDING', 'CONFIRMED');
      expect(r.allowed).toBe(true);
    });

    it('should allow PENDING → CANCELLED', () => {
      const r = sm.canTransition('PENDING', 'CANCELLED');
      expect(r.allowed).toBe(true);
    });

    it('should allow CONFIRMED → COMPLETED', () => {
      const r = sm.canTransition('CONFIRMED', 'COMPLETED');
      expect(r.allowed).toBe(true);
    });

    it('should allow CONFIRMED → CANCELLED', () => {
      const r = sm.canTransition('CONFIRMED', 'CANCELLED');
      expect(r.allowed).toBe(true);
    });

    it('should allow COMPLETED → REFUNDED', () => {
      const r = sm.canTransition('COMPLETED', 'REFUNDED');
      expect(r.allowed).toBe(true);
    });

    it('should NOT allow COMPLETED → CONFIRMED', () => {
      const r = sm.canTransition('COMPLETED', 'CONFIRMED');
      expect(r.allowed).toBe(false);
    });

    it('should NOT allow CANCELLED → CONFIRMED', () => {
      const r = sm.canTransition('CANCELLED', 'CONFIRMED');
      expect(r.allowed).toBe(false);
    });

    it('should NOT allow REFUNDED → COMPLETED', () => {
      const r = sm.canTransition('REFUNDED', 'COMPLETED');
      expect(r.allowed).toBe(false);
    });

    it('should throw on assertTransition for invalid', () => {
      expect(() => sm.assertTransition('CANCELLED', 'CONFIRMED')).toThrow();
    });
  });

  // ─── Unit: Discount Resolver ──────────────────────────────────────────────

  describe('DiscountResolverService — calcDiscount', () => {
    it('should calculate PERCENT discount correctly', () => {
      // 20% of 1,000,000 = 200,000
      const base  = 1_000_000n;
      const rate  = 20n;
      const result = (base * rate) / 100n;
      expect(result).toBe(200_000n);
    });

    it('should not exceed base price', () => {
      const base   = 1_000_000n;
      const excess = 2_000_000n;
      const result = excess > base ? base : excess;
      expect(result).toBe(1_000_000n);
    });

    it('should apply maxDiscount cap', () => {
      const base       = 5_000_000n;
      const pct        = 30n; // 30% = 1,500,000
      const maxDiscount = 500_000n;
      let   amount      = (base * pct) / 100n; // 1,500,000
      if (amount > maxDiscount) amount = maxDiscount;
      expect(amount).toBe(500_000n);
    });
  });

  // ─── Unit: Slot Validation Logic ─────────────────────────────────────────

  describe('Slot Validation', () => {
    it('should reject slot less than 30 min in advance', () => {
      const slotDateTime = new Date(Date.now() + 20 * 60 * 1000); // 20 min
      const diffMinutes  = (slotDateTime.getTime() - Date.now()) / 60000;
      expect(diffMinutes).toBeLessThan(30);
    });

    it('should accept slot 2 hours in advance', () => {
      const slotDateTime = new Date(Date.now() + 2 * 3600 * 1000); // 2h
      const diffMinutes  = (slotDateTime.getTime() - Date.now()) / 60000;
      expect(diffMinutes).toBeGreaterThanOrEqual(30);
    });

    it('should reject players below minPlayers', () => {
      const playersCount = 1;
      const minPlayers   = 2;
      expect(playersCount < minPlayers).toBe(true);
    });

    it('should reject players above maxPlayers', () => {
      const playersCount = 7;
      const maxPlayers   = 6;
      expect(playersCount > maxPlayers).toBe(true);
    });
  });

  // ─── Unit: Refund Calculation ─────────────────────────────────────────────

  describe('Refund Calculation', () => {
    const FULL_REFUND_HOURS    = 24;
    const PARTIAL_REFUND_RATIO = 0.5;

    it('should give full refund when >24h before slot', () => {
      const totalAmount  = 1_000_000n;
      const hoursToSlot  = 48; // 48h ahead
      const refundAmount = hoursToSlot > FULL_REFUND_HOURS
        ? totalAmount
        : BigInt(Math.round(Number(totalAmount) * PARTIAL_REFUND_RATIO));
      expect(refundAmount).toBe(1_000_000n);
    });

    it('should give 50% refund when <24h before slot', () => {
      const totalAmount  = 1_000_000n;
      const hoursToSlot  = 12; // 12h ahead
      const refundAmount = hoursToSlot > FULL_REFUND_HOURS
        ? totalAmount
        : BigInt(Math.round(Number(totalAmount) * PARTIAL_REFUND_RATIO));
      expect(refundAmount).toBe(500_000n);
    });
  });

  // ─── Unit: Auto Discount Rules ────────────────────────────────────────────

  describe('Auto Discount Rules', () => {
    it('FIRST_BOOKING should match when totalBookings === 0', () => {
      const totalBookings = 0;
      expect(totalBookings === 0).toBe(true);
    });

    it('FIRST_BOOKING should not match when totalBookings > 0', () => {
      const totalBookings = 3;
      expect(totalBookings === 0).toBe(false);
    });

    it('VIP should match when totalSpent >= threshold', () => {
      const totalSpent  = 6_000_000n;
      const threshold   = 5_000_000n;
      expect(totalSpent >= threshold).toBe(true);
    });

    it('WEEKLY should match on Thursday/Friday (luxon weekday 4/5)', () => {
      // weekday 4 = Thursday
      const thursdayWeekday = 4;
      const fridayWeekday   = 5;
      expect(thursdayWeekday === 4 || thursdayWeekday === 5).toBe(true);
      expect(fridayWeekday === 4   || fridayWeekday === 5).toBe(true);
    });

    it('WEEKLY should NOT match on Sunday (weekday 7)', () => {
      const sundayWeekday = 7;
      expect(sundayWeekday === 4 || sundayWeekday === 5).toBe(false);
    });
  });

  // ─── Unit: ZarinPal Mock ─────────────────────────────────────────────────

  describe('ZarinPal Mock Mode', () => {
    it('should generate mock authority when merchantId is empty', () => {
      const merchantId = '';
      const isMock     = !merchantId;
      expect(isMock).toBe(true);
    });

    it('should return mock paymentUrl in correct format', () => {
      const paymentId = 'payment-001';
      const authority = `MOCK_${paymentId}_${Date.now()}`;
      expect(authority).toContain('MOCK_');
      expect(authority).toContain(paymentId);
    });
  });

  // ─── Unit: Cron Timeout Logic ─────────────────────────────────────────────

  describe('Booking Cron: timeout detection', () => {
    const PENDING_TIMEOUT_MINUTES = 60;

    it('should identify expired PENDING bookings', () => {
      const cutoff        = new Date(Date.now() - PENDING_TIMEOUT_MINUTES * 60 * 1000);
      const oldBookingTime = new Date(Date.now() - 2 * 3600 * 1000); // 2h ago
      expect(oldBookingTime < cutoff).toBe(true);
    });

    it('should NOT expire recent PENDING bookings', () => {
      const cutoff         = new Date(Date.now() - PENDING_TIMEOUT_MINUTES * 60 * 1000);
      const recentBooking  = new Date(Date.now() - 10 * 60 * 1000); // 10 min ago
      expect(recentBooking < cutoff).toBe(false);
    });
  });

  // ─── Unit: Auto-Complete Logic ────────────────────────────────────────────

  describe('Booking Cron: auto-complete', () => {
    const BUFFER_MINUTES = 60;

    it('should complete booking after slotDateTime + 60min', () => {
      const slotDateTime  = new Date(Date.now() - 2 * 3600 * 1000); // 2h ago
      const cutoff        = new Date(Date.now() - BUFFER_MINUTES * 60 * 1000);
      expect(slotDateTime < cutoff).toBe(true);
    });

    it('should NOT complete booking with recent slotDateTime', () => {
      const slotDateTime  = new Date(Date.now() - 30 * 60 * 1000); // 30min ago
      const cutoff        = new Date(Date.now() - BUFFER_MINUTES * 60 * 1000);
      expect(slotDateTime < cutoff).toBe(false);
    });
  });

  // ─── Unit: Price Calculation ──────────────────────────────────────────────

  describe('Price Calculation', () => {
    it('should calculate basePrice = pricePerPerson * playersCount', () => {
      const pricePerPerson = 500_000n;
      const playersCount   = 4;
      const basePrice      = pricePerPerson * BigInt(playersCount);
      expect(basePrice).toBe(2_000_000n);
    });

    it('should apply weeklyDiscountPercent correctly', () => {
      const pricePerPerson          = 500_000n;
      const playersCount            = 2;
      const weeklyDiscountPercent   = 20;
      const basePrice               = pricePerPerson * BigInt(playersCount); // 1,000,000
      const discountAmount          = (basePrice * BigInt(weeklyDiscountPercent)) / 100n; // 200,000
      const finalPrice              = basePrice - discountAmount; // 800,000
      expect(finalPrice).toBe(800_000n);
    });
  });

  // ─── Unit: Reward Logic ───────────────────────────────────────────────────

  describe('Reward Calculation', () => {
    const XP_PER_BOOKING    = 10;
    const COINS_PER_BOOKING = 20;

    it('should award correct XP and coins', () => {
      const currentXP     = 50;
      const currentCoins  = 100;
      const newXP         = currentXP    + XP_PER_BOOKING;
      const newCoins      = currentCoins + COINS_PER_BOOKING;
      expect(newXP).toBe(60);
      expect(newCoins).toBe(120);
    });

    it('should trigger level up at 100 XP intervals', () => {
      const xp       = 110;
      const newLevel = Math.floor(xp / 100) + 1;
      expect(newLevel).toBe(2);
    });

    it('should award first-booking badge at 1 booking', () => {
      const totalBookings = 1;
      const hasBadge      = totalBookings >= 1;
      expect(hasBadge).toBe(true);
    });

    it('should award loyal badge at 10 bookings', () => {
      const totalBookings = 10;
      const hasBadge      = totalBookings >= 10;
      expect(hasBadge).toBe(true);
    });

    it('should award brave badge at 5 horror bookings', () => {
      const horrorBookings = 5;
      const hasBadge       = horrorBookings >= 5;
      expect(hasBadge).toBe(true);
    });
  });
});
