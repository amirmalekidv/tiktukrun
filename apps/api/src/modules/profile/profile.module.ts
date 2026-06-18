import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { BadgeService } from './badge.service';
import { LevelingService } from '../users/leveling.service';

@Module({
  controllers: [ProfileController],
  providers: [ProfileService, BadgeService, LevelingService],
  exports: [ProfileService, BadgeService],
})
export class ProfileModule {}
