import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../common/decorators';

@ApiTags('health')
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  @Public()
  @Get()
  @ApiOperation({ summary: 'بررسی سلامت سرویس API' })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      service: 'TIK TAK RUN API',
      environment: process.env.NODE_ENV || 'development',
      uptime: Math.floor(process.uptime()),
    };
  }
}
