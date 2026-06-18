import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SegmentsService } from './segments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { IsString, IsOptional, IsObject, IsArray } from 'class-validator';

class CreateSegmentDto {
  @IsString()
  name: string;

  @IsObject()
  conditions: {
    rules: { field: string; op: string; value: any }[];
    logic?: 'AND' | 'OR';
  };

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  icon?: string;
}

class UpdateSegmentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsObject()
  conditions?: any;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  icon?: string;
}

@ApiTags('Admin - Segments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN', 'MARKETING')
@Controller('admin/segments')
export class AdminSegmentsController {
  constructor(private readonly segmentsService: SegmentsService) {}

  @Get()
  @ApiOperation({ summary: 'لیست سگمنت‌ها' })
  async findAll() {
    const data = await this.segmentsService.findAll();
    return { success: true, data };
  }

  @Post()
  @ApiOperation({ summary: 'ایجاد سگمنت جدید' })
  async create(@Body() dto: CreateSegmentDto) {
    const data = await this.segmentsService.create(dto);
    return { success: true, data };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'به‌روزرسانی سگمنت' })
  async update(@Param('id') id: string, @Body() dto: UpdateSegmentDto) {
    const data = await this.segmentsService.update(id, dto);
    return { success: true, data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'حذف سگمنت' })
  async remove(@Param('id') id: string) {
    await this.segmentsService.delete(id);
  }

  @Post(':id/recompute')
  @ApiOperation({ summary: 'محاسبه مجدد اعضا' })
  async recompute(@Param('id') id: string) {
    const data = await this.segmentsService.recompute(id);
    return { success: true, data };
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'لیست اعضای سگمنت' })
  async getMembers(
    @Param('id') id: string,
    @Query('limit') limit = '100',
  ) {
    const data = await this.segmentsService.getMembers(id, Number(limit));
    return { success: true, data, count: data.length };
  }
}
