import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Admin - Audit Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
@Controller('admin/audit-logs')
export class AdminAuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'لیست لاگ‌های حسابرسی' })
  async findAll(
    @Query('actorId') actorId?: string,
    @Query('action') action?: string,
    @Query('entity') entity?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    const result = await this.auditService.findAll(
      { actorId, action, entity, dateFrom, dateTo },
      Number(page),
      Number(limit),
    );
    return {
      success: true,
      ...result,
      meta: { page: Number(page), limit: Number(limit), total: result.total },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'جزئیات لاگ' })
  async findOne(@Param('id') id: string) {
    const data = await this.auditService.findOne(id);
    return { success: true, data };
  }
}
