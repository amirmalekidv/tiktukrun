import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Gamification - Badges')
@Controller('badges')
export class BadgesController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'لیست بج‌های فعال' })
  async findAll() {
    const badges = await this.prisma.badge.findMany({
      where: { isActive: true },
      orderBy: { id: 'asc' },
    });
    return { success: true, data: badges };
  }
}
