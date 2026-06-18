import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Admin - Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN', 'MARKETING')
@Controller('admin/analytics')
export class AdminAnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'داشبورد اصلی KPI' })
  async getOverview() {
    const data = await this.analyticsService.getOverview();
    return { success: true, data };
  }

  @Get('financial')
  @ApiOperation({ summary: 'KPIs مالی: CAC, CLV, Churn Rate, NPS' })
  async getFinancial() {
    const data = await this.analyticsService.getFinancial();
    return { success: true, data };
  }

  @Get('cohort')
  @ApiOperation({ summary: 'Cohort table by signup month × retention months' })
  async getCohort() {
    const data = await this.analyticsService.getCohort();
    return { success: true, data };
  }

  @Get('heatmap')
  @ApiOperation({ summary: 'Hour-of-day activity heatmap' })
  async getHeatmap() {
    const data = await this.analyticsService.getHeatmap();
    return { success: true, data };
  }

  @Get('games')
  @ApiOperation({ summary: 'جدول کامل بازی‌ها' })
  async getGames() {
    const data = await this.analyticsService.getGames();
    return { success: true, data };
  }

  @Get('cashflow')
  @ApiOperation({ summary: 'جریان نقدی ۱۲ ماه اخیر' })
  async getCashflow() {
    const data = await this.analyticsService.getCashflow();
    return { success: true, data };
  }

  @Get('payment-methods')
  @ApiOperation({ summary: 'توزیع روش‌های پرداخت' })
  async getPaymentMethods() {
    const data = await this.analyticsService.getPaymentMethods();
    return { success: true, data };
  }

  @Get('gamification')
  @ApiOperation({ summary: 'آمار گیمیفیکیشن' })
  async getGamification() {
    const data = await this.analyticsService.getGamification();
    return { success: true, data };
  }
}
