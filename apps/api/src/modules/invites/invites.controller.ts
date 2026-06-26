import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InvitesService } from './invites.service';
import { ValidateInviteDto, ApplyInviteDto } from './dto/invite.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Invites — دعوت')
@Controller('invites')
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'کد دعوت و آمار دعوت‌های کاربر' })
  async getMyInvite(@CurrentUser('id') userId: string) {
    const data = await this.invitesService.getMyInvite(userId);
    return { success: true, data };
  }

  @Get('me/users')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'لیست کاربران دعوت‌شده' })
  async getInvitedUsers(
    @CurrentUser('id') userId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const data = await this.invitesService.getInvitedUsers(
      userId,
      Number(page),
      Number(limit),
    );
    return { success: true, data };
  }

  @Post('regenerate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'صدور مجدد کد دعوت' })
  async regenerate(@CurrentUser('id') userId: string) {
    const data = await this.invitesService.regenerateInviteCode(userId);
    return { success: true, data };
  }

  @Post('validate')
  @Public()
  @ApiOperation({ summary: 'اعتبارسنجی کد دعوت' })
  async validateInvite(@Body() dto: ValidateInviteDto) {
    return this.invitesService.validateInviteCode(dto);
  }

  @Post('apply')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'اعمال کد دعوت' })
  async applyInvite(
    @CurrentUser('id') userId: string,
    @Body() dto: ApplyInviteDto,
  ) {
    return this.invitesService.applyInviteCode(userId, dto);
  }
}
