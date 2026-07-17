import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@tiktakrun/shared-types';
import { LandingSectionsService } from './landing-sections.service';
import {
  CreateLandingSectionDto,
  UpdateLandingSectionDto,
  SetLandingSectionGamesDto,
} from './dto/landing-section.dto';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('landing-sections')
export class LandingSectionsController {
  constructor(private readonly svc: LandingSectionsService) {}

  @Public()
  @Get()
  findAllWithGames() {
    return this.svc.findActiveWithGames();
  }

  @Public()
  @Get(':key')
  async findOne(@Param('key') key: string) {
    const section = await this.svc.findByKey(key);
    if (!section.isActive) throw new NotFoundException('سکشن یافت نشد');
    const games = await this.svc.resolveGames(section);
    return { ...section, games };
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/landing-sections')
export class LandingSectionsAdminController {
  constructor(private readonly svc: LandingSectionsService) {}

  @Get()
  findAll() {
    return this.svc.findAll();
  }

  @Post()
  create(@Body() dto: CreateLandingSectionDto) {
    return this.svc.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateLandingSectionDto) {
    return this.svc.update(id, dto);
  }

  @Patch(':id/games')
  setGames(@Param('id') id: string, @Body() dto: SetLandingSectionGamesDto) {
    return this.svc.setManualGames(id, dto.gameIds);
  }
}
