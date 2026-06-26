import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { CustomersService } from './customers.service';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IsString, IsOptional, IsBoolean, IsEmail } from 'class-validator';

class CreateCustomerDto {
  @IsString()
  name: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsBoolean()
  isVip?: boolean;

  @IsOptional()
  tags?: string[];
}

class AddNoteDto {
  @IsString()
  text: string;
}

@ApiTags('Admin - Customers CRM')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN', 'MARKETING')
@Controller('admin/customers')
export class AdminCustomersController {
  constructor(
    private readonly customersService: CustomersService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'لیست مشتریان با فیلتر پیشرفته' })
  async findAll(
    @Query('q') q?: string,
    @Query('status') status?: string,
    @Query('segmentId') segmentId?: string,
    @Query('ltvMin') ltvMin?: string,
    @Query('ltvMax') ltvMax?: string,
    @Query('sortBy') sortBy?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const result = await this.customersService.findAll(
      { q, status, segmentId, ltvMin, ltvMax, sortBy },
      Number(page),
      Number(limit),
    );
    return {
      success: true,
      ...result,
      meta: { page: Number(page), limit: Number(limit), total: result.total },
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'آمار کلی مشتریان' })
  async getStats() {
    const data = await this.customersService.getStats();
    return { success: true, data };
  }

  @Get('top-ltv')
  @ApiOperation({ summary: 'بالاترین LTV' })
  async getTopLtv(@Query('limit') limit = '10') {
    const data = await this.customersService.getTopLtv(Number(limit));
    return { success: true, data };
  }

  @Get('export')
  @ApiOperation({ summary: 'خروجی Excel مشتریان' })
  async exportCustomers(
    @Query('format') format = 'xlsx',
    @Res() res: Response,
  ) {
    // Basic CSV export (full Excel requires exceljs package)
    const result = await this.customersService.findAll({}, 1, 10000);
    const csvRows = [
      'نام,تلفن,ایمیل,LTV,سطح,آخرین فعالیت',
      ...result.data.map(
        (c) =>
          `${c.name},${c.phone},${c.email ?? ''},${c.ltv},${c.level},${c.lastActiveAt ?? ''}`,
      ),
    ];
    const csv = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="customers.csv"',
    );
    res.send('\uFEFF' + csv); // BOM for Persian
  }

  @Get(':id')
  @ApiOperation({ summary: 'جزئیات کامل مشتری' })
  async findOne(@Param('id') id: string) {
    const data = await this.customersService.findOne(id);
    return { success: true, data };
  }

  @Get(':id/bookings')
  @ApiOperation({ summary: 'رزروهای مشتری' })
  async getBookings(
    @Param('id') id: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const result = await this.customersService.getCustomerBookings(
      id,
      Number(page),
      Number(limit),
    );
    return { success: true, ...result };
  }

  @Get(':id/transactions')
  @ApiOperation({ summary: 'تراکنش‌های کیف پول مشتری' })
  async getTransactions(
    @Param('id') id: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const result = await this.customersService.getCustomerTransactions(
      id,
      Number(page),
      Number(limit),
    );
    return { success: true, ...result };
  }

  @Get(':id/reviews')
  @ApiOperation({ summary: 'نظرات مشتری' })
  async getReviews(
    @Param('id') id: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const result = await this.customersService.getCustomerReviews(
      id,
      Number(page),
      Number(limit),
    );
    return { success: true, ...result };
  }

  @Get(':id/notes')
  @ApiOperation({ summary: 'یادداشت‌های CRM مشتری' })
  async getNotes(@Param('id') id: string) {
    const result = await this.customersService.getCustomerNotes(id);
    return { success: true, ...result };
  }

  @Post()
  @ApiOperation({ summary: 'ایجاد مشتری جدید توسط ادمین' })
  async create(@Body() dto: CreateCustomerDto) {
    const data = await this.customersService.createCustomer(dto);
    return { success: true, data };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'به‌روزرسانی مشتری' })
  async update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    const data = await this.customersService.updateCustomer(id, dto);
    return { success: true, data };
  }

  @Post(':id/notes')
  @ApiOperation({ summary: 'افزودن یادداشت CRM' })
  async addNote(
    @Param('id') id: string,
    @Body() dto: AddNoteDto,
    @CurrentUser() admin: any,
  ) {
    const data = await this.customersService.addNote(id, dto.text, admin.id);
    return { success: true, data };
  }

  // ─── CRM aliases → UsersService (canonical: /admin/users/:id/*) ─────────────

  @Post(':id/ban')
  @ApiOperation({ summary: 'مسدودسازی مشتری (alias → /admin/users/:id/ban)' })
  async banCustomer(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @CurrentUser() admin: any,
  ) {
    const data = await this.usersService.adminBanUser(
      id,
      { reason: body.reason },
      admin.id,
    );
    return { success: true, data };
  }

  @Post(':id/unban')
  @ApiOperation({ summary: 'رفع مسدودیت مشتری' })
  async unbanCustomer(@Param('id') id: string, @CurrentUser() admin: any) {
    const data = await this.usersService.adminUnbanUser(id, admin.id);
    return { success: true, data };
  }

  @Post(':id/badge')
  @ApiOperation({ summary: 'اعطای بج (alias → grant-badge)' })
  async grantBadge(
    @Param('id') id: string,
    @Body() body: { badge?: string; badgeCode?: string; reason?: string },
    @CurrentUser() admin: any,
  ) {
    const data = await this.usersService.adminGrantBadge(
      id,
      { badgeCode: body.badgeCode ?? body.badge ?? '', reason: body.reason },
      admin.id,
    );
    return { success: true, data };
  }

  @Post(':id/xp')
  @ApiOperation({ summary: 'تنظیم XP (alias → adjust-xp)' })
  async adjustXp(
    @Param('id') id: string,
    @Body() body: { amount?: number; delta?: number; reason: string },
    @CurrentUser() admin: any,
  ) {
    const data = await this.usersService.adminAdjustXp(
      id,
      { delta: body.delta ?? body.amount ?? 0, reason: body.reason },
      admin.id,
    );
    return { success: true, data };
  }

  @Post(':id/wallet')
  @ApiOperation({ summary: 'تنظیم کیف پول (alias → adjust-wallet)' })
  async adjustWallet(
    @Param('id') id: string,
    @Body() body: {
      amount?: number;
      delta?: number;
      currency?: string;
      reason: string;
    },
    @CurrentUser() admin: any,
  ) {
    const data = await this.usersService.adminAdjustWallet(
      id,
      {
        currency: (body.currency ?? 'TOMAN') as any,
        delta: body.delta ?? body.amount ?? 0,
        reason: body.reason,
      },
      admin.id,
    );
    return { success: true, data };
  }
}
