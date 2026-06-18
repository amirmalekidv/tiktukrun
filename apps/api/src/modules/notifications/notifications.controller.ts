import { Controller, Get, Patch, Delete, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Notifications — اعلان‌ها')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('me')
  @ApiOperation({ summary: 'لیست اعلان‌ها' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'unread', required: false, type: Boolean })
  async getNotifications(
    @CurrentUser('id') userId: string,
    @Query() query: any,
  ) {
    return this.notificationsService.getUserNotifications(userId, query);
  }

  @Get('me/unread-count')
  @ApiOperation({ summary: 'تعداد اعلان‌های خوانده نشده' })
  async getUnreadCount(@CurrentUser('id') userId: string) {
    const count = await this.notificationsService.getUnreadCount(userId);
    return { count };
  }

  @Patch('me/:id/read')
  @ApiOperation({ summary: 'علامت‌گذاری به عنوان خوانده شده' })
  async markAsRead(
    @CurrentUser('id') userId: string,
    @Param('id') notificationId: string,
  ) {
    return this.notificationsService.markAsRead(userId, notificationId);
  }

  @Patch('me/read-all')
  @ApiOperation({ summary: 'علامت‌گذاری همه به عنوان خوانده شده' })
  async markAllAsRead(@CurrentUser('id') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Delete('me/:id')
  @ApiOperation({ summary: 'حذف اعلان' })
  async deleteNotification(
    @CurrentUser('id') userId: string,
    @Param('id') notificationId: string,
  ) {
    return this.notificationsService.deleteNotification(userId, notificationId);
  }
}
