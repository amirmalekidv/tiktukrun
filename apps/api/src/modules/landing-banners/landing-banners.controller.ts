import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import { getStorageDir } from '../../common/utils/storage-path';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PLATFORM_ADMIN_ROLES } from '../../common/constants/admin-roles';
import {
  CreateLandingBannerDto,
  ReorderLandingBannersDto,
  UpdateLandingBannerDto,
} from './dto/landing-banner.dto';
import { LandingBannersService } from './landing-banners.service';

const multerStorage = diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, getStorageDir('tmp'));
  },
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname)}`);
  },
});

const bannerUpload = FileInterceptor('image', {
  storage: multerStorage,
  limits: { fileSize: 8 * 1024 * 1024 },
});

@Controller('landing-banners')
export class LandingBannersController {
  constructor(private readonly svc: LandingBannersService) {}

  @Public()
  @Get()
  findActive() {
    return this.svc.findActive();
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...PLATFORM_ADMIN_ROLES)
@Controller('admin/landing-banners')
export class LandingBannersAdminController {
  constructor(private readonly svc: LandingBannersService) {}

  @Get()
  findAll() {
    return this.svc.findAll();
  }

  @Post()
  @UseInterceptors(bannerUpload)
  create(
    @Body() dto: CreateLandingBannerDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.svc.create(dto, file);
  }

  @Patch('order')
  reorder(@Body() dto: ReorderLandingBannersDto) {
    return this.svc.reorder(dto.bannerIds);
  }

  @Patch(':id')
  @UseInterceptors(bannerUpload)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLandingBannerDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.svc.update(id, dto, file);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.svc.delete(id);
  }
}
