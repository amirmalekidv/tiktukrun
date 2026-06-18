import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { IsObject, IsNumber, IsOptional } from 'class-validator';

class UpdateLevelDto {
  @IsOptional()
  @IsNumber()
  requiredXp?: number;

  @IsOptional()
  @IsObject()
  perks?: Record<string, any>;
}

@ApiTags('Admin - Levels')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/levels')
export class AdminLevelsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'لیست همه لول‌ها (ادمین)' })
  async findAll() {
    const levels = await this.prisma.level.findMany({
      orderBy: { id: 'asc' },
      include: {
        _count: { select: { profiles: true } } as any,
      },
    });
    return { success: true, data: levels };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'به‌روزرسانی requiredXp + perks' })
  async update(@Param('id') id: string, @Body() dto: UpdateLevelDto) {
    const level = await this.prisma.level.update({
      where: { id: Number(id) },
      data: {
        ...(dto.requiredXp !== undefined && {
          requiredXp: Number(dto.requiredXp),
        }),
        ...(dto.perks !== undefined && { perks: dto.perks }),
      },
    });
    return { success: true, data: level };
  }
}
