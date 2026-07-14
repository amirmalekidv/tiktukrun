import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';
import {
  BranchScopeContext,
  applyBranchFilter,
  assertResourceInBranchScope,
  isBranchManagerRole,
} from '../../common/helpers/branch-scope.helper';

@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService) {}

  private toId(id: string | number | undefined | null): string | undefined {
    if (id === undefined || id === null || id === '') return undefined;
    return String(id);
  }

  private requireId(id: string | number, msg = 'شعبه یافت نشد'): string {
    const n = this.toId(id);
    if (n === undefined) throw new NotFoundException(msg);
    return n;
  }

  // ─── Public ────────────────────────────────────────────────────────────────

  async findActive(cityId?: string) {
    const cid = this.toId(cityId);
    return this.prisma.branch.findMany({
      where: {
        isActive: true,
        ...(cid !== undefined ? { cityId: cid } : {}),
      },
      include: { city: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOnePublic(id: string | number) {
    const bid = this.requireId(id);
    const branch = await this.prisma.branch.findFirst({
      where:   { id: bid, isActive: true },
      include: {
        city:  true,
        games: {
          where:   { isActive: true },
          include: { category: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!branch) throw new NotFoundException('شعبه یافت نشد');
    return branch;
  }

  // ─── Admin ─────────────────────────────────────────────────────────────────

  async findAllAdmin(
    scope: BranchScopeContext,
    cityId?: string,
    isActive?: boolean,
  ) {
    const cid = this.toId(cityId);
    const where: Record<string, unknown> = {
      ...(cid !== undefined ? { cityId: cid } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
    };

    applyBranchFilter(where, scope, 'id');

    return this.prisma.branch.findMany({
      where,
      include: {
        city: true,
        manager: { select: { id: true, fullName: true, mobile: true } },
        _count: { select: { games: true, bookings: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneAdmin(id: string | number, scope: BranchScopeContext) {
    const bid = this.requireId(id);
    const branch = await this.prisma.branch.findUnique({
      where:   { id: bid },
      include: {
        city: true,
        manager: { select: { id: true, fullName: true, mobile: true } },
        games: {
          include: { category: true },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { bookings: true } },
      },
    });
    if (!branch) throw new NotFoundException('شعبه یافت نشد');

    assertResourceInBranchScope(branch.id, scope, 'شعبه یافت نشد');
    return branch;
  }

  async findOne(id: string | number) {
    const bid = this.requireId(id);
    const branch = await this.prisma.branch.findUnique({
      where:   { id: bid },
      include: { city: true },
    });
    if (!branch) throw new NotFoundException('شعبه یافت نشد');
    return branch;
  }

  async create(dto: CreateBranchDto) {
    const cityId = this.toId((dto as any).cityId);
    if (cityId === undefined) throw new NotFoundException('شهر معتبر نیست');
    const managerId = this.toId((dto as any).managerId);
    return this.prisma.branch.create({
      data: {
        name:      dto.name,
        cityId:    cityId,
        address:   dto.address,
        phone:     dto.phone,
        lat:       dto.lat as any,
        lng:       dto.lng as any,
        ...(managerId !== undefined ? { managerId } : {}),
        isActive:  dto.isActive ?? true,
      },
      include: {
        city: true,
        manager: { select: { id: true, fullName: true, mobile: true } },
      },
    });
  }

  async updateAdmin(
    id: string | number,
    dto: UpdateBranchDto,
    scope: BranchScopeContext,
  ) {
    const bid = this.requireId(id);
    await this.findOneAdmin(bid, scope);

    if (isBranchManagerRole(scope.role)) {
      const allowed: UpdateBranchDto = {
        name: dto.name,
        address: dto.address,
        phone: dto.phone,
        lat: dto.lat,
        lng: dto.lng,
      };
      return this.prisma.branch.update({
        where: { id: bid },
        data: allowed,
        include: {
          city: true,
          manager: { select: { id: true, fullName: true, mobile: true } },
        },
      });
    }

    const data: any = { ...dto };
    if (data.cityId !== undefined) data.cityId = this.toId(data.cityId);
    if (data.managerId !== undefined) data.managerId = this.toId(data.managerId);

    return this.prisma.branch.update({
      where:   { id: bid },
      data,
      include: {
        city: true,
        manager: { select: { id: true, fullName: true, mobile: true } },
      },
    });
  }

  async update(id: string | number, dto: UpdateBranchDto) {
    const bid = this.requireId(id);
    await this.findOne(bid);
    const data: any = { ...dto };
    if (data.cityId !== undefined) data.cityId = this.toId(data.cityId);
    if (data.managerId !== undefined) data.managerId = this.toId(data.managerId);
    return this.prisma.branch.update({
      where:   { id: bid },
      data,
      include: { city: true },
    });
  }

  async remove(id: string | number) {
    const bid = this.requireId(id);
    await this.findOne(bid);
    return this.prisma.branch.update({
      where: { id: bid },
      data:  { isActive: false },
    });
  }
}
