import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SettingsService } from './settings.service';

@ApiTags('Settings - Public')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Public()
  @Get('public')
  @ApiOperation({ summary: 'تنظیمات عمومی سایت (فقط public.*)' })
  async getPublic() {
    const data = await this.settingsService.findPublic();
    // Convert array to object for convenience
    const settings = data.reduce((acc, s) => {
      acc[s.key] = s.value as any;
      return acc;
    }, {} as Record<string, any>);
    return { success: true, data: settings };
  }
}
