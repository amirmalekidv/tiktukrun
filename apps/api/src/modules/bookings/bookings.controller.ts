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
import { CurrentUserPayload, UserRole } from '@tiktakrun/shared-types';
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
import { resolveBranchScope } from '../../common/helpers/branch-scope.helper';

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
@Roles(UserRole.BRANCH_MANAGER)
@Controller('admin/bookings')
export class BookingsAdminController {
  constructor(private readonly svc: BookingsAdminService) {}

  @Get()
  findAll(
    @Query() query: BookingQueryDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.svc.findAll(query, user.role, user.branchId);
  }

  @Get('calendar')
  getCalendar(
    @Query('branchId') branchId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const scopedBranch = resolveBranchScope(
      user.role,
      user.branchId,
      branchId,
    );
    return this.svc.getCalendar(scopedBranch, from, to);
  }

  @Get('export')
  async exportExcel(
    @Query() query: BookingQueryDto,
    @CurrentUser() user: CurrentUserPayload,
    @Res() res: Response,
  ) {
    const csv = await this.svc.exportExcel(query, user.role, user.branchId);
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
    const data = await this.svc.adminCreate(dto, user.role, user.branchId);
    return { success: true, data };
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.svc.findOne(id, user.role, user.branchId);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: AdminUpdateBookingStatusDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.svc.updateStatus(id, dto, user.role, user.branchId);
  }

  @Roles(UserRole.ADMIN)
  @Post(':id/refund')
  refund(
    @Param('id') id: string,
    @Body() dto: RefundBookingDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.svc.refund(id, dto, user.role, user.branchId);
  }

  @Post(':id/complete')
  complete(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.svc.complete(id, user.role, user.branchId);
  }

  @Roles(UserRole.BRANCH_MANAGER)
  @Post(':id/rate-player')
  ratePlayer(
    @Param('id') id: string,
    @Body() dto: RatePlayerDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.svc.ratePlayer(id, dto, user.role, user.branchId);
  }
}
