import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IsString, IsOptional, IsEnum } from 'class-validator';

class UpdateTicketDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsString()
  assigneeId?: string;
}

class StaffReplyDto {
  @IsString()
  text: string;
}

@ApiTags('Admin - Tickets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN', 'SUPPORT')
@Controller('admin/tickets')
export class AdminTicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  @ApiOperation({ summary: 'لیست همه تیکت‌ها' })
  async findAll(
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('assigneeId') assigneeId?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const result = await this.ticketsService.findAllAdmin(
      { status, priority, assigneeId },
      Number(page),
      Number(limit),
    );
    return { success: true, ...result };
  }

  @Get('stats')
  @ApiOperation({ summary: 'آمار تیکت‌ها' })
  async getStats() {
    const data = await this.ticketsService.getStats();
    return { success: true, data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'جزئیات تیکت' })
  async findOne(@Param('id') id: string) {
    const data = await this.ticketsService.findOneAdmin(id);
    return { success: true, data };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'به‌روزرسانی تیکت' })
  async update(@Param('id') id: string, @Body() dto: UpdateTicketDto) {
    const data = await this.ticketsService.updateAdmin(id, dto);
    return { success: true, data };
  }

  @Post(':id/reply')
  @ApiOperation({ summary: 'پاسخ پشتیبانی' })
  async reply(
    @Param('id') id: string,
    @Body() dto: StaffReplyDto,
    @CurrentUser() staff: any,
  ) {
    const data = await this.ticketsService.replyByStaff(staff.id, id, dto.text);
    return { success: true, data };
  }
}
