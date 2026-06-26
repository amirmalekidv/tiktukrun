import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * [QA Fix 2026-05-25] Schema-aligned PipelineService
 *   - schema enum PipelineStage: LEADS, CONTACTED, PROPOSED, NEGOTIATING, CLOSED_WON, CLOSED_LOST
 *   - Deal has NO deletedAt (use hard delete)
 *   - Deal.id is Int (not string)
 */
export enum DealStage {
  LEADS = 'LEADS',
  CONTACTED = 'CONTACTED',
  PROPOSED = 'PROPOSED',
  NEGOTIATING = 'NEGOTIATING',
  CLOSED_WON = 'CLOSED_WON',
  CLOSED_LOST = 'CLOSED_LOST',
}

@Injectable()
export class PipelineService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(format?: string) {
    const deals = await this.prisma.deal.findMany({
      orderBy: [{ stage: 'asc' }, { position: 'asc' }],
      include: {
        customer: { select: { id: true, fullName: true, mobile: true } },
        owner: { select: { id: true, fullName: true } },
      },
    });

    const normalized = (deals as any[]).map((deal) => ({
      ...deal,
      value: deal.value?.toString() || '0',
      title: deal.name,
      name: deal.name,
    }));

    if (format === 'flat') {
      return normalized.map((deal) => ({
        ...deal,
        stage: deal.stage === 'LEADS' ? 'LEAD' : deal.stage,
      }));
    }

    const grouped: Record<string, any[]> = {};
    for (const stage of Object.values(DealStage)) {
      grouped[stage] = [];
    }
    for (const deal of normalized) {
      grouped[deal.stage] = grouped[deal.stage] ?? [];
      grouped[deal.stage].push(deal);
    }

    return grouped;
  }

  async create(dto: any) {
    const stageInput = dto.stage ?? DealStage.LEADS;
    const stage =
      stageInput === 'LEAD' ? DealStage.LEADS : stageInput;

    const maxPosition = await this.prisma.deal.aggregate({
      where: { stage: stage as any },
      _max: { position: true },
    });
    const position = (maxPosition._max.position ?? 0) + 1;

    return this.prisma.deal.create({
      data: {
        name: dto.name ?? dto.title,
        customerId: dto.customerId ? dto.customerId : null,
        value: Number(dto.value ?? 0),
        stage: stage as any,
        ownerId: dto.ownerId,
        tag: dto.tag,
        expectedCloseDate: dto.expectedCloseDate
          ? new Date(dto.expectedCloseDate)
          : undefined,
        notes: dto.notes,
        position,
      },
    });
  }

  async update(id: string, dto: any) {
    const did = id;
    const existing = await this.prisma.deal.findUnique({ where: { id: did } });
    if (!existing) throw new NotFoundException('Deal not found');

    return this.prisma.deal.update({
      where: { id: did },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.value !== undefined && { value: Number(dto.value) }),
        ...(dto.stage && { stage: dto.stage }),
        ...(dto.ownerId && { ownerId: dto.ownerId }),
        ...(dto.tag !== undefined && { tag: dto.tag }),
        ...(dto.expectedCloseDate && {
          expectedCloseDate: new Date(dto.expectedCloseDate),
        }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });
  }

  async move(id: string, newStage: string, newPosition: number) {
    const did = id;
    const deal = await this.prisma.deal.findUnique({ where: { id: did } });
    if (!deal) throw new NotFoundException('Deal not found');

    await this.prisma.deal.updateMany({
      where: {
        stage: newStage as any,
        position: { gte: newPosition },
        id: { not: did },
      },
      data: { position: { increment: 1 } },
    });

    return this.prisma.deal.update({
      where: { id: did },
      data: { stage: newStage as any, position: newPosition },
    });
  }

  async delete(id: string) {
    // No soft-delete column — hard delete
    return this.prisma.deal.delete({ where: { id: id } });
  }

  async getStats() {
    const deals = await this.prisma.deal.findMany({});

    const totalValue = (deals as any[]).reduce(
      (sum, d) => sum + Number(d.value ?? 0),
      0,
    );

    const byStage: Record<string, { count: number; value: number }> = {};
    for (const stage of Object.values(DealStage)) {
      const stageDeals = (deals as any[]).filter((d) => d.stage === stage);
      byStage[stage] = {
        count: stageDeals.length,
        value: stageDeals.reduce((s, d) => s + Number(d.value ?? 0), 0),
      };
    }

    const won = byStage[DealStage.CLOSED_WON]?.count ?? 0;
    const total = deals.length;
    const conversionRate = total > 0 ? Math.round((won / total) * 100) : 0;

    return {
      totalValue,
      totalDeals: total,
      byStage,
      conversionRate,
    };
  }
}
