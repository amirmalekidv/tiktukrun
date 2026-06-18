import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { BadgeService } from './badge.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEnum,
} from 'class-validator';

export enum BadgeRarity {
  COMMON = 'COMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY',
}

class CreateBadgeDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsEnum(BadgeRarity)
  rarity?: BadgeRarity;

  @IsOptional()
  @IsString()
  triggerEvent?: string;

  @IsOptional()
  conditions?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

class UpdateBadgeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  conditions?: Record<string, any>;
}

class GrantManualBadgeDto {
  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

@ApiTags('Admin - Badges')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/badges')
export class AdminBadgesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly badgeService: BadgeService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'لیست همه بج‌ها (ادمین)' })
  async findAll() {
    const badges = await this.prisma.badge.findMany({
      orderBy: { id: 'asc' },
      include: {
        _count: { select: { userBadges: true } },
      },
    });
    return { success: true, data: badges };
  }

  @Post()
  @ApiOperation({ summary: 'ایجاد بج جدید' })
  async create(@Body() dto: CreateBadgeDto) {
    const badge = await this.prisma.badge.create({
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description,
        icon: dto.icon,
        color: dto.color,
        criteria: {
          rarity: dto.rarity ?? BadgeRarity.COMMON,
          triggerEvent: dto.triggerEvent,
          conditions: dto.conditions,
        } as any,
        isActive: dto.isActive ?? true,
      },
    });
    return { success: true, data: badge };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'به‌روزرسانی بج' })
  async update(@Param('id') id: string, @Body() dto: UpdateBadgeDto) {
    const { rarity, triggerEvent, conditions, ...rest } = dto as any;
    const data: any = { ...rest };
    if (rarity !== undefined || triggerEvent !== undefined || conditions !== undefined) {
      const existing = await this.prisma.badge.findUnique({ where: { id } });
      const prevCriteria = (existing?.criteria as any) ?? {};
      data.criteria = {
        ...prevCriteria,
        ...(rarity !== undefined ? { rarity } : {}),
        ...(triggerEvent !== undefined ? { triggerEvent } : {}),
        ...(conditions !== undefined ? { conditions } : {}),
      };
    }
    const badge = await this.prisma.badge.update({
      where: { id },
      data,
    });
    return { success: true, data: badge };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'حذف بج' })
  async remove(@Param('id') id: string) {
    await this.prisma.badge.delete({ where: { id } });
  }

  @Post(':code/grant')
  @ApiOperation({ summary: 'اعطای دستی بج به کاربر' })
  async grantManual(
    @Param('code') code: string,
    @Body() dto: GrantManualBadgeDto,
    @CurrentUser() admin: any,
  ) {
    await this.badgeService.grantManual(
      dto.userId,
      code,
      admin.id,
      dto.reason ?? 'manual grant by admin',
    );
    return { success: true };
  }
}
