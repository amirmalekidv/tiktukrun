import { Controller, Get, Post, Body } from '@nestjs/common';
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
    return this.invitesService.getMyInvite(userId);
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
