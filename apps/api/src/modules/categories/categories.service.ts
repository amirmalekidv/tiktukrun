import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  private toIntId(id: string | number): string {
    if (id === undefined || id === null || id === '') throw new NotFoundException('دسته‌بندی یافت نشد');
    return String(id);
  }

  async findAllActive() {
    return this.prisma.category.findMany({
      where:   { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async findAll() {
    return this.prisma.category.findMany({ orderBy: { displayOrder: 'asc' } });
  }

  async findOne(id: string | number) {
    const cid = this.toIntId(id);
    const cat = await this.prisma.category.findUnique({ where: { id: cid } });
    if (!cat) throw new NotFoundException('دسته‌بندی یافت نشد');
    return cat;
  }

  async create(dto: CreateCategoryDto) {
    const exists = await this.prisma.category.findFirst({ where: { slug: dto.slug } });
    if (exists) throw new ConflictException('slug تکراری است');

    return this.prisma.category.create({
      data: {
        name:         dto.name,
        slug:         dto.slug,
        icon:         dto.icon ?? 'fa-folder',
        color:        dto.color ?? '#8B0000',
        genre:        (dto.genre as any) ?? 'HORROR',
        displayOrder: (dto as any).displayOrder ?? 0,
        isActive:     dto.isActive ?? true,
      },
    });
  }

  async update(id: string | number, dto: UpdateCategoryDto) {
    const cid = this.toIntId(id);
    await this.findOne(cid);

    if (dto.slug) {
      const exists = await this.prisma.category.findFirst({
        where: { slug: dto.slug, NOT: { id: cid } },
      });
      if (exists) throw new ConflictException('slug تکراری است');
    }

    return this.prisma.category.update({ where: { id: cid }, data: dto as any });
  }

  async remove(id: string | number) {
    const cid = this.toIntId(id);
    await this.findOne(cid);
    return this.prisma.category.update({
      where: { id: cid },
      data:  { isActive: false },
    });
  }
}
