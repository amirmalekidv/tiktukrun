import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ValidateInviteDto, ApplyInviteDto } from './dto/invite.dto';
import { TransactionCurrency, TransactionRefType } from '@tiktakrun/shared-types';
import { TransactionType, NotificationType, NotificationChannel } from '@prisma/client';

const INVITE_REWARD_XP = 5;

@Injectable()
export class InvitesService {
  private readonly logger = new Logger(InvitesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get current user's invite info
   * [QA Fix 2026-05-25] schema relations:
   *   User.invitees: User[] (users this user invited via "InviteRelation")
   *   But the actual InviteUsage records via User.inviteUsages won't work because
   *   inviteUsages is the receiving side (kayfan dawat shode). For sent invites,
   *   we query InviteCode.usages reverse (user.inviteCodeRecord.usages).
   *   Simpler approach: count users where invitedById = this user.
   */
  async getMyInvite(userId: string) {
    const uid = userId;
    const user = await this.prisma.user.findUnique({
      where: { id: uid },
      select: { id: true, inviteCode: true },
    });

    if (!user) throw new NotFoundException('کاربر یافت نشد');

    // People this user invited (via invitedById relation)
    const invitees = await this.prisma.user.findMany({
      where: { invitedById: uid },
      select: { id: true, fullName: true, nickname: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const totalRewardXp = invitees.length * INVITE_REWARD_XP;

    return {
      code: user.inviteCode,
      totalUses: invitees.length,
      totalRewardXp,
      recentUsages: invitees.map((invitee) => ({
        inviteeId: invitee.id,
        inviteeName: invitee.nickname || invitee.fullName || 'کاربر جدید',
        rewardXp: INVITE_REWARD_XP,
        joinedAt: invitee.createdAt,
      })),
    };
  }

  /**
   * Validate an invite code
   * [QA Fix 2026-05-25] schema: User has no isDeleted (uses deletedAt)
   */
  async validateInviteCode(dto: ValidateInviteDto) {
    const user = await this.prisma.user.findFirst({
      where: { inviteCode: dto.code, deletedAt: null, isBanned: false } as any,
      select: { id: true, nickname: true, fullName: true },
    });

    if (!user) {
      return { valid: false, message: 'کد دعوت نامعتبر است' };
    }

    return {
      valid: true,
      ownerName: user.nickname || user.fullName || 'دوست شما',
    };
  }

  /**
   * Apply an invite code (for authenticated user)
   * [QA Fix 2026-05-25] schema: InviteUsage has codeId/invitedUserId/rewardXpGiven (not code/inviterId/inviteeId/rewardXp)
   *   Wallet has no xpBalance (xp is on UserProfile)
   *   User.invitedById is the inviter relation
   */
  async applyInviteCode(userId: string, dto: ApplyInviteDto) {
    const uid = userId;

    // Check if already used an invite (this user is the invitedUser)
    const existing = await this.prisma.inviteUsage.findUnique({
      where: { invitedUserId: uid } as any,
    });
    if (existing) {
      throw new ConflictException('شما قبلاً از یک کد دعوت استفاده کرده‌اید');
    }

    // Find inviter user by their inviteCode
    const inviter = await this.prisma.user.findFirst({
      where: {
        inviteCode: dto.code,
        id: { not: uid },
        deletedAt: null,
        isBanned: false,
      } as any,
      select: { id: true, inviteCodeRecord: { select: { id: true } } } as any,
    }) as any;

    if (!inviter || !inviter.inviteCodeRecord) {
      throw new NotFoundException('کد دعوت یافت نشد یا نامعتبر است');
    }

    const inviterId = inviter.id;
    const codeId = inviter.inviteCodeRecord.id;

    // Apply invite in transaction
    await this.prisma.$transaction(async (tx) => {
      // Record usage
      await tx.inviteUsage.create({
        data: {
          codeId,
          invitedUserId: uid,
          rewardXpGiven: INVITE_REWARD_XP,
        } as any,
      });

      // Mark inviter relationship on the invited user (only if not set)
      await tx.user.update({
        where: { id: uid },
        data: { invitedById: inviterId } as any,
      });

      // Increment InviteCode totals
      await tx.inviteCode.update({
        where: { id: codeId },
        data: {
          totalUses: { increment: 1 },
          totalRewardXp: { increment: INVITE_REWARD_XP },
        },
      });

      // Award XP to inviter profile (xp lives on UserProfile)
      await tx.userProfile.update({
        where: { userId: inviterId },
        data: { xp: { increment: INVITE_REWARD_XP } } as any,
      });

      // Notify inviter
      await tx.notification.create({
        data: {
          userId: inviterId,
          type: NotificationType.SYSTEM,
          title: '🎉 دوست شما ثبت‌نام کرد!',
          body: `یک نفر با کد دعوت شما ثبت‌نام کرد و ${INVITE_REWARD_XP} XP به شما تعلق گرفت`,
          channel: NotificationChannel.INAPP,
          metadata: { invitedUserId: uid, rewardXp: INVITE_REWARD_XP },
        } as any,
      });
    });

    return {
      message: 'کد دعوت با موفقیت اعمال شد',
      reward: { xpForInviter: INVITE_REWARD_XP },
    };
  }
}
