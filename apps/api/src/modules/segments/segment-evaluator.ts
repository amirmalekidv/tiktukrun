import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface SegmentRule {
  field: string;
  op: '>=' | '<=' | '>' | '<' | '==' | 'in' | 'not_in';
  value: any;
}

export interface SegmentConditions {
  rules: SegmentRule[];
  logic?: 'AND' | 'OR'; // default AND
  andTotal?: number;
  secondary?: SegmentRule;
}

@Injectable()
export class SegmentEvaluator {
  private readonly logger = new Logger(SegmentEvaluator.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Evaluate if a user matches segment conditions (with pre-loaded userData)
   */
  evaluate(conditions: SegmentConditions, userData: any): boolean {
    if (!conditions?.rules?.length) return true;

    const logic = conditions.logic ?? 'AND';
    const results = conditions.rules.map((rule) =>
      this.evaluateRule(rule, userData),
    );

    if (logic === 'AND') return results.every(Boolean);
    return results.some(Boolean);
  }

  private evaluateRule(rule: SegmentRule, data: any): boolean {
    const value = this.getFieldValue(rule.field, data);
    const target = rule.value;

    switch (rule.op) {
      case '>=':
        return Number(value) >= target;
      case '<=':
        return Number(value) <= target;
      case '>':
        return Number(value) > target;
      case '<':
        return Number(value) < target;
      case '==':
        return String(value) === String(target);
      case 'in':
        if (Array.isArray(target)) {
          if (Array.isArray(value)) {
            return value.some((v) => target.includes(v));
          }
          return target.includes(value);
        }
        return false;
      case 'not_in':
        if (Array.isArray(target)) return !target.includes(value);
        return value !== target;
      default:
        return false;
    }
  }

  private getFieldValue(field: string, data: any): any {
    const fieldMap: Record<string, () => any> = {
      ltv: () => Number(data.totalSpent ?? 0),
      level: () => data.level?.id ?? 1,
      xp: () => Number(data.xp ?? 0),
      lastBookingDays: () => {
        if (!data.lastBookingAt) return 999;
        const diffMs = Date.now() - new Date(data.lastBookingAt).getTime();
        return Math.floor(diffMs / 86400000);
      },
      totalBookings: () => data._count?.bookings ?? 0,
      createdDaysAgo: () => {
        const diffMs = Date.now() - new Date(data.createdAt).getTime();
        return Math.floor(diffMs / 86400000);
      },
      isVip: () => data.isVip === true,
      categorySlug: () =>
        data.bookings?.map((b: any) => b.game?.category?.slug) ?? [],
      city: () => data.city ?? '',
      tags: () => data.tags ?? [],
    };

    const fn = fieldMap[field];
    return fn ? fn() : data[field];
  }

  /**
   * Get all users matching a segment
   */
  async getMembers(segmentId: string, limit = 100): Promise<any[]> {
    const sid = String(segmentId);
    const segment = await this.prisma.segment.findUnique({
      where: { id: sid },
    });
    if (!segment) return [];

    const conditions = segment.conditions as unknown as SegmentConditions;

    // Fetch users with required data (level lives on UserProfile, not User)
    const users = await this.prisma.user.findMany({
      take: 5000,
      include: {
        profile: {
          include: {
            level: { select: { id: true, name: true } },
          },
        },
        _count: { select: { bookings: true } },
        bookings: {
          take: 20,
          include: {
            game: { include: { category: { select: { slug: true } } } },
          },
          orderBy: { createdAt: 'desc' },
        },
      } as any,
    });

    const matched = users.filter((u: any) => this.evaluate(conditions, u));
    return matched.slice(0, limit);
  }

  /**
   * Recompute a segment's member count
   */
  async recompute(segmentId: string): Promise<number> {
    const sid = String(segmentId);
    const members = await this.getMembers(sid, 10000);
    const count = members.length;

    await this.prisma.segment.update({
      where: { id: sid },
      data: {
        cachedCount: count,
        lastComputedAt: new Date(),
      } as any,
    });

    // Upsert segment memberships
    await this.prisma.userSegment.deleteMany({ where: { segmentId: sid } });
    if (members.length > 0) {
      await this.prisma.userSegment.createMany({
        data: members.map((m: any) => ({ userId: m.id, segmentId: sid })),
      });
    }

    this.logger.log(`Segment ${sid} recomputed: ${count} members`);
    return count;
  }
}
