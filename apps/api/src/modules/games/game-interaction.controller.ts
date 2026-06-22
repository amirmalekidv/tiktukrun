import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';
import { CurrentUserPayload, UserRole } from '@tiktakrun/shared-types';

import { GameInteractionService } from './services/game-interaction.service';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

class AddCommentDto {
  @IsString()
  @MinLength(2)
  @MaxLength(2000)
  text: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}

// ─── Public + authenticated user interactions ──────────────────────────────────
@ApiTags('Game Interactions')
@Controller('games')
export class GameInteractionController {
  constructor(private readonly svc: GameInteractionService) {}

  // ── Likes ──
  @Public()
  @Get(':gameId/likes')
  @ApiOperation({ summary: 'تعداد لایک‌های بازی (عمومی)' })
  getLikes(@Param('gameId') gameId: string) {
    return this.svc.getLikeStatus(gameId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':gameId/likes/me')
  @ApiOperation({ summary: 'وضعیت لایک بازی برای کاربر فعلی' })
  getMyLike(
    @Param('gameId') gameId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.svc.getLikeStatus(gameId, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':gameId/like')
  @ApiOperation({ summary: 'لایک/آنلایک بازی (toggle)' })
  toggleLike(
    @Param('gameId') gameId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.svc.toggleLike(gameId, user.id);
  }

  // ── Comments ──
  @Public()
  @Get(':gameId/comments')
  @ApiOperation({ summary: 'فهرست کامنت‌های تأییدشده بازی' })
  listComments(
    @Param('gameId') gameId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.listComments(
      gameId,
      Number(page) || 1,
      Number(limit) || 20,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':gameId/comments')
  @ApiOperation({ summary: 'افزودن کامنت (نیازمند تأیید مدیر)' })
  addComment(
    @Param('gameId') gameId: string,
    @Body() dto: AddCommentDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.svc.addComment(gameId, user.id, dto.text, dto.parentId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('comments/:commentId/like')
  @ApiOperation({ summary: 'لایک/آنلایک کامنت (toggle)' })
  toggleCommentLike(
    @Param('commentId') commentId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.svc.toggleCommentLike(commentId, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('comments/:commentId')
  @ApiOperation({ summary: 'حذف کامنت خود کاربر' })
  deleteOwnComment(
    @Param('commentId') commentId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.svc.deleteOwnComment(commentId, user.id);
  }
}

// ─── Admin moderation ───────────────────────────────────────────────────────────
@ApiTags('Admin Game Comments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.BRANCH_MANAGER)
@Controller('admin/games/comments')
export class GameCommentsAdminController {
  constructor(private readonly svc: GameInteractionService) {}

  @Get()
  @ApiOperation({ summary: 'فهرست کامنت‌ها برای مودریشن' })
  list(
    @Query('filter') filter?: 'pending' | 'all' | 'hidden',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.listForModeration(
      filter ?? 'pending',
      Number(page) || 1,
      Number(limit) || 30,
    );
  }

  @Get('stats')
  @ApiOperation({ summary: 'آمار لایک‌ها و کامنت‌ها' })
  stats() {
    return this.svc.getStats();
  }

  @Post(':commentId/approve')
  @ApiOperation({ summary: 'تأیید کامنت' })
  approve(@Param('commentId') commentId: string) {
    return this.svc.approveComment(commentId);
  }

  @Post(':commentId/reject')
  @ApiOperation({ summary: 'رد/مخفی‌کردن کامنت' })
  reject(@Param('commentId') commentId: string) {
    return this.svc.rejectComment(commentId);
  }

  @Delete(':commentId')
  @ApiOperation({ summary: 'حذف کامل کامنت' })
  remove(@Param('commentId') commentId: string) {
    return this.svc.adminDeleteComment(commentId);
  }
}
