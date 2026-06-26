import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SegmentEvaluator, SegmentConditions, SegmentRule } from './segment-evaluator';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Logger } from '@nestjs/common';

@Injectable()
export class SegmentsService {
  private readonly logger = new Logger(SegmentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly evaluator: SegmentEvaluator,
  ) {}

  private toIntId(id: string | number): string {
    const s = String(id);
    if (!s) throw new NotFoundException('سگمنت یافت نشد');
    return s;
  }

  private normalizeOp(op: string): SegmentRule['op'] {
    const map: Record<string, SegmentRule['op']> = {
      eq: '==',
      gte: '>=',
      lte: '<=',
      gt: '>',
      lt: '<',
      in: 'in',
      not_in: 'not_in',
      '==': '==',
      '>=': '>=',
      '<=': '<=',
      '>': '>',
      '<': '<',
    };
    return map[op] ?? (op as SegmentRule['op']);
  }

  private normalizeConditions(dto: any): SegmentConditions {
    const raw = dto.conditions ?? {
      rules: dto.rules ?? [],
      logic: dto.logic ?? 'AND',
    };
    return {
      logic: raw.logic ?? 'AND',
      rules: (raw.rules ?? []).map((r: any) => ({
        field: r.field,
        op: this.normalizeOp(r.op),
        value: r.value,
      })),
    };
  }

  async findAll() {
    const segments = await this.prisma.segment.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return segments.map((s) => ({
      ...s,
      count: s.cachedCount,
    }));
  }

  async preview(conditions: any): Promise<{ count: number }> {
    const normalized = this.normalizeConditions({ conditions });
    const users = await this.prisma.user.findMany({
      where: { deletedAt: null, isActive: true } as any,
      include: {
        profile: { include: { level: true } },
        _count: { select: { bookings: true } },
        bookings: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true },
        },
      } as any,
      take: 5000,
    });

    let count = 0;
    for (const user of users as any[]) {
      const userData = {
        ...user.profile,
        level: user.profile?.level,
        _count: user._count,
        lastBookingAt: user.bookings?.[0]?.createdAt,
      };
      if (this.evaluator.evaluate(normalized, userData)) count++;
    }
    return { count };
  }

  async create(dto: any) {
    const conditions = this.normalizeConditions(dto);
    const segment = await this.prisma.segment.create({
      data: {
        name: dto.name,
        conditions: conditions as any,
        color: dto.color ?? '#8B0000',
        icon: dto.icon ?? 'fa-users',
        cachedCount: 0,
      },
    });

    // Initial compute (best-effort)
    try {
      await this.evaluator.recompute(segment.id);
    } catch (e) {
      this.logger.warn(`Initial recompute failed for segment ${segment.id}: ${(e as any)?.message}`);
    }
    return this.prisma.segment.findUnique({ where: { id: segment.id } });
  }

  async update(id: string | number, dto: any) {
    const sid = this.toIntId(id);
    const updateData: any = {
      ...(dto.name && { name: dto.name }),
      ...(dto.color && { color: dto.color }),
      ...(dto.icon && { icon: dto.icon }),
    };
    if (dto.conditions || dto.rules) {
      updateData.conditions = this.normalizeConditions(dto);
    }

    const segment = await this.prisma.segment.update({
      where: { id: sid },
      data: updateData,
    });

    if (dto.conditions || dto.rules) {
      try {
        await this.evaluator.recompute(sid);
      } catch (e) {
        this.logger.warn(`Recompute failed: ${(e as any)?.message}`);
      }
    }

    return segment;
  }

  async delete(id: string | number) {
    const sid = this.toIntId(id);
    await this.prisma.userSegment.deleteMany({ where: { segmentId: sid } });
    await this.prisma.segment.delete({ where: { id: sid } });
    return { success: true };
  }

  async recompute(id: string | number) {
    const sid = this.toIntId(id);
    const count = await this.evaluator.recompute(sid);
    return { cachedCount: count };
  }

  async getMembers(id: string | number, limit = 100) {
    const sid = this.toIntId(id);
    return this.evaluator.getMembers(sid, limit);
  }

  /**
   * Daily cron: recompute all segments at 3:00 AM Tehran time
   */
  @Cron('0 3 * * *', {
    timeZone: 'Asia/Tehran',
    name: 'recompute_segments',
  })
  async recomputeAll() {
    this.logger.log('Starting daily segment recomputation...');
    const segments = await this.prisma.segment.findMany({
      select: { id: true, name: true },
    });

    for (const seg of segments) {
      try {
        const count = await this.evaluator.recompute(seg.id);
        this.logger.log(`Segment "${seg.name}": ${count} members`);
      } catch (err: any) {
        this.logger.error(`Failed to recompute segment ${seg.id}: ${err.message}`);
      }
    }

    this.logger.log(`Recomputed ${segments.length} segments`);
  }
}
