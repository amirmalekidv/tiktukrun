import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUserPayload } from '@tiktakrun/shared-types';
import { BranchesService }    from './branches.service';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';
import { Public }             from '../../common/decorators/public.decorator';
import { JwtAuthGuard }       from '../../common/guards/jwt-auth.guard';
import { RolesGuard }         from '../../common/guards/roles.guard';
import { Roles }              from '../../common/decorators/roles.decorator';
import { CurrentUser }        from '../../common/decorators/current-user.decorator';
import { toBranchScope }      from '../../common/helpers/branch-scope.helper';
import { BRANCH_OPS_ROLES, PLATFORM_ADMIN_ROLES } from '../../common/constants/admin-roles';

// ─── Public ──────────────────────────────────────────────────────────────────
@Controller('branches')
export class BranchesController {
  constructor(private readonly svc: BranchesService) {}

  @Public()
  @Get()
  findActive(@Query('cityId') cityId?: string) {
    return this.svc.findActive(cityId);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findOnePublic(id);
  }
}

// ─── Admin ────────────────────────────────────────────────────────────────────
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...BRANCH_OPS_ROLES)
@Controller('admin/branches')
export class BranchesAdminController {
  constructor(private readonly svc: BranchesService) {}

  @Get()
  findAll(
    @Query('cityId')   cityId?: string,
    @Query('isActive') isActive?: string,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    const active = isActive === undefined ? undefined : isActive === 'true';
    return this.svc.findAllAdmin(toBranchScope(user!), cityId, active);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.svc.findOneAdmin(id, toBranchScope(user));
  }

  @Roles(...PLATFORM_ADMIN_ROLES)
  @Post()
  create(@Body() dto: CreateBranchDto) {
    return this.svc.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBranchDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.svc.updateAdmin(id, dto, toBranchScope(user));
  }

  @Roles(...PLATFORM_ADMIN_ROLES)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.svc.remove(id);
  }
}
