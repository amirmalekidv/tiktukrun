import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { CurrentUserPayload } from '@tiktakrun/shared-types';
import { Response } from 'express';
import { BookingsService }      from './services/bookings.service';
import { BookingsAdminService } from './services/bookings-admin.service';
import {
  BookingPreviewDto,
  CreateBookingDto,
  CancelBookingDto,
  AdminUpdateBookingStatusDto,
  RefundBookingDto,
  RatePlayerDto,
  BookingQueryDto,
  AdminCreateBookingDto,
} from './dto/booking.dto';
import { CurrentUser }  from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard }   from '../../common/guards/roles.guard';
import { Roles }        from '../../common/decorators/roles.decorator';
import {
  toBranchScope,
  resolveBranchFilter,
} from '../../common/helpers/branch-scope.helper';
import { BRANCH_OPS_ROLES, PLATFORM_ADMIN_ROLES } from '../../common/constants/admin-roles';

// ─── User Bookings ───────────────────────────────────────────────────────────
@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly svc: BookingsService) {}

  @Post('preview')
  preview(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: BookingPreviewDto,
  ) {
    return this.svc.preview(user.id, dto);
  }

  @Post()
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateBookingDto,
  ) {
    return this.svc.create(user.id, dto);
  }

  @Get('me')
  findMyBookings(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: BookingQueryDto,
  ) {
    return this.svc.findMyBookings(user.id, query);
  }

  @Get('me/:id')
  findMyBooking(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.svc.findMyBooking(user.id, id);
  }

  @Post('me/:id/cancel')
  cancelByUser(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() _dto: CancelBookingDto,
  ) {
    return this.svc.cancelByUser(user.id, id);
  }
}

// ─── Admin Bookings ───────────────────────────────────────────────────────────
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...BRANCH_OPS_ROLES)
@Controller('admin/bookings')
export class BookingsAdminController {
  constructor(private readonly svc: BookingsAdminService) {}

  @Get()
  findAll(
    @Query() query: BookingQueryDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.svc.findAll(query, toBranchScope(user));
  }

  @Get('calendar')
  getCalendar(
    @Query('branchId') branchId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const branchFilter = resolveBranchFilter(toBranchScope(user), branchId);
    return this.svc.getCalendar(branchFilter, from, to);
  }

  @Get('export')
  async exportExcel(
    @Query() query: BookingQueryDto,
    @CurrentUser() user: CurrentUserPayload,
    @Res() res: Response,
  ) {
    const csv = await this.svc.exportExcel(query, toBranchScope(user));
    res
      .status(HttpStatus.OK)
      .setHeader('Content-Type', 'text/csv; charset=utf-8')
      .setHeader('Content-Disposition', 'attachment; filename=bookings.csv')
      .send(csv);
  }

  @Post()
  async adminCreate(
    @Body() dto: AdminCreateBookingDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const data = await this.svc.adminCreate(dto, toBranchScope(user));
    return { success: true, data };
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.svc.findOne(id, toBranchScope(user));
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: AdminUpdateBookingStatusDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.svc.updateStatus(id, dto, toBranchScope(user));
  }

  @Roles(...PLATFORM_ADMIN_ROLES)
  @Post(':id/refund')
  refund(
    @Param('id') id: string,
    @Body() dto: RefundBookingDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.svc.refund(id, dto, toBranchScope(user));
  }

  @Post(':id/complete')
  complete(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.svc.complete(id, toBranchScope(user));
  }

  @Post(':id/rate-player')
  ratePlayer(
    @Param('id') id: string,
    @Body() dto: RatePlayerDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.svc.ratePlayer(id, dto, toBranchScope(user));
  }
}
