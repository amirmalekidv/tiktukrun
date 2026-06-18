import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
} from 'class-validator';

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

class CreateTicketDto {
  @IsString()
  subject: string;

  @IsString()
  body: string;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @IsOptional()
  @IsString()
  branchId?: string;
}

class ReplyTicketDto {
  @IsString()
  text: string;

  @IsOptional()
  @IsArray()
  attachments?: string[];
}

@ApiTags('Tickets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @ApiOperation({ summary: 'ایجاد تیکت' })
  async create(@Body() dto: CreateTicketDto, @CurrentUser() user: any) {
    const data = await this.ticketsService.create(user.id, dto);
    return { success: true, data };
  }

  @Get('me')
  @ApiOperation({ summary: 'تیکت‌های من' })
  async findMine(
    @CurrentUser() user: any,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const result = await this.ticketsService.findMyTickets(
      user.id,
      Number(page),
      Number(limit),
    );
    return { success: true, ...result };
  }

  @Get('me/:id')
  @ApiOperation({ summary: 'جزئیات تیکت من' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    const data = await this.ticketsService.findMyTicket(user.id, id);
    return { success: true, data };
  }

  @Post('me/:id/reply')
  @ApiOperation({ summary: 'پاسخ به تیکت' })
  async reply(
    @Param('id') id: string,
    @Body() dto: ReplyTicketDto,
    @CurrentUser() user: any,
  ) {
    const data = await this.ticketsService.replyByUser(
      user.id,
      id,
      dto.text,
      dto.attachments,
    );
    return { success: true, data };
  }
}
