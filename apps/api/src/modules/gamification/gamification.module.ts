import { Module } from '@nestjs/common';
import { LevelsController } from './levels.controller';
import { AdminLevelsController } from './admin-levels.controller';
import { BadgesController } from './badges.controller';
import { AdminBadgesController } from './admin-badges.controller';
import { LevelingService } from './leveling.service';
import { BadgeService } from './badge.service';

@Module({
  controllers: [
    LevelsController,
    AdminLevelsController,
    BadgesController,
    AdminBadgesController,
  ],
  providers: [LevelingService, BadgeService],
  exports: [LevelingService, BadgeService],
})
export class GamificationModule {}
