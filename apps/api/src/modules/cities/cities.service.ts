import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCityDto, UpdateCityDto } from './dto/city.dto';

@Injectable()
export class CitiesService {
  constructor(private prisma: PrismaService) {}

  private toIntId(id: string | number): string {
    if (id === undefined || id === null || id === '') throw new NotFoundException('شهر یافت نشد');
    return String(id);
  }

  // ─── Public ────────────────────────────────────────────────────────────────

  async findAllActive() {
    return this.prisma.city.findMany({
      where:   { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });
  }

  // ─── Admin ─────────────────────────────────────────────────────────────────

  async findAll() {
    return this.prisma.city.findMany({ orderBy: { displayOrder: 'asc' } });
  }

  async findOne(id: string | number) {
    const cid = this.toIntId(id);
    const city = await this.prisma.city.findUnique({ where: { id: cid } });
    if (!city) throw new NotFoundException('شهر یافت نشد');
    return city;
  }

  async create(dto: CreateCityDto) {
    const exists = await this.prisma.city.findFirst({ where: { slug: dto.slug } });
    if (exists) throw new ConflictException('slug تکراری است');

    return this.prisma.city.create({
      data: {
        name:         dto.name,
        slug:         dto.slug,
        displayOrder: (dto as any).displayOrder ?? (dto as any).sortOrder ?? 0,
        isActive:     dto.isActive ?? true,
      },
    });
  }

  async update(id: string | number, dto: UpdateCityDto) {
    const cid = this.toIntId(id);
    await this.findOne(cid);

    if (dto.slug) {
      const exists = await this.prisma.city.findFirst({
        where: { slug: dto.slug, NOT: { id: cid } },
      });
      if (exists) throw new ConflictException('slug تکراری است');
    }

    return this.prisma.city.update({ where: { id: cid }, data: dto as any });
  }

  async remove(id: string | number) {
    const cid = this.toIntId(id);
    await this.findOne(cid);
    // soft delete
    return this.prisma.city.update({
      where: { id: cid },
      data:  { isActive: false },
    });
  }
}
