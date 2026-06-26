import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService, Permission } from './roles.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { IsString, IsArray } from 'class-validator';

class CreateRoleDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsArray()
  permissions: Permission[];
}

class SetPermissionsDto {
  @IsArray()
  permissions: Permission[];
}

class AssignRolesDto {
  @IsArray()
  roles: string[];
}

@ApiTags('Admin - Roles & Permissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
@Controller('admin/roles')
export class AdminRolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ApiOperation({
    summary: 'لیست نقش‌های سیستمی (read-only)',
    description:
      'نقش‌ها از enum سیستمی هستند و قابل ایجاد/ویرایش نیستند. برای تخصیص نقش به کاربر از POST /admin/users/:id/roles استفاده کنید.',
  })
  async findAll() {
    const data = await this.rolesService.findAll();
    return { success: true, data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'جزئیات یک نقش سیستمی + کاربران دارای این نقش' })
  async findOne(@Param('id') id: string) {
    const role = await this.rolesService.findOne(id);
    const users = await this.rolesService.getUsersWithRole(role.name);
    return { success: true, data: { ...role, users } };
  }

  @Post()
  @ApiOperation({
    summary: 'ایجاد نقش سفارشی (غیرفعال — نقش‌ها سیستمی هستند)',
  })
  async create(@Body() dto: CreateRoleDto) {
    const data = await this.rolesService.create(dto);
    return { success: true, data };
  }

  @Patch(':id/permissions')
  @ApiOperation({ summary: 'تنظیم permissions نقش' })
  async setPermissions(
    @Param('id') id: string,
    @Body() dto: SetPermissionsDto,
  ) {
    const data = await this.rolesService.setPermissions(id, dto.permissions);
    return { success: true, data };
  }
}

// Note: User role assignment is handled by AdminUserRolesController
// See: admin-user-roles.controller.ts
