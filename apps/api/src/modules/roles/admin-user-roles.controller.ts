import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { IsArray } from 'class-validator';

class AssignRolesDto {
  @IsArray()
  roles: string[];
}

@ApiTags('Admin - User Roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN')
@Controller('admin/users')
export class AdminUserRolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get(':id/roles')
  @ApiOperation({ summary: 'نقش‌های یک کاربر' })
  async getUserRoles(@Param('id') id: string) {
    const data = await this.rolesService.getUserRoles(id);
    return { success: true, data };
  }

  @Post(':id/roles')
  @ApiOperation({ summary: 'انتساب چند نقش به کاربر' })
  async assignRoles(@Param('id') id: string, @Body() dto: AssignRolesDto) {
    const data = await this.rolesService.assignRoles(id, dto.roles);
    return { success: true, data };
  }
}
