import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';

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

  async findAll(cityId?: string, isActive?: boolean) {
    const cid = this.toId(cityId);
    return this.prisma.branch.findMany({
      where: {
        ...(cid !== undefined ? { cityId: cid } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
      include: { city: true },
      orderBy: { createdAt: 'desc' },
    });
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
      include: { city: true },
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
