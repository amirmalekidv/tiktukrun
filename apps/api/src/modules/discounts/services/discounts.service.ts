import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService }           from '../../../prisma/prisma.service';
import { DiscountResolverService } from './discount-resolver.service';
import {
  ValidateDiscountDto,
  CreateDiscountCodeDto,
  UpdateDiscountCodeDto,
  CreateAutoDiscountDto,
  UpdateAutoDiscountDto,
} from '../dto/discount.dto';
import { parsePagination, buildPaginatedResponse } from '../../../common/helpers/pagination.helper';

@Injectable()
export class DiscountsService {
  constructor(
    private prisma:    PrismaService,
    private resolver:  DiscountResolverService,
  ) {}

  private toIntId(id: string | number | undefined): string | undefined {
    if (id === undefined || id === null || id === '') return undefined;
    return String(id);
  }

  private requireIntId(id: string | number, msg: string): string {
    const n = this.toIntId(id);
    if (n === undefined) throw new NotFoundException(msg);
    return n;
  }

  // ─── Public: Validate ──────────────────────────────────────────────────────
  async validate(userId: string | number, dto: ValidateDiscountDto) {
    const gameId = this.toIntId((dto as any).gameId);
    if (gameId === undefined) throw new NotFoundException('بازی یافت نشد');
    const game = await this.prisma.game.findFirst({
      where:  { id: gameId, isActive: true },
      select: { id: true, pricePerPerson: true, minPlayers: true, maxPlayers: true },
    });
    if (!game) throw new NotFoundException('بازی یافت نشد');

    if (dto.playersCount < game.minPlayers || dto.playersCount > game.maxPlayers) {
      throw new BadRequestException('تعداد بازیکنان معتبر نیست');
    }

    const basePriceNum = Number(game.pricePerPerson) * dto.playersCount;
    const basePrice = BigInt(basePriceNum);
    const uid = this.toIntId(userId) ?? '';
    const result    = await this.resolver.resolveBest(
      uid as any,
      gameId as any,
      basePrice,
      dto.code,
      new Date(dto.slotDateTime),
    );

    return {
      valid:          !!result.appliedCode || !!result.appliedAuto,
      basePrice:      basePrice.toString(),
      discountAmount: result.discountAmount.toString(),
      finalPrice:     result.finalPrice.toString(),
      breakdown:      result.breakdown.map((b: any) => ({
        ...b,
        amount: b.amount?.toString?.() ?? b.amount,
      })),
    };
  }

  // ─── Admin: Discount Codes ─────────────────────────────────────────────────
  async findAllCodes(query: any) {
    const { skip, take, page, limit } = parsePagination(query);
    const [items, total] = await Promise.all([
      this.prisma.discountCode.findMany({ skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.discountCode.count(),
    ]);
    return buildPaginatedResponse(items, total, page, limit);
  }

  async createCode(dto: CreateDiscountCodeDto) {
    const exists = await this.prisma.discountCode.findFirst({ where: { code: dto.code } });
    if (exists) throw new ConflictException('کد تکراری است');

    const targetSegmentId = this.toIntId((dto as any).targetSegmentId);

    return this.prisma.discountCode.create({
      data: {
        code:             dto.code,
        type:             dto.type as any,
        value:            Math.round(dto.value),
        minPurchase:      dto.minPurchase ? Math.round(dto.minPurchase) : 0,
        maxDiscount:      dto.maxDiscount ? Math.round(dto.maxDiscount) : null,
        validFrom:        dto.validFrom ? new Date(dto.validFrom) : null,
        validUntil:       dto.validUntil ? new Date(dto.validUntil) : null,
        maxUses:          dto.maxUses ?? null,
        ...(targetSegmentId !== undefined ? { targetSegmentId } : {}),
        isActive:         dto.isActive ?? true,
        usedCount:        0,
      } as any,
    });
  }

  async updateCode(id: string | number, dto: UpdateDiscountCodeDto) {
    const cid = this.requireIntId(id, 'کد تخفیف یافت نشد');
    const code = await this.prisma.discountCode.findUnique({ where: { id: cid } });
    if (!code) throw new NotFoundException('کد تخفیف یافت نشد');

    const data: any = { ...dto };
    if (dto.value !== undefined)      data.value       = Math.round(dto.value);
    if (dto.minPurchase !== undefined) data.minPurchase = Math.round(dto.minPurchase);
    if (dto.maxDiscount !== undefined) data.maxDiscount = Math.round(dto.maxDiscount);
    if (dto.validFrom)                data.validFrom   = new Date(dto.validFrom);
    if (dto.validUntil)               data.validUntil  = new Date(dto.validUntil);
    if (data.targetSegmentId !== undefined) data.targetSegmentId = this.toIntId(data.targetSegmentId);
    // gameIds is a relation (many-to-many) — strip if provided as scalar
    delete data.gameIds;

    return this.prisma.discountCode.update({ where: { id: cid }, data });
  }

  async deleteCode(id: string | number) {
    const cid = this.requireIntId(id, 'کد تخفیف یافت نشد');
    const code = await this.prisma.discountCode.findUnique({ where: { id: cid } });
    if (!code) throw new NotFoundException('کد تخفیف یافت نشد');
    return this.prisma.discountCode.delete({ where: { id: cid } });
  }

  async getCodeUsages(id: string | number, query: any) {
    const cid = this.requireIntId(id, 'کد تخفیف یافت نشد');
    const { skip, take, page, limit } = parsePagination(query);
    const [items, total] = await Promise.all([
      this.prisma.discountUsage.findMany({
        where:   { codeId: cid },
        skip,
        take,
        include: { booking: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.discountUsage.count({ where: { codeId: cid } }),
    ]);
    return buildPaginatedResponse(items, total, page, limit);
  }

  // ─── Admin: Auto Discounts ─────────────────────────────────────────────────
  async findAllAuto() {
    return this.prisma.autoDiscount.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async createAuto(dto: CreateAutoDiscountDto) {
    return this.prisma.autoDiscount.create({
      data: {
        name:       dto.name,
        type:       dto.type as any,
        value:      Math.round(dto.value),
        ruleType:   dto.ruleType as any,
        conditions: dto.conditions as any,
        isActive:   dto.isActive ?? true,
      },
    });
  }

  async updateAuto(id: string | number, dto: UpdateAutoDiscountDto) {
    const aid = this.requireIntId(id, 'تخفیف خودکار یافت نشد');
    const auto = await this.prisma.autoDiscount.findUnique({ where: { id: aid } });
    if (!auto) throw new NotFoundException('تخفیف خودکار یافت نشد');

    const data: any = { ...dto };
    if (dto.value !== undefined) data.value = Math.round(dto.value);

    return this.prisma.autoDiscount.update({ where: { id: aid }, data });
  }

  async deleteAuto(id: string | number) {
    const aid = this.requireIntId(id, 'تخفیف خودکار یافت نشد');
    const auto = await this.prisma.autoDiscount.findUnique({ where: { id: aid } });
    if (!auto) throw new NotFoundException('تخفیف خودکار یافت نشد');
    return this.prisma.autoDiscount.delete({ where: { id: aid } });
  }
}
