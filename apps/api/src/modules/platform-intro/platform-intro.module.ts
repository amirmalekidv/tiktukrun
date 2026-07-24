import { Module } from '@nestjs/common';
import {
  PlatformIntroAdminController,
  PlatformIntroController,
} from './platform-intro.controller';
import { PlatformIntroService } from './platform-intro.service';
import { PlatformIntroVideoService } from './platform-intro-video.service';

@Module({
  controllers: [PlatformIntroController, PlatformIntroAdminController],
  providers: [PlatformIntroService, PlatformIntroVideoService],
  exports: [PlatformIntroService],
})
export class PlatformIntroModule {}
