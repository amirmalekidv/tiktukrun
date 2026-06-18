import { Injectable, Logger } from '@nestjs/common';
import { PrismaService }       from '../../../prisma/prisma.service';
import { DateTime }            from 'luxon';

const TEHRAN_TZ = 'Asia/Tehran';

export interface DiscountResult {
  discountAmount: bigint;
  finalPrice:     bigint;
  appliedCode?:   string;
  appliedAuto?:   string;
  breakdown:      DiscountBreakdown[];
}

interface DiscountBreakdown {
  name:   string;
  amount: bigint;
  type:   'code' | 'auto';
}

@Injectable()
export class DiscountResolverService {
  private readonly logger = new Logger(DiscountResolverService.name);

  constructor(private prisma: PrismaService) {}

  async resolveBest(
    userId:    string,
    gameId:    string,
    basePrice: bigint,
    code?:     string,
    slotDateTime?: Date,
  ): Promise<DiscountResult> {
    let codeDiscount  = 0n;
    let autoDiscount  = 0n;
    let appliedCode:  string | undefined;
    let appliedAuto:  string | undefined;
    const breakdown:  DiscountBreakdown[] = [];

    // ─── کد تخفیف ──────────────────────────────────────────────────────────
    if (code) {
      const discountCode = await this.prisma.discountCode.findFirst({
        where: {
          code,
          isActive:   true,
          validFrom:  { lte: new Date() },
          validUntil: { gte: new Date() },
        },
      });

      // بررسی maxUses جداگانه — prisma.model.fields فقط design-time است و runtime مقدار ندارد
      const maxUsesOk = discountCode
        ? (discountCode.maxUses === null || discountCode.usedCount < discountCode.maxUses)
        : false;

      if (discountCode && maxUsesOk) {
        // بررسی gameIds محدودیت
        const gameAllowed = !discountCode.gameIds?.length || discountCode.gameIds.includes(gameId);
        if (gameAllowed) {
          // minPurchase
          const minP = discountCode.minPurchase ?? 0n;
          if (basePrice >= minP) {
            codeDiscount = this.calcDiscount(
              basePrice,
              discountCode.type,
              discountCode.value,
              discountCode.maxDiscount ?? undefined,
            );
            appliedCode = code;
            breakdown.push({ name: `کد ${code}`, amount: codeDiscount, type: 'code' });
          }
        }
      }
    }

    // ─── تخفیف خودکار ──────────────────────────────────────────────────────
    const autoDiscounts = await this.prisma.autoDiscount.findMany({
      where: { isActive: true },
    });

    const userProfile = await this.prisma.userProfile.findUnique({
      where: { userId: userId },
      select: {
        totalSpent:     true,
        totalBookings:  true,
        birthDate:      true,
      },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { invitedById: true },
    });

    const now = DateTime.now().setZone(TEHRAN_TZ);

    for (const auto of autoDiscounts) {
      let matched = false;

      switch (auto.ruleType) {
        case 'VIP': {
          const vipThreshold = BigInt((auto.conditions as any)?.minSpent ?? 5_000_000);
          matched = (userProfile?.totalSpent ?? 0n) >= vipThreshold;
          break;
        }

        case 'WEEKLY': {
          // پنجشنبه = 4 (luxon weekday)، جمعه = 5
          const slot = slotDateTime
            ? DateTime.fromJSDate(slotDateTime, { zone: TEHRAN_TZ })
            : now;
          matched = slot.weekday === 4 || slot.weekday === 5;
          break;
        }

        case 'FIRST_BOOKING':
          matched = (userProfile?.totalBookings ?? 0) === 0;
          break;

        case 'BIRTHDAY':
          if (userProfile?.birthDate) {
            const bd = DateTime.fromJSDate(userProfile.birthDate, { zone: TEHRAN_TZ });
            matched  = bd.month === now.month && bd.day === now.day;
          }
          break;

        case 'INVITE':
          matched =
            !!user?.invitedById && (userProfile?.totalBookings ?? 0) === 0;
          break;

        default:
          break;
      }

      if (matched) {
        const amount = this.calcDiscount(
          basePrice,
          auto.type,
          auto.value,
          (auto.conditions as any)?.maxDiscount,
        );
        if (amount > autoDiscount) {
          autoDiscount = amount;
          appliedAuto  = auto.name;
        }
      }
    }

    if (autoDiscount > 0n) {
      breakdown.push({ name: appliedAuto!, amount: autoDiscount, type: 'auto' });
    }

    // ─── بهترین تخفیف ──────────────────────────────────────────────────────
    // بزرگ‌ترین تخفیف (code یا auto) اعمال می‌شود
    const totalDiscount = codeDiscount > autoDiscount ? codeDiscount : autoDiscount;
    const finalPrice    = basePrice - totalDiscount > 0n ? basePrice - totalDiscount : 0n;

    return {
      discountAmount: totalDiscount,
      finalPrice,
      appliedCode,
      appliedAuto,
      breakdown,
    };
  }

  private calcDiscount(
    base:        bigint,
    type:        string,
    value:       bigint | number,
    maxDiscount?: bigint | number,
  ): bigint {
    const val = BigInt(Math.round(Number(value)));
    let amount: bigint;

    if (type === 'PERCENT') {
      amount = (base * val) / 100n;
    } else {
      amount = val;
    }

    if (maxDiscount !== undefined && maxDiscount !== null) {
      const max = BigInt(Math.round(Number(maxDiscount)));
      if (amount > max) amount = max;
    }

    return amount > base ? base : amount;
  }
}
