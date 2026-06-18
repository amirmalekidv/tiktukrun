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
import { BranchesService }    from './branches.service';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';
import { Public }             from '../../common/decorators/public.decorator';
import { JwtAuthGuard }       from '../../common/guards/jwt-auth.guard';
import { RolesGuard }         from '../../common/guards/roles.guard';
import { Roles }              from '../../common/decorators/roles.decorator';
import { UserRole }           from '../../common/interfaces/phase3-stubs.interface';

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
@Roles(UserRole.ADMIN)
@Controller('admin/branches')
export class BranchesAdminController {
  constructor(private readonly svc: BranchesService) {}

  @Get()
  findAll(
    @Query('cityId')   cityId?: string,
    @Query('isActive') isActive?: string,
  ) {
    const active = isActive === undefined ? undefined : isActive === 'true';
    return this.svc.findAll(cityId, active);
  }

  @Post()
  create(@Body() dto: CreateBranchDto) {
    return this.svc.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBranchDto) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.svc.remove(id);
  }
}
