import { Global, Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';

/**
 * NotificationsModule — @Global()
 * NotificationsService is available throughout the entire app
 * without needing to import this module in every feature module.
 * [QA Fix 2026-05-25] Added NotificationsController to register routes.
 */
@Global()
@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
