import { Controller, Get, Query } from '@nestjs/common';
import { TopService }             from './top.service';
import { Public }                 from '../../common/decorators/public.decorator';

@Controller('top')
export class TopController {
  constructor(private readonly svc: TopService) {}

  @Public()
  @Get('games')
  topGames(
    @Query('period') period: 'week' | 'month' | 'all' = 'week',
    @Query('limit')  limit  = '10',
  ) {
    return this.svc.topGames(period, Number(limit));
  }

  @Public()
  @Get('players')
  topPlayers(
    @Query('period') period: 'week' | 'month' | 'all' = 'week',
    @Query('limit')  limit  = '10',
  ) {
    return this.svc.topPlayers(period, Number(limit));
  }

  @Public()
  @Get('teams')
  topTeams(
    @Query('period') period: 'week' | 'month' | 'all' = 'week',
    @Query('limit')  limit  = '10',
  ) {
    return this.svc.topTeams(period, Number(limit));
  }
}
