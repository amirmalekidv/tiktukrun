import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { BadgeService } from './badge.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Profile — پروفایل')
@ApiBearerAuth()
@Controller('profile')
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly badgeService: BadgeService,
  ) {}

  @Get('me/stats')
  @ApiOperation({ summary: 'آمار کاربر فعلی' })
  async getMyStats(@CurrentUser('id') userId: string) {
    return this.profileService.getMyStats(userId);
  }

  @Get('me/badges')
  @ApiOperation({ summary: 'لیست بج‌های کسب‌شده و قابل کسب' })
  async getMyBadges(@CurrentUser('id') userId: string) {
    return this.badgeService.getUserBadges(userId);
  }

  @Get('leaderboard')
  @Public()
  @ApiOperation({ summary: 'جدول رتبه‌بندی (عمومی)' })
  @ApiQuery({ name: 'type', enum: ['xp', 'bookings', 'spent'], required: false })
  @ApiQuery({ name: 'period', enum: ['week', 'month', 'all'], required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getLeaderboard(@Query() query: any) {
    return this.profileService.getLeaderboard(query);
  }

  @Get(':userId/public')
  @Public()
  @ApiOperation({ summary: 'پروفایل عمومی کاربر' })
  @ApiParam({ name: 'userId', description: 'شناسه کاربر' })
  async getPublicProfile(@Param('userId') userId: string) {
    return this.profileService.getPublicProfile(userId);
  }
}
