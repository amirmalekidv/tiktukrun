import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Gamification - Levels')
@Controller('levels')
export class LevelsController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'لیست ۲۰ لول با requiredXp و perks' })
  async findAll() {
    const levels = await this.prisma.level.findMany({
      orderBy: { requiredXp: 'asc' },
      take: 20,
    });
    return { success: true, data: levels };
  }
}
