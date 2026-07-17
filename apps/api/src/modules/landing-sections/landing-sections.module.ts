import { Module } from '@nestjs/common';
import { LandingSectionsService } from './landing-sections.service';
import {
  LandingSectionsController,
  LandingSectionsAdminController,
} from './landing-sections.controller';

@Module({
  controllers: [LandingSectionsController, LandingSectionsAdminController],
  providers: [LandingSectionsService],
  exports: [LandingSectionsService],
})
export class LandingSectionsModule {}
