import { Module } from '@nestjs/common';
import {
  LandingBannersAdminController,
  LandingBannersController,
} from './landing-banners.controller';
import { LandingBannerImageService } from './landing-banner-image.service';
import { LandingBannersService } from './landing-banners.service';

@Module({
  controllers: [LandingBannersController, LandingBannersAdminController],
  providers: [LandingBannersService, LandingBannerImageService],
  exports: [LandingBannersService],
})
export class LandingBannersModule {}
