import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PipelineService } from './pipeline.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  IsEnum,
} from 'class-validator';

class CreateDealDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsNumber()
  value?: number;

  @IsOptional()
  @IsString()
  stage?: string;

  @IsOptional()
  @IsString()
  ownerId?: string;

  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @IsDateString()
  expectedCloseDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

class MoveDealDto {
  @IsString()
  newStage: string;

  @IsNumber()
  newPosition: number;
}

@ApiTags('Admin - Pipeline (Sales Kanban)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN', 'MARKETING')
@Controller('admin/pipeline')
export class AdminPipelineController {
  constructor(private readonly pipelineService: PipelineService) {}

  @Get()
  @ApiOperation({ summary: 'همه deals گروه‌بندی بر اساس stage' })
  async findAll() {
    const data = await this.pipelineService.findAll();
    return { success: true, data };
  }

  @Get('stats')
  @ApiOperation({ summary: 'آمار pipeline' })
  async getStats() {
    const data = await this.pipelineService.getStats();
    return { success: true, data };
  }

  @Post()
  @ApiOperation({ summary: 'ایجاد deal جدید' })
  async create(@Body() dto: CreateDealDto) {
    const data = await this.pipelineService.create(dto);
    return { success: true, data };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'به‌روزرسانی deal' })
  async update(@Param('id') id: string, @Body() dto: CreateDealDto) {
    const data = await this.pipelineService.update(id, dto);
    return { success: true, data };
  }

  @Patch(':id/move')
  @ApiOperation({ summary: 'جابجایی deal در Kanban' })
  async move(@Param('id') id: string, @Body() dto: MoveDealDto) {
    const data = await this.pipelineService.move(id, dto.newStage, dto.newPosition);
    return { success: true, data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'حذف deal' })
  async remove(@Param('id') id: string) {
    await this.pipelineService.delete(id);
    return { success: true };
  }
}
