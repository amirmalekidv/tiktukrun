import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEnum,
} from 'class-validator';

class CreatePrizeDto {
  @IsString()
  name: string;

  @IsString()
  icon: string;

  @IsString()
  type: string; // COINS | DIAMONDS | XP | DISCOUNT | TICKET | CASH

  @IsNumber()
  value: number;

  @IsNumber()
  weight: number;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

class UpdatePrizeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  value?: number;
}

@ApiTags('Admin - Wheel')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/wheel')
export class AdminWheelController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('prizes')
  @ApiOperation({ summary: 'لیست همه جوایز (ادمین)' })
  async getPrizes() {
    const prizes = await this.prisma.wheelPrize.findMany({
      orderBy: { id: 'asc' },
    });
    return { success: true, data: prizes };
  }

  @Post('prizes')
  @ApiOperation({ summary: 'ایجاد جایزه جدید' })
  async createPrize(@Body() dto: CreatePrizeDto) {
    const prize = await this.prisma.wheelPrize.create({
      data: {
        name: dto.name,
        icon: dto.icon,
        type: dto.type as any,
        value: dto.value,
        probabilityWeight: dto.weight,
        color: (dto as any).color ?? '#8B0000',
        isActive: dto.isActive ?? true,
      },
    });
    return { success: true, data: prize };
  }

  @Patch('prizes/:id')
  @ApiOperation({ summary: 'به‌روزرسانی جایزه' })
  async updatePrize(@Param('id') id: string, @Body() dto: UpdatePrizeDto) {
    const prize = await this.prisma.wheelPrize.update({
      where: { id },
      data: dto,
    });
    return { success: true, data: prize };
  }

  @Delete('prizes/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'حذف جایزه' })
  async deletePrize(@Param('id') id: string) {
    await this.prisma.wheelPrize.delete({ where: { id } });
  }

  @Post('prizes/:id/toggle-active')
  @ApiOperation({ summary: 'فعال/غیرفعال‌کردن جایزه' })
  async toggleActive(@Param('id') id: string) {
    const prize = await this.prisma.wheelPrize.findUnique({ where: { id } });
    // FIX: null-check before accessing prize.isActive to prevent crash on missing prize
    if (!prize) {
      throw new NotFoundException(`جایزه با شناسه ${id} یافت نشد`);
    }
    const updated = await this.prisma.wheelPrize.update({
      where: { id },
      data: { isActive: !prize.isActive },
    });
    return { success: true, data: updated };
  }

  @Get('spins')
  @ApiOperation({ summary: 'تاریخچه چرخش‌ها' })
  async getSpins(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('userId') userId?: string,
    @Query('prizeType') prizeType?: string,
  ) {
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (userId) where.userId = userId;
    if (prizeType) where.prize = { type: prizeType };

    const [data, total] = await Promise.all([
      this.prisma.wheelSpin.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          user: { select: { id: true, fullName: true, mobile: true } },
          prize: true,
        },
        orderBy: { awardedAt: 'desc' } as any,
      }),
      this.prisma.wheelSpin.count({ where }),
    ]);

    return {
      success: true,
      data,
      meta: { total, page: Number(page), limit: Number(limit) },
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'آمار گردونه' })
  async getStats() {
    const [
      totalSpins,
      coinSpins,
      diamondSpins,
    ] = await Promise.all([
      this.prisma.wheelSpin.count(),
      this.prisma.wheelSpin.aggregate({
        where: { paidWith: 'COINS' as any },
        _sum: { costPaid: true } as any,
      }),
      this.prisma.wheelSpin.aggregate({
        where: { paidWith: 'DIAMONDS' as any },
        _sum: { costPaid: true } as any,
      }),
    ]);

    const prizeBreakdown = await (this.prisma.wheelSpin as any).groupBy({
      by: ['prizeId'],
      _count: true,
      orderBy: { _count: { prizeId: 'desc' } },
    });

    return {
      success: true,
      data: {
        totalSpins,
        totalPrizesGiven: totalSpins,
        totalCoinsSpent: Number((coinSpins._sum as any)?.costPaid ?? 0),
        totalDiamondsSpent: Number((diamondSpins._sum as any)?.costPaid ?? 0),
        prizeBreakdown,
      },
    };
  }
}
