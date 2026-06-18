import { Module } from '@nestjs/common';
import { AdminMonthlyController } from './admin-monthly.controller';
import { MonthlyService } from './monthly.service';
import { GamificationModule } from '../gamification/gamification.module';

// ScheduleModule.forRoot() is registered once in AppModule
@Module({
  imports: [GamificationModule],
  controllers: [AdminMonthlyController],
  providers: [MonthlyService],
  exports: [MonthlyService],
})
export class MonthlyModule {}
