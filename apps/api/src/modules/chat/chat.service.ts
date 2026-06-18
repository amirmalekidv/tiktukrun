import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Resolve (and lazily create) a chat room id for a GLOBAL or TEAM room.
   * MongoDB schema is room-based: ChatRoom { type, teamId? } and
   * ChatMessage references roomId.
   */
  async resolveRoomId(
    roomType: 'GLOBAL' | 'TEAM',
    teamId?: string,
  ): Promise<string> {
    if (roomType === 'TEAM') {
      if (!teamId) throw new NotFoundException('teamId لازم است');
      const existing = await this.prisma.chatRoom.findUnique({
        where: { teamId },
      });
      if (existing) return existing.id;
      const created = await this.prisma.chatRoom.create({
        data: { type: 'TEAM', teamId },
      });
      return created.id;
    }
    // GLOBAL room (single shared room)
    const existing = await this.prisma.chatRoom.findFirst({
      where: { type: 'GLOBAL' },
    });
    if (existing) return existing.id;
    const created = await this.prisma.chatRoom.create({
      data: { type: 'GLOBAL', name: 'Global' },
    });
    return created.id;
  }

  async getGlobalMessages(page = 1, limit = 50) {
    const roomId = await this.resolveRoomId('GLOBAL');
    const skip = (page - 1) * limit;
    const messages = await this.prisma.chatMessage.findMany({
      where: { roomId, status: { not: 'DELETED' } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            profile: { select: { levelId: true } },
          },
        },
      },
    });
    return messages.reverse();
  }

  async getTeamMessages(teamId: string, userId: string, page = 1, limit = 50) {
    // Verify membership
    const member = await this.prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });
    if (!member) throw new ForbiddenException('شما عضو این تیم نیستید');

    const roomId = await this.resolveRoomId('TEAM', teamId);
    const skip = (page - 1) * limit;
    const messages = await this.prisma.chatMessage.findMany({
      where: { roomId, status: { not: 'DELETED' } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });
    return messages.reverse();
  }

  async postGlobalMessage(userId: string, text: string, ip?: string) {
    // Check if user is muted/banned
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    // FIX: check mutedUntil — if mute expired, do not block (consistent with chat.gateway.ts logic)
    if (user.isMuted && (!user.mutedUntil || user.mutedUntil > new Date())) {
      throw new ForbiddenException('شما موقتاً محدود شده‌اید');
    }
    if (user.isBanned) throw new ForbiddenException('حساب شما مسدود شده');

    const roomId = await this.resolveRoomId('GLOBAL');

    // Rate limit check (5 msg/min from setting)
    const rateLimit = Number(
      await this.settings.get('chat.rateLimit', '5'),
    );
    const oneMinAgo = new Date(Date.now() - 60_000);
    const recentCount = await this.prisma.chatMessage.count({
      where: { userId, roomId, createdAt: { gte: oneMinAgo } },
    });
    if (recentCount >= rateLimit) {
      throw new ForbiddenException('سرعت ارسال پیام از حد مجاز بیشتر است');
    }

    const message = await this.prisma.chatMessage.create({
      data: {
        userId: userId,
        roomId,
        text,
        status: 'NORMAL',
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            profile: { select: { levelId: true } },
          },
        },
      },
    });

    return message;
  }

  async reportMessage(messageId: string, reporterId: string, reason?: string) {
    const message = await this.prisma.chatMessage.findUnique({
      where: { id: messageId },
    });
    if (!message) throw new NotFoundException('پیام یافت نشد');

    await this.prisma.chatReport.create({
      data: { messageId, reporterId, reason },
    });

    const newCount = (message.reportsCount ?? 0) + 1;
    await this.prisma.chatMessage.update({
      where: { id: messageId },
      data: { reportsCount: newCount },
    });

    // Auto-mute sender if reports >= 3 and setting enabled
    const autoMute = await this.settings.get('chat.autoMuteOnReports', 'true');
    const autoMuteThreshold = Number(
      await this.settings.get('chat.autoMuteThreshold', '3'),
    );
    if (autoMute === 'true' && newCount >= autoMuteThreshold) {
      await this.prisma.user.update({
        where: { id: message.userId },
        data: { isMuted: true, mutedUntil: new Date(Date.now() + 60 * 60_000) },
      });
    }

    return { reportsCount: newCount };
  }

  async hideMessage(messageId: string, adminId: string, reason?: string) {
    const msg = await this.prisma.chatMessage.update({
      where: { id: messageId },
      data: { status: 'HIDDEN' },
      include: { room: { select: { type: true, teamId: true } } },
    });
    await this.audit.log({
      actorId: adminId,
      action: 'chat.hide',
      entity: 'ChatMessage',
      entityId: messageId,
      after: { status: 'HIDDEN', reason },
    });
    return msg;
  }

  async deleteMessage(messageId: string, adminId: string) {
    const msg = await this.prisma.chatMessage.update({
      where: { id: messageId },
      data: { status: 'DELETED', deletedAt: new Date() },
      include: { room: { select: { type: true, teamId: true } } },
    });
    await this.audit.log({
      actorId: adminId,
      action: 'chat.delete',
      entity: 'ChatMessage',
      entityId: messageId,
    });
    return msg;
  }

  async muteUser(
    userId: string,
    adminId: string,
    hours: number,
    reason?: string,
  ) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        isMuted: true,
        mutedUntil: new Date(Date.now() + hours * 3600_000),
      },
    });
    await this.audit.log({
      actorId: adminId,
      action: 'user.mute',
      entity: 'User',
      entityId: userId,
      after: { hours, reason },
    });
    return user;
  }

  async warnUser(userId: string, adminId: string, message: string) {
    await this.prisma.notification.create({
      data: {
        userId: userId,
        type: 'SYSTEM',
        title: '⚠️ اخطار',
        body: message,
        metadata: { adminId, kind: 'WARNING' },
      },
    });
    await this.audit.log({
      actorId: adminId,
      action: 'user.warn',
      entity: 'User',
      entityId: userId,
      after: { message },
    });
  }

  async getChatStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [messagesToday, reportsToday, mutedUsers, bannedUsers] =
      await Promise.all([
        this.prisma.chatMessage.count({ where: { createdAt: { gte: today } } }),
        this.prisma.chatReport.count({ where: { createdAt: { gte: today } } }),
        this.prisma.user.count({ where: { isMuted: true } }),
        this.prisma.user.count({ where: { isBanned: true } }),
      ]);

    // Peak hour analysis (last 24h) — MongoDB: compute in JS over recent messages
    let peakHour = 20;
    try {
      const dayAgo = new Date(Date.now() - 24 * 3600_000);
      const recent = await this.prisma.chatMessage.findMany({
        where: { createdAt: { gte: dayAgo } },
        select: { createdAt: true },
      });
      if (recent.length > 0) {
        const buckets = new Array(24).fill(0);
        for (const m of recent) {
          buckets[new Date(m.createdAt).getHours()]++;
        }
        peakHour = buckets.indexOf(Math.max(...buckets));
      }
    } catch {
      /* table may be empty */
    }

    return {
      messagesToday,
      reportsToday,
      mutedUsers,
      bannedUsers,
      peakHour,
      avgResponseTime: 0, // Real implementation requires tracking
    };
  }
}
