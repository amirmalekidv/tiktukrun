import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { NotificationType } from '@tiktakrun/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ChatGateway } from '../chat/chat.gateway';

@Injectable()
export class TeamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
  ) {}

  async findAll(cityId?: string, gameId?: string, page = 1, limit = 20) {
    const where: any = { status: 'FORMING' };
    if (cityId) where.branch = { cityId };
    if (gameId) where.gameId = gameId;

    const [data, total] = await Promise.all([
      this.prisma.team.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          captain: { select: { id: true, fullName: true, avatarUrl: true } },
          game: { select: { id: true, title: true, coverImage: true } },
          branch: { select: { id: true, name: true, city: true } },
          _count: { select: { members: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.team.count({ where }),
    ]);

    return { data, total };
  }

  async findOne(id: string) {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: {
        captain: { select: { id: true, fullName: true, avatarUrl: true } },
        game: { select: { id: true, title: true, coverImage: true } },
        branch: { select: { id: true, name: true } },
        members: {
          include: {
            user: { select: { id: true, fullName: true, avatarUrl: true, profile: { select: { levelId: true } } } },
          },
        },
      },
    });
    if (!team) throw new NotFoundException('تیم یافت نشد');
    return team;
  }

  async create(captainId: string, dto: any) {
    const team = await this.prisma.team.create({
      data: {
        name: dto.name,
        gameId: dto.gameId,
        branchId: dto.branchId,
        capacity: dto.capacity,
        slotDateTime: dto.slotDateTime ? new Date(dto.slotDateTime) : undefined,
        description: dto.description,
        isPublic: dto.isPublic ?? true,
        captainId,
        status: 'FORMING',
        members: {
          create: { userId: captainId, role: 'CAPTAIN' },
        },
      },
    });
    return team;
  }

  async join(teamId: string, userId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: { _count: { select: { members: true } } },
    });
    if (!team) throw new NotFoundException('تیم یافت نشد');
    if (team.status !== 'FORMING') {
      throw new BadRequestException('این تیم دیگر عضو نمی‌پذیرد');
    }
    if (team._count.members >= team.capacity) {
      throw new BadRequestException('ظرفیت تیم پر است');
    }

    const existing = await this.prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });
    if (existing) throw new BadRequestException('شما قبلاً عضو این تیم هستید');

    await this.prisma.teamMember.create({
      data: { teamId, userId, role: 'MEMBER' },
    });

    // Check if full
    const newCount = team._count.members + 1;
    if (newCount >= team.capacity) {
      await this.prisma.team.update({
        where: { id: teamId },
        data: { status: 'FULL' },
      });

      // Notify all members
      const members = await this.prisma.teamMember.findMany({
        where: { teamId },
      });
      for (const m of members) {
        await this.notifications.send({
          userId: m.userId,
          type: NotificationType.TEAM_FULL,
          title: '✅ تیم کامل شد!',
          body: `تیم "${team.name}" به ظرفیت کامل رسید.`,
          data: { teamId },
        });
      }
    }

    return { joined: true };
  }

  async leave(teamId: string, userId: string) {
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    if (!team) throw new NotFoundException('تیم یافت نشد');
    if (team.captainId === userId) {
      throw new BadRequestException('کاپیتان نمی‌تواند از تیم خارج شود. ابتدا تیم را حذف کنید');
    }

    await this.prisma.teamMember.delete({
      where: { teamId_userId: { teamId, userId } },
    });

    // If was FULL, go back to FORMING
    if (team.status === 'FULL') {
      await this.prisma.team.update({
        where: { id: teamId },
        data: { status: 'FORMING' },
      });
    }

    return { left: true };
  }

  async kick(teamId: string, captainId: string, targetUserId: string) {
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    if (!team) throw new NotFoundException('تیم یافت نشد');
    if (team.captainId !== captainId) {
      throw new ForbiddenException('فقط کاپیتان می‌تواند عضو را اخراج کند');
    }
    if (targetUserId === captainId) {
      throw new BadRequestException('کاپیتان نمی‌تواند خودش را اخراج کند');
    }

    await this.prisma.teamMember.delete({
      where: { teamId_userId: { teamId, userId: targetUserId } },
    });

    if (team.status === 'FULL') {
      const count = await this.prisma.teamMember.count({ where: { teamId } });
      if (count < team.capacity) {
        await this.prisma.team.update({
          where: { id: teamId },
          data: { status: 'FORMING' },
        });
      }
    }

    this.chatGateway.emitUserKicked(teamId, targetUserId);

    return { kicked: true };
  }

  async delete(teamId: string, captainId: string) {
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    if (!team) throw new NotFoundException('تیم یافت نشد');
    if (team.captainId !== captainId) {
      throw new ForbiddenException('فقط کاپیتان می‌تواند تیم را حذف کند');
    }

    await this.prisma.teamMember.deleteMany({ where: { teamId } });
    await this.prisma.team.delete({ where: { id: teamId } });

    return { deleted: true };
  }
}
