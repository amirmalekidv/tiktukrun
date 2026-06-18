import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { AuditService } from '../audit/audit.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class UpdateSettingDto {
  @IsString()
  value: string;
}

class SettingItem {
  @IsString()
  key: string;

  @IsString()
  value: string;
}

class BulkUpdateSettingsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SettingItem)
  settings: SettingItem[];
}

@ApiTags('Admin - Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/settings')
export class AdminSettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly auditService: AuditService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'همه تنظیمات (فیلتر بر اساس group)' })
  async findAll(@Query('group') group?: string) {
    const data = await this.settingsService.findAll(group);
    return { success: true, data };
  }

  @Get(':key')
  @ApiOperation({ summary: 'دریافت یک تنظیم' })
  async findOne(@Param('key') key: string) {
    const value = await this.settingsService.get(key);
    return { success: true, data: { key, value } };
  }

  @Put(':key')
  @ApiOperation({ summary: 'به‌روزرسانی یک تنظیم' })
  async update(
    @Param('key') key: string,
    @Body() dto: UpdateSettingDto,
    @CurrentUser() admin: any,
  ) {
    const oldValue = await this.settingsService.get(key);
    await this.settingsService.set(key, dto.value);

    await this.auditService.log({
      actorId: admin.id,
      action: 'settings.update',
      entity: 'Setting',
      entityId: key,
      before: { value: oldValue },
      after: { value: dto.value },
    });

    return { success: true, data: { key, value: dto.value } };
  }

  @Put('bulk')
  @ApiOperation({ summary: 'به‌روزرسانی گروهی تنظیمات' })
  async bulkUpdate(
    @Body() dto: BulkUpdateSettingsDto,
    @CurrentUser() admin: any,
  ) {
    await this.settingsService.bulkSet(dto.settings);

    await this.auditService.log({
      actorId: admin.id,
      action: 'settings.bulk_update',
      entity: 'Setting',
      after: { keys: dto.settings.map((s) => s.key) },
    });

    return { success: true, data: { updated: dto.settings.length } };
  }
}
