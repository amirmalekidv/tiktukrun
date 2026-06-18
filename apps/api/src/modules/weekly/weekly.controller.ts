import { Controller, Get } from '@nestjs/common';
import { WeeklyService }   from './weekly.service';
import { Public }          from '../../common/decorators/public.decorator';

@Controller('weekly')
export class WeeklyController {
  constructor(private readonly svc: WeeklyService) {}

  @Public()
  @Get('discounts')
  findWeeklyDiscounts() {
    return this.svc.findWeeklyDiscounts();
  }
}
