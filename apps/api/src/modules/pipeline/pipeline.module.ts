import { Module } from '@nestjs/common';
import { AdminPipelineController } from './admin-pipeline.controller';
import { PipelineService } from './pipeline.service';

@Module({
  controllers: [AdminPipelineController],
  providers: [PipelineService],
  exports: [PipelineService],
})
export class PipelineModule {}
