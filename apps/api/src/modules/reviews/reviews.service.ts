import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService }         from '../../prisma/prisma.service';
import { NotificationsService }  from '../../common/interfaces/notifications-stub.service';
import { BookingRewardsService } from '../bookings/services/booking-rewards.service';
import { CreateReviewDto, UpdateReviewDto, RejectReviewDto } from './dto/review.dto';
import { NotificationType }      from '../../common/interfaces/phase3-stubs.interface';
import { parsePagination, buildPaginatedResponse } from '../../common/helpers/pagination.helper';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    private prisma:   PrismaService,
    private notif:    NotificationsService,
    private rewards:  BookingRewardsService,
  ) {}

  // ─── Public ────────────────────────────────────────────────────────────────
  async findForGame(gameId: string, query: any) {
    const { skip, take, page, limit } = parsePagination(query);

    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        where:   { gameId, isApproved: true },
        skip,
        take,
        include: { user: { select: { id: true, fullName: true, avatarUrl: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.review.count({ where: { gameId, isApproved: true } }),
    ]);

    return buildPaginatedResponse(items, total, page, limit);
  }

  // ─── Create Review ─────────────────────────────────────────────────────────
  async create(userId: string, bookingId: string, dto: CreateReviewDto) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, userId, status: 'COMPLETED' },
    });
    if (!booking) {
      throw new BadRequestException('فقط برای رزروهای تمام‌شده می‌توانید نظر ثبت کنید');
    }

    const existing = await this.prisma.review.findFirst({ where: { bookingId } });
    if (existing) throw new ConflictException('شما قبلاً برای این رزرو نظر ثبت کرده‌اید');

    const review = await this.prisma.review.create({
      data: {
        userId: userId,
        gameId:     booking.gameId,
        bookingId,
        rating:     dto.rating,
        text:       dto.text,
        isApproved: false,   // نیاز به تایید ادمین — id توسط @default(uuid()) در Prisma ست می‌شود
      },
    });

    // اعطای XP و coins
    await this.rewards.awardReviewCompletion(userId, this.notif);

    this.logger.log(`Review created: bookingId=${bookingId} userId=${userId}`);
    return review;
  }

  async updateMine(userId: string, reviewId: string, dto: UpdateReviewDto) {
    const review = await this.prisma.review.findFirst({
      where: { id: reviewId, userId },
    });
    if (!review) throw new NotFoundException('نظر یافت نشد');
    if (review.isApproved) {
      throw new ForbiddenException('نظر تأییدشده قابل ویرایش نیست');
    }

    return this.prisma.review.update({
      where: { id: reviewId },
      data:  { rating: dto.rating, text: dto.text },
    });
  }

  async deleteMine(userId: string, reviewId: string) {
    const review = await this.prisma.review.findFirst({
      where: { id: reviewId, userId },
    });
    if (!review) throw new NotFoundException('نظر یافت نشد');
    return this.prisma.review.delete({ where: { id: reviewId } });
  }

  async markHelpful(userId: string, reviewId: string) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('نظر یافت نشد');
    if (review.userId === userId) {
      throw new ForbiddenException('نمی‌توانید نظر خودتان را مفید بزنید');
    }

    return this.prisma.review.update({
      where: { id: reviewId },
      data:  { helpfulCount: { increment: 1 } },
    });
  }

  // ─── Admin ─────────────────────────────────────────────────────────────────
  async adminFindAll(query: any) {
    const { skip, take, page, limit } = parsePagination(query);
    const where: any = {};

    if (query.isApproved !== undefined) {
      where.isApproved = query.isApproved === 'true';
    }
    if (query.gameId) where.gameId = query.gameId;

    let orderBy: any = { createdAt: 'desc' };
    if (query.sortBy === 'rating')   orderBy = { rating: 'desc' };
    if (query.sortBy === 'helpful')  orderBy = { helpfulCount: 'desc' };

    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip,
        take,
        include: {
          user: { select: { id: true, fullName: true, mobile: true } },
          game: { select: { id: true, title: true } },
        },
        orderBy,
      }),
      this.prisma.review.count({ where }),
    ]);

    return buildPaginatedResponse(items, total, page, limit);
  }

  async approve(reviewId: string) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('نظر یافت نشد');

    await this.prisma.review.update({
      where: { id: reviewId },
      data:  { isApproved: true },
    });

    // recompute averageRating
    await this.recomputeGameRating(review.gameId);

    await this.notif.send({
      userId: review.userId,
      type:   NotificationType.REVIEW_APPROVED,
      title:  'نظر شما تأیید شد ✅',
      body:   'نظر شما برای این بازی منتشر شد.',
      data:   { reviewId, gameId: review.gameId },
    }).catch(() => {});

    return { success: true };
  }

  async reject(reviewId: string, dto: RejectReviewDto) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('نظر یافت نشد');

    await this.prisma.review.delete({ where: { id: reviewId } });

    await this.notif.send({
      userId: review.userId,
      type:   NotificationType.REVIEW_REJECTED,
      title:  'نظر شما رد شد',
      body:   `دلیل: ${dto.reason}`,
      data:   { gameId: review.gameId },
    }).catch(() => {});

    return { success: true };
  }

  async adminDelete(reviewId: string) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('نظر یافت نشد');
    await this.prisma.review.delete({ where: { id: reviewId } });
    await this.recomputeGameRating(review.gameId);
    return { success: true };
  }

  // ─── Recompute ─────────────────────────────────────────────────────────────
  async recomputeGameRating(gameId: string) {
    const agg = await this.prisma.review.aggregate({
      where:  { gameId, isApproved: true },
      _avg:   { rating: true },
      _count: { rating: true },
    });

    await this.prisma.game.update({
      where: { id: gameId },
      data:  {
        siteRank:     agg._avg.rating ?? 0,
        totalReviews: agg._count.rating,
      },
    });

    this.logger.log(`Game rating recomputed: gameId=${gameId} avg=${agg._avg.rating}`);
  }
}
