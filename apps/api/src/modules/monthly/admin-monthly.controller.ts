import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MonthlyService } from './monthly.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { IsOptional, IsObject } from 'class-validator';

class DistributeDto {
  @IsOptional()
  year?: number;

  @IsOptional()
  month?: number;

  @IsOptional()
  @IsObject()
  customPrizes?: {
    raffleWinner?: { xp?: number; coins?: number; diamonds?: number; discountCode?: boolean; freeTicket?: boolean };
    topPlayer?: { xp?: number; coins?: number; discountCode?: boolean; freeTicket?: boolean };
    topTeam?: { coins?: number; discountPercent?: number };
    topGame?: { xp?: number; coins?: number };
  };
}

@ApiTags('Monthly Raffle')
@Controller('monthly')
export class MonthlyController {
  constructor(private readonly monthlyService: MonthlyService) {}

  @Public()
  @Get('raffle')
  @ApiOperation({ summary: 'نمای عمومی قرعه‌کشی ماهانه' })
  async getRaffle(
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    return this.monthlyService.getPublicRaffleOverview(
      year ? Number(year) : undefined,
      month ? Number(month) : undefined,
    );
  }
}

@ApiTags('Admin - Monthly Rewards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/monthly')
export class AdminMonthlyController {
  constructor(private readonly monthlyService: MonthlyService) {}

  @Get('winners')
  @ApiOperation({ summary: 'برندگان ماه مشخص' })
  async getWinners(
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    const now = new Date();
    const y = year ? Number(year) : now.getFullYear();
    const m = month ? Number(month) : now.getMonth() + 1;
    const data = await this.monthlyService.getWinners(y, m);
    return { success: true, data };
  }

  @Post('compute')
  @ApiOperation({ summary: 'محاسبه برندگان ماه' })
  async compute(
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    const now = new Date();
    const y = year ? Number(year) : now.getFullYear();
    const m = month ? Number(month) : now.getMonth() + 1;
    const data = await this.monthlyService.compute(y, m);
    return { success: true, data };
  }

  @Post('distribute')
  @ApiOperation({ summary: 'توزیع جوایز ماهانه' })
  async distribute(@Body() dto: DistributeDto) {
    const now = new Date();
    const y = dto.year ?? now.getFullYear();
    const m = dto.month ?? now.getMonth() + 1;
    await this.monthlyService.distribute(y, m, dto.customPrizes ?? null);
    return { success: true, message: 'جوایز توزیع شد' };
  }

  @Get('history')
  @ApiOperation({ summary: 'تاریخچه برندگان ۲۴ ماه' })
  async getHistory() {
    const data = await this.monthlyService.getHistory();
    return { success: true, data };
  }
}
