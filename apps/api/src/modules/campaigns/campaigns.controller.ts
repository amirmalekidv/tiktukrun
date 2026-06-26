import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { CampaignExecutor } from './campaign-executor';

/** 1×1 transparent GIF */
const TRACKING_PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64',
);

@ApiTags('Campaigns')
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly executor: CampaignExecutor) {}

  @Public()
  @Get('track/:token')
  @ApiOperation({ summary: 'ردیابی کلیک/باز شدن/تبدیل کمپین' })
  async track(
    @Param('token') token: string,
    @Query('event') event: string = 'click',
    @Res() res: Response,
  ) {
    const normalized = (event ?? 'click').toLowerCase();

    if (normalized === 'open') {
      await this.executor.trackOpen(token);
      res.set('Content-Type', 'image/gif');
      res.set('Cache-Control', 'no-store');
      return res.send(TRACKING_PIXEL);
    }

    if (normalized === 'conversion') {
      await this.executor.trackConversion(token);
    } else {
      await this.executor.trackClick(token);
    }

    const redirect =
      process.env.WEB_URL?.replace(/\/$/, '') || 'http://localhost:3000';
    return res.redirect(302, redirect);
  }
}
