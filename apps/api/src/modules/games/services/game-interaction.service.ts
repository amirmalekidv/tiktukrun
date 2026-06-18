import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * GameInteractionService
 * ----------------------
 * منطق لایک و کامنت بازی‌ها:
 *  - لایک/آنلایک بازی (toggle) + شمارنده کش‌شده Game.likesCount
 *  - افزودن/خواندن کامنت‌ها (با پاسخ‌ها) + مودریشن
 *  - لایک/آنلایک کامنت + شمارنده GameComment.likesCount
 */
@Injectable()
export class GameInteractionService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Likes ─────────────────────────────────────────────────────────────────

  /** وضعیت لایک یک بازی برای یک کاربر (تعداد + آیا کاربر لایک کرده) */
  async getLikeStatus(gameId: string, userId?: string) {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true, likesCount: true },
    });
    if (!game) throw new NotFoundException('بازی یافت نشد');

    let liked = false;
    if (userId) {
      const existing = await this.prisma.gameLike.findUnique({
        where: { gameId_userId: { gameId, userId } },
      });
      liked = !!existing;
    }
    return { gameId, likesCount: game.likesCount, liked };
  }

  /** Toggle لایک بازی — اگر لایک شده بود برمی‌دارد، وگرنه اضافه می‌کند */
  async toggleLike(gameId: string, userId: string) {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true },
    });
    if (!game) throw new NotFoundException('بازی یافت نشد');

    const existing = await this.prisma.gameLike.findUnique({
      where: { gameId_userId: { gameId, userId } },
    });

    if (existing) {
      const [, updated] = await this.prisma.$transaction([
        this.prisma.gameLike.delete({ where: { id: existing.id } }),
        this.prisma.game.update({
          where: { id: gameId },
          data: { likesCount: { decrement: 1 } },
          select: { likesCount: true },
        }),
      ]);
      return { gameId, liked: false, likesCount: Math.max(0, updated.likesCount) };
    }

    const [, updated] = await this.prisma.$transaction([
      this.prisma.gameLike.create({ data: { gameId, userId } }),
      this.prisma.game.update({
        where: { id: gameId },
        data: { likesCount: { increment: 1 } },
        select: { likesCount: true },
      }),
    ]);
    return { gameId, liked: true, likesCount: updated.likesCount };
  }

  // ─── Comments ────────────────────────────────────────────────────────────────

  /** فهرست کامنت‌های تأییدشده یک بازی (به‌همراه پاسخ‌ها) */
  async listComments(gameId: string, page = 1, limit = 20, userId?: string) {
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      this.prisma.gameComment.findMany({
        where: { gameId, parentId: null, isApproved: true, isHidden: false },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
        include: {
          user: { select: { id: true, fullName: true, avatarUrl: true } },
          replies: {
            where: { isApproved: true, isHidden: false },
            orderBy: { createdAt: 'asc' },
            include: {
              user: { select: { id: true, fullName: true, avatarUrl: true } },
            },
          },
        },
      }),
      this.prisma.gameComment.count({
        where: { gameId, parentId: null, isApproved: true, isHidden: false },
      }),
    ]);

    // علامت‌گذاری کامنت‌هایی که کاربر فعلی لایک کرده
    let likedIds = new Set<string>();
    if (userId) {
      const allIds: string[] = [];
      for (const c of comments) {
        allIds.push(c.id);
        for (const r of (c as any).replies ?? []) allIds.push(r.id);
      }
      if (allIds.length) {
        const likes = await this.prisma.gameCommentLike.findMany({
          where: { userId, commentId: { in: allIds } },
          select: { commentId: true },
        });
        likedIds = new Set(likes.map((l) => l.commentId));
      }
    }

    const decorate = (c: any) => ({
      ...c,
      likedByMe: likedIds.has(c.id),
      replies: (c.replies ?? []).map((r: any) => ({
        ...r,
        likedByMe: likedIds.has(r.id),
      })),
    });

    return {
      data: comments.map(decorate),
      total,
      page,
      limit,
    };
  }

  /**
   * افزودن کامنت توسط کاربر.
   * کامنت‌ها به‌صورت پیش‌فرض isApproved=false هستند و باید توسط ادمین تأیید شوند.
   */
  async addComment(
    gameId: string,
    userId: string,
    text: string,
    parentId?: string,
  ) {
    const trimmed = (text ?? '').trim();
    if (trimmed.length < 2) {
      throw new BadRequestException('متن کامنت خیلی کوتاه است');
    }
    if (trimmed.length > 2000) {
      throw new BadRequestException('متن کامنت خیلی بلند است');
    }

    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true },
    });
    if (!game) throw new NotFoundException('بازی یافت نشد');

    if (parentId) {
      const parent = await this.prisma.gameComment.findUnique({
        where: { id: parentId },
        select: { id: true, gameId: true },
      });
      if (!parent || parent.gameId !== gameId) {
        throw new BadRequestException('کامنت والد نامعتبر است');
      }
    }

    const comment = await this.prisma.gameComment.create({
      data: {
        gameId,
        userId,
        text: trimmed,
        parentId: parentId ?? null,
        isApproved: false,
      },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });

    return {
      ...comment,
      message: 'کامنت ثبت شد و پس از تأیید مدیر نمایش داده می‌شود',
    };
  }

  /** Toggle لایک یک کامنت */
  async toggleCommentLike(commentId: string, userId: string) {
    const comment = await this.prisma.gameComment.findUnique({
      where: { id: commentId },
      select: { id: true },
    });
    if (!comment) throw new NotFoundException('کامنت یافت نشد');

    const existing = await this.prisma.gameCommentLike.findUnique({
      where: { commentId_userId: { commentId, userId } },
    });

    if (existing) {
      const [, updated] = await this.prisma.$transaction([
        this.prisma.gameCommentLike.delete({ where: { id: existing.id } }),
        this.prisma.gameComment.update({
          where: { id: commentId },
          data: { likesCount: { decrement: 1 } },
          select: { likesCount: true },
        }),
      ]);
      return { commentId, liked: false, likesCount: Math.max(0, updated.likesCount) };
    }

    const [, updated] = await this.prisma.$transaction([
      this.prisma.gameCommentLike.create({ data: { commentId, userId } }),
      this.prisma.gameComment.update({
        where: { id: commentId },
        data: { likesCount: { increment: 1 } },
        select: { likesCount: true },
      }),
    ]);
    return { commentId, liked: true, likesCount: updated.likesCount };
  }

  /** حذف کامنت خود کاربر */
  async deleteOwnComment(commentId: string, userId: string) {
    const comment = await this.prisma.gameComment.findUnique({
      where: { id: commentId },
      select: { id: true, userId: true, gameId: true, isApproved: true },
    });
    if (!comment) throw new NotFoundException('کامنت یافت نشد');
    if (comment.userId !== userId) {
      throw new ForbiddenException('دسترسی ندارید');
    }

    await this.prisma.gameComment.delete({ where: { id: commentId } });
    if (comment.isApproved) {
      await this.prisma.game.update({
        where: { id: comment.gameId },
        data: { commentsCount: { decrement: 1 } },
      });
    }
    return { success: true };
  }

  // ─── Admin moderation ─────────────────────────────────────────────────────────

  /** فهرست کامنت‌ها برای مودریشن (پیش‌فرض در انتظار تأیید) */
  async listForModeration(filter: 'pending' | 'all' | 'hidden' = 'pending', page = 1, limit = 30) {
    const where: any = {};
    if (filter === 'pending') where.isApproved = false;
    if (filter === 'hidden') where.isHidden = true;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.gameComment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
        include: {
          user: { select: { id: true, fullName: true, avatarUrl: true } },
          game: { select: { id: true, title: true, slug: true } },
        },
      }),
      this.prisma.gameComment.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  /** تأیید کامنت (و افزایش شمارنده commentsCount بازی) */
  async approveComment(commentId: string) {
    const comment = await this.prisma.gameComment.findUnique({
      where: { id: commentId },
      select: { id: true, gameId: true, isApproved: true },
    });
    if (!comment) throw new NotFoundException('کامنت یافت نشد');

    if (comment.isApproved) return comment;

    const [updated] = await this.prisma.$transaction([
      this.prisma.gameComment.update({
        where: { id: commentId },
        data: { isApproved: true, isHidden: false },
      }),
      this.prisma.game.update({
        where: { id: comment.gameId },
        data: { commentsCount: { increment: 1 } },
      }),
    ]);
    return updated;
  }

  /** رد/مخفی‌کردن کامنت */
  async rejectComment(commentId: string) {
    const comment = await this.prisma.gameComment.findUnique({
      where: { id: commentId },
      select: { id: true, gameId: true, isApproved: true },
    });
    if (!comment) throw new NotFoundException('کامنت یافت نشد');

    const ops: any[] = [
      this.prisma.gameComment.update({
        where: { id: commentId },
        data: { isHidden: true, isApproved: false },
      }),
    ];
    if (comment.isApproved) {
      ops.push(
        this.prisma.game.update({
          where: { id: comment.gameId },
          data: { commentsCount: { decrement: 1 } },
        }),
      );
    }
    const [updated] = await this.prisma.$transaction(ops);
    return updated;
  }

  /** حذف کامل کامنت توسط ادمین */
  async adminDeleteComment(commentId: string) {
    const comment = await this.prisma.gameComment.findUnique({
      where: { id: commentId },
      select: { id: true, gameId: true, isApproved: true },
    });
    if (!comment) throw new NotFoundException('کامنت یافت نشد');

    await this.prisma.gameComment.delete({ where: { id: commentId } });
    if (comment.isApproved) {
      await this.prisma.game.update({
        where: { id: comment.gameId },
        data: { commentsCount: { decrement: 1 } },
      });
    }
    return { success: true };
  }

  /** آمار لایک‌ها و کامنت‌ها برای داشبورد */
  async getStats() {
    const [totalLikes, totalComments, pendingComments, topLiked] =
      await Promise.all([
        this.prisma.gameLike.count(),
        this.prisma.gameComment.count({ where: { isApproved: true } }),
        this.prisma.gameComment.count({ where: { isApproved: false, isHidden: false } }),
        this.prisma.game.findMany({
          orderBy: { likesCount: 'desc' },
          take: 10,
          select: { id: true, title: true, slug: true, likesCount: true, commentsCount: true },
        }),
      ]);
    return { totalLikes, totalComments, pendingComments, topLiked };
  }
}
