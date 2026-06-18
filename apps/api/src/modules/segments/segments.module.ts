import { Module } from '@nestjs/common';
import { AdminSegmentsController } from './admin-segments.controller';
import { SegmentsService } from './segments.service';
import { SegmentEvaluator } from './segment-evaluator';

// ScheduleModule.forRoot() is registered once in AppModule
@Module({
  controllers: [AdminSegmentsController],
  providers: [SegmentsService, SegmentEvaluator],
  exports: [SegmentsService, SegmentEvaluator],
})
export class SegmentsModule {}
