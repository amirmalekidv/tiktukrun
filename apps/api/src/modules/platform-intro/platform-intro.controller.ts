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
  CreatePlatformFaqDto,
  ReorderPlatformFaqsDto,
  UpdatePlatformFaqDto,
  UpdatePlatformIntroDto,
} from './dto/platform-intro.dto';
import { PlatformIntroService } from './platform-intro.service';

const multerStorage = diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, getStorageDir('tmp'));
  },
  filename: (_req, file, cb) => {
    cb(
      null,
      `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname)}`,
    );
  },
});

const videoUpload = FileInterceptor('video', {
  storage: multerStorage,
  limits: { fileSize: 100 * 1024 * 1024 },
});

@Controller('platform-intro')
export class PlatformIntroController {
  constructor(private readonly svc: PlatformIntroService) {}

  @Public()
  @Get()
  findPublic() {
    return this.svc.findPublic();
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...PLATFORM_ADMIN_ROLES)
@Controller('admin/platform-intro')
export class PlatformIntroAdminController {
  constructor(private readonly svc: PlatformIntroService) {}

  @Get()
  findAdmin() {
    return this.svc.findAdmin();
  }

  @Patch()
  @UseInterceptors(videoUpload)
  update(
    @Body() dto: UpdatePlatformIntroDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.svc.update(dto, file);
  }

  @Post('faqs')
  createFaq(@Body() dto: CreatePlatformFaqDto) {
    return this.svc.createFaq(dto);
  }

  @Patch('faqs/order')
  reorderFaqs(@Body() dto: ReorderPlatformFaqsDto) {
    return this.svc.reorderFaqs(dto.faqIds);
  }

  @Patch('faqs/:id')
  updateFaq(@Param('id') id: string, @Body() dto: UpdatePlatformFaqDto) {
    return this.svc.updateFaq(id, dto);
  }

  @Delete('faqs/:id')
  deleteFaq(@Param('id') id: string) {
    return this.svc.deleteFaq(id);
  }
}
