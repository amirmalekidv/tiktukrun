import { Module } from '@nestjs/common';
import { AdminCampaignsController } from './admin-campaigns.controller';
import { CampaignsService } from './campaigns.service';
import { CampaignExecutor } from './campaign-executor';
import { SegmentsModule } from '../segments/segments.module';

@Module({
  imports: [SegmentsModule],
  controllers: [AdminCampaignsController],
  providers: [CampaignsService, CampaignExecutor],
  exports: [CampaignsService],
})
export class CampaignsModule {}
