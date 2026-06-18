import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { CitiesService }  from './cities.service';
import { CreateCityDto, UpdateCityDto } from './dto/city.dto';
import { Public }         from '../../common/decorators/public.decorator';
import { JwtAuthGuard }   from '../../common/guards/jwt-auth.guard';
import { RolesGuard }     from '../../common/guards/roles.guard';
import { Roles }          from '../../common/decorators/roles.decorator';
import { UserRole }       from '../../common/interfaces/phase3-stubs.interface';

// ─── Public endpoint ────────────────────────────────────────────────────────
@Controller('cities')
export class CitiesController {
  constructor(private readonly svc: CitiesService) {}

  @Public()
  @Get()
  findActive() {
    return this.svc.findAllActive();
  }
}

// ─── Admin endpoints ─────────────────────────────────────────────────────────
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/cities')
export class CitiesAdminController {
  constructor(private readonly svc: CitiesService) {}

  @Get()
  findAll() {
    return this.svc.findAll();
  }

  @Post()
  create(@Body() dto: CreateCityDto) {
    return this.svc.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCityDto) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.svc.remove(id);
  }
}
