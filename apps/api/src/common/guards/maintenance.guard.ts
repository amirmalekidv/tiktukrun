import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SettingsService } from '../../modules/settings/settings.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class MaintenanceGuard implements CanActivate {
  constructor(
    private readonly settings: SettingsService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest();
    const url: string = req.originalUrl ?? req.url ?? '';

    const exempt =
      url.includes('/auth') ||
      url.includes('/health') ||
      url.includes('/admin/') ||
      url.includes('/settings/public') ||
      url.includes('/payments/zarinpal/verify') ||
      url.includes('/campaigns/track/');

    if (exempt) return true;

    const mode = await this.settings.get('public.maintenanceMode', 'false');
    if (mode === 'true') {
      throw new ServiceUnavailableException({
        message: 'سایت در حالت تعمیرات است. لطفاً بعداً مراجعه کنید.',
        maintenanceMode: true,
      });
    }

    return true;
  }
}
