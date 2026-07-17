import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUserPayload } from '@tiktakrun/shared-types';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { resolveBranchFilter, toBranchScope } from '../../common/helpers/branch-scope.helper';
import { BRANCH_OPS_ROLES } from '../../common/constants/admin-roles';

@ApiTags('Admin - Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...BRANCH_OPS_ROLES, 'SUPPORT', 'MARKETING')
@Controller('admin/analytics')
export class AdminAnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  private scopeFor(user: CurrentUserPayload, branchId?: string) {
    return { branchFilter: resolveBranchFilter(toBranchScope(user), branchId) };
  }

  @Get('overview')
  @ApiOperation({ summary: 'داشبورد اصلی KPI' })
  async getOverview(
    @CurrentUser() user: CurrentUserPayload,
    @Query('format') format?: string,
    @Query('branchId') branchId?: string,
  ) {
    const scope = this.scopeFor(user, branchId);
    if (format === 'formatted') {
      const data = await this.analyticsService.getOverviewFormatted(scope);
      return { success: true, data };
    }
    const data = await this.analyticsService.getOverview(scope);
    return { success: true, data };
  }

  @Get('financial')
  @ApiOperation({ summary: 'KPIs مالی: CAC, CLV, Churn Rate, NPS' })
  async getFinancial(
    @CurrentUser() user: CurrentUserPayload,
    @Query('branchId') branchId?: string,
  ) {
    const data = await this.analyticsService.getFinancial(this.scopeFor(user, branchId));
    return { success: true, data };
  }

  @Get('cohort')
  @ApiOperation({ summary: 'Cohort table by signup month × retention months' })
  async getCohort(
    @CurrentUser() user: CurrentUserPayload,
    @Query('branchId') branchId?: string,
  ) {
    const data = await this.analyticsService.getCohort(this.scopeFor(user, branchId));
    return { success: true, data };
  }

  @Get('heatmap')
  @ApiOperation({ summary: 'Hour-of-day activity heatmap' })
  async getHeatmap(
    @CurrentUser() user: CurrentUserPayload,
    @Query('branchId') branchId?: string,
  ) {
    const data = await this.analyticsService.getHeatmap(this.scopeFor(user, branchId));
    return { success: true, data };
  }

  @Get('games')
  @ApiOperation({ summary: 'جدول کامل بازی‌ها' })
  async getGames(
    @CurrentUser() user: CurrentUserPayload,
    @Query('branchId') branchId?: string,
  ) {
    const data = await this.analyticsService.getGames(this.scopeFor(user, branchId));
    return { success: true, data };
  }

  @Get('cashflow')
  @ApiOperation({ summary: 'جریان نقدی ۱۲ ماه اخیر' })
  async getCashflow(
    @CurrentUser() user: CurrentUserPayload,
    @Query('branchId') branchId?: string,
  ) {
    const data = await this.analyticsService.getCashflow(this.scopeFor(user, branchId));
    return { success: true, data };
  }

  @Get('payment-methods')
  @ApiOperation({ summary: 'توزیع روش‌های پرداخت' })
  async getPaymentMethods(
    @CurrentUser() user: CurrentUserPayload,
    @Query('branchId') branchId?: string,
  ) {
    const data = await this.analyticsService.getPaymentMethods(this.scopeFor(user, branchId));
    return { success: true, data };
  }

  @Get('gamification')
  @ApiOperation({ summary: 'آمار گیمیفیکیشن' })
  async getGamification(
    @CurrentUser() user: CurrentUserPayload,
    @Query('branchId') branchId?: string,
  ) {
    const data = await this.analyticsService.getGamification(this.scopeFor(user, branchId));
    return { success: true, data };
  }
}
