import { Module } from '@nestjs/common';
import { WheelController } from './wheel.controller';
import { AdminWheelController } from './admin-wheel.controller';
import { WheelService } from './wheel.service';
import { GamificationModule } from '../gamification/gamification.module';

@Module({
  imports: [GamificationModule],
  controllers: [WheelController, AdminWheelController],
  providers: [WheelService],
  exports: [WheelService],
})
export class WheelModule {}
