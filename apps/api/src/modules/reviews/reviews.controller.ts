import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUserPayload, UserRole } from '@tiktakrun/shared-types';
import { ReviewsService }   from './reviews.service';
import { CreateReviewDto, UpdateReviewDto, RejectReviewDto } from './dto/review.dto';
import { Public }           from '../../common/decorators/public.decorator';
import { CurrentUser }      from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard }     from '../../common/guards/jwt-auth.guard';
import { RolesGuard }       from '../../common/guards/roles.guard';
import { Roles }            from '../../common/decorators/roles.decorator';

// ─── Public + User ────────────────────────────────────────────────────────────
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly svc: ReviewsService) {}

  @Public()
  @Get('public')
  async findPublic(@Query() query: any) {
    // Public approved reviews for marketing pages (home, etc.)
    try {
      const merged = { ...query, isApproved: 'true', limit: query.limit || 20 };
      const res = await this.svc.adminFindAll(merged);
      return res;
    } catch {
      return { items: [], total: 0, page: 1, limit: 20 };
    }
  }

  @Public()
  @Get('game/:gameId')
  findForGame(@Param('gameId') gameId: string, @Query() query: any) {
    return this.svc.findForGame(gameId, query);
  }

  @UseGuards(JwtAuthGuard)
  @Post('booking/:bookingId')
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Param('bookingId') bookingId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.svc.create(user.id, bookingId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/:id')
  updateMine(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.svc.updateMine(user.id, id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me/:id')
  deleteMine(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.svc.deleteMine(user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/helpful')
  markHelpful(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.svc.markHelpful(user.id, id);
  }
}

// ─── Admin ────────────────────────────────────────────────────────────────────
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/reviews')
export class ReviewsAdminController {
  constructor(private readonly svc: ReviewsService) {}

  @Get()
  findAll(@Query() query: any) {
    return this.svc.adminFindAll(query);
  }

  @Post(':id/approve')
  approve(@Param('id') id: string) {
    return this.svc.approve(id);
  }

  @Post(':id/reject')
  reject(@Param('id') id: string, @Body() dto: RejectReviewDto) {
    return this.svc.reject(id, dto);
  }

  @Delete(':id')
  adminDelete(@Param('id') id: string) {
    return this.svc.adminDelete(id);
  }
}
