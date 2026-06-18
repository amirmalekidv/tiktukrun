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
import { CampaignsService } from './campaigns.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsObject,
  IsDateString,
} from 'class-validator';

export enum CampaignType {
  SMS = 'SMS',
  EMAIL = 'EMAIL',
  INAPP = 'INAPP',
  PUSH = 'PUSH',
}

class CreateCampaignDto {
  @IsString()
  name: string;

  @IsEnum(CampaignType)
  type: CampaignType;

  @IsOptional()
  @IsString()
  segmentId?: string;

  @IsObject()
  content: {
    subject?: string;
    body: string;
    variables?: string[];
  };

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsNumber()
  budget?: number;
}

class TestSendDto {
  @IsString()
  testUserId: string;
}

@ApiTags('Admin - Campaigns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN', 'MARKETING')
@Controller('admin/campaigns')
export class AdminCampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Get()
  @ApiOperation({ summary: 'لیست کمپین‌ها' })
  async findAll(@Query('page') page = '1', @Query('limit') limit = '20') {
    const result = await this.campaignsService.findAll(
      Number(page),
      Number(limit),
    );
    return { success: true, ...result };
  }

  @Get('stats')
  @ApiOperation({ summary: 'KPI کمپین‌ها' })
  async getStats() {
    const data = await this.campaignsService.getStats();
    return { success: true, data };
  }

  @Post()
  @ApiOperation({ summary: 'ایجاد کمپین جدید' })
  async create(@Body() dto: CreateCampaignDto) {
    const data = await this.campaignsService.create(dto);
    return { success: true, data };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'به‌روزرسانی کمپین' })
  async update(@Param('id') id: string, @Body() dto: CreateCampaignDto) {
    const data = await this.campaignsService.update(id, dto);
    return { success: true, data };
  }

  @Post(':id/start')
  @ApiOperation({ summary: 'شروع کمپین' })
  async start(@Param('id') id: string) {
    await this.campaignsService.start(id);
    return { success: true, message: 'کمپین آغاز شد' };
  }

  @Post(':id/pause')
  @ApiOperation({ summary: 'توقف کمپین' })
  async pause(@Param('id') id: string) {
    const data = await this.campaignsService.pause(id);
    return { success: true, data };
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'ارسال تستی به یک کاربر' })
  async test(@Param('id') id: string, @Body() dto: TestSendDto) {
    const data = await this.campaignsService.testSend(id, dto.testUserId);
    return { success: true, data };
  }

  @Get(':id/recipients')
  @ApiOperation({ summary: 'لیست گیرندگان + وضعیت' })
  async getRecipients(
    @Param('id') id: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    const result = await this.campaignsService.getRecipients(
      id,
      Number(page),
      Number(limit),
    );
    return { success: true, ...result };
  }
}
