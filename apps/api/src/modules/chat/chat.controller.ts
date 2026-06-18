import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IsString, IsOptional } from 'class-validator';

class PostMessageDto {
  @IsString()
  text: string;
}

class ReportMessageDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('rooms/global/messages')
  @ApiOperation({ summary: 'تاریخچه چت عمومی (paginated)' })
  async getGlobalMessages(
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    const data = await this.chatService.getGlobalMessages(
      Number(page),
      Number(limit),
    );
    return { success: true, data };
  }

  @Get('rooms/team/:teamId/messages')
  @ApiOperation({ summary: 'تاریخچه چت تیم' })
  async getTeamMessages(
    @Param('teamId') teamId: string,
    @CurrentUser() user: any,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    const data = await this.chatService.getTeamMessages(
      teamId,
      user.id,
      Number(page),
      Number(limit),
    );
    return { success: true, data };
  }

  @Post('rooms/global/messages')
  @ApiOperation({ summary: 'ارسال پیام عمومی' })
  async postGlobalMessage(
    @Body() dto: PostMessageDto,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    const message = await this.chatService.postGlobalMessage(
      user.id,
      dto.text,
      req.ip,
    );
    return { success: true, data: message };
  }

  @Post('rooms/:roomId/messages/:messageId/report')
  @ApiOperation({ summary: 'گزارش پیام' })
  async reportMessage(
    @Param('messageId') messageId: string,
    @Body() dto: ReportMessageDto,
    @CurrentUser() user: any,
  ) {
    const result = await this.chatService.reportMessage(
      messageId,
      user.id,
      dto.reason,
    );
    return { success: true, data: result };
  }
}
