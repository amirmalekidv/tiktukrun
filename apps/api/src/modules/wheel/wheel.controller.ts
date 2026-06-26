import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { WheelService, SpinCurrency } from './wheel.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';

class SpinDto {
  @Transform(({ value }) => String(value).toUpperCase())
  @IsEnum(['XP', 'COINS', 'DIAMONDS'])
  paidWith: SpinCurrency;
}

@ApiTags('Wheel')
@Controller('wheel')
export class WheelController {
  constructor(
    private readonly wheelService: WheelService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Get('prizes')
  @ApiOperation({ summary: 'لیست جوایز فعال گردونه' })
  async getPrizes() {
    const prizes = await this.prisma.wheelPrize.findMany({
      where: { isActive: true },
      orderBy: { id: 'asc' },
    });
    return { success: true, data: prizes };
  }

  @Get('me/eligibility')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'واجد شرایط چرخاندن گردونه' })
  async getEligibility(@CurrentUser() user: any) {
    const data = await this.wheelService.getEligibility(user.id);
    return { success: true, data };
  }

  /** Alias for web client: GET /wheel/eligibility */
  @Get('eligibility')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'واجد شرایط چرخاندن گردونه (alias)' })
  async getEligibilityAlias(@CurrentUser() user: any) {
    return this.getEligibility(user);
  }

  @Get('history')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'تاریخچه چرخش‌های گردونه' })
  async getHistory(
    @CurrentUser() user: any,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const data = await this.wheelService.getSpinHistory(
      user.id,
      Number(page),
      Number(limit),
    );
    return { success: true, ...data };
  }

  @Post('spin')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'چرخاندن گردونه' })
  async spin(@Body() dto: SpinDto, @CurrentUser() user: any) {
    const data = await this.wheelService.spin(user.id, dto.paidWith);
    return { success: true, data };
  }
}
