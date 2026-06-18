import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';

class HideMessageDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

class MuteUserDto {
  @IsNumber()
  @Min(1)
  @Max(8760)
  hours: number;

  @IsOptional()
  @IsString()
  reason?: string;
}

class WarnUserDto {
  @IsString()
  message: string;
}

@ApiTags('Admin - Chat Moderation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN', 'SUPPORT')
@Controller('admin')
export class AdminChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
    private readonly prisma: PrismaService,
  ) {}

  @Get('chats/messages')
  @ApiOperation({ summary: 'لیست پیام‌ها با فیلتر' })
  async getMessages(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('status') status?: string,
    @Query('userId') userId?: string,
    @Query('roomType') roomType?: string,
  ) {
    const where: any = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;
    if (roomType) where.roomType = roomType;

    const [data, total] = await Promise.all([
      this.prisma.chatMessage.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, fullName: true, mobile: true } },
        },
      }),
      this.prisma.chatMessage.count({ where }),
    ]);
    return {
      success: true,
      data,
      meta: { total, page: Number(page), limit: Number(limit) },
    };
  }

  @Get('chats/stats')
  @ApiOperation({ summary: 'آمار چت' })
  async getChatStats() {
    const data = await this.chatService.getChatStats();
    return { success: true, data };
  }

  @Post('chats/messages/:id/hide')
  @ApiOperation({ summary: 'مخفی‌کردن پیام' })
  async hideMessage(
    @Param('id') id: string,
    @Body() dto: HideMessageDto,
    @CurrentUser() admin: any,
  ) {
    const msg: any = await this.chatService.hideMessage(id, admin.id, dto.reason);
    this.chatGateway.emitMessageHidden(msg.room?.type, msg.room?.teamId ?? null, id);
    return { success: true, data: msg };
  }

  @Post('chats/messages/:id/delete')
  @ApiOperation({ summary: 'حذف پیام' })
  async deleteMessage(
    @Param('id') id: string,
    @CurrentUser() admin: any,
  ) {
    const msg: any = await this.chatService.deleteMessage(id, admin.id);
    this.chatGateway.emitMessageDeleted(msg.room?.type, msg.room?.teamId ?? null, id);
    return { success: true, data: msg };
  }

  @Post('users/:userId/mute')
  @ApiOperation({ summary: 'بستن دسترسی چت کاربر' })
  async muteUser(
    @Param('userId') userId: string,
    @Body() dto: MuteUserDto,
    @CurrentUser() admin: any,
  ) {
    const user = await this.chatService.muteUser(
      userId,
      admin.id,
      dto.hours,
      dto.reason,
    );
    this.chatGateway.emitUserMuted(userId, user.mutedUntil);
    return { success: true };
  }

  @Post('users/:userId/warn')
  @ApiOperation({ summary: 'اخطار به کاربر' })
  async warnUser(
    @Param('userId') userId: string,
    @Body() dto: WarnUserDto,
    @CurrentUser() admin: any,
  ) {
    await this.chatService.warnUser(userId, admin.id, dto.message);
    return { success: true };
  }
}
