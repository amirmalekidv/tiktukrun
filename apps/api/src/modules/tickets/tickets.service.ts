import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

function generateTicketCode(): string {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `TKT-${num}`;
}

@Injectable()
export class TicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // ─── User operations ─────────────────────────────

  async create(userId: string, dto: any) {
    const ticket = await this.prisma.ticket.create({
      data: {
        code: generateTicketCode(),
        userId,
        subject: dto.subject,
        body: dto.body,
        priority: dto.priority ?? 'MEDIUM',
        branchId: dto.branchId,
        status: 'OPEN',
      },
    });
    return ticket;
  }

  async findMyTickets(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where: { userId: userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { messages: true } },
        },
      }),
      this.prisma.ticket.count({ where: { userId: userId } }),
    ]);
    return { data, total };
  }

  async findMyTicket(userId: string, id: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: { select: { id: true, fullName: true, avatarUrl: true } },
          },
        },
        branch: { select: { id: true, name: true } },
      },
    });
    if (!ticket) throw new NotFoundException('تیکت یافت نشد');
    if (ticket.userId !== userId) throw new ForbiddenException('دسترسی ندارید');
    return ticket;
  }

  async replyByUser(userId: string, ticketId: string, text: string, attachments?: string[]) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });
    if (!ticket) throw new NotFoundException('تیکت یافت نشد');
    if (ticket.userId !== userId) throw new ForbiddenException('دسترسی ندارید');
    if (ticket.status === 'CLOSED') {
      throw new ForbiddenException('تیکت بسته شده است');
    }

    const message = await this.prisma.ticketMessage.create({
      data: {
        ticketId,
        senderId: userId,
        body: text,
        attachments: attachments ?? [],
        isStaffReply: false,
      },
    });

    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { lastReplyAt: new Date(), status: 'IN_PROGRESS' },
    });

    // Notify assignee
    if (ticket.assigneeId) {
      await this.notifications.send({
        userId: ticket.assigneeId,
        type: 'TICKET_REPLY',
        title: `📩 پاسخ کاربر - تیکت ${ticket.code}`,
        body: text.slice(0, 100),
        data: { ticketId },
      });
    }

    return message;
  }

  // ─── Admin operations ──────────────────────────────

  async findAllAdmin(filter: any, page = 1, limit = 20) {
    const where: any = {};
    if (filter.status) where.status = filter.status;
    if (filter.priority) where.priority = filter.priority;
    if (filter.assigneeId) where.assigneeId = filter.assigneeId;

    const [data, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, fullName: true, mobile: true } },
          assignee: { select: { id: true, fullName: true } },
          _count: { select: { messages: true } },
        },
      }),
      this.prisma.ticket.count({ where }),
    ]);
    return { data, total };
  }

  async findOneAdmin(id: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true, mobile: true } },
        assignee: { select: { id: true, fullName: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: { select: { id: true, fullName: true, avatarUrl: true } },
          },
        },
      },
    });
    if (!ticket) throw new NotFoundException('تیکت یافت نشد');
    return ticket;
  }

  async updateAdmin(id: string, dto: any) {
    return this.prisma.ticket.update({
      where: { id },
      data: {
        ...(dto.status && { status: dto.status }),
        ...(dto.priority && { priority: dto.priority }),
        ...(dto.assigneeId && { assigneeId: dto.assigneeId }),
      },
    });
  }

  async replyByStaff(staffId: string, ticketId: string, text: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });
    if (!ticket) throw new NotFoundException('تیکت یافت نشد');

    const message = await this.prisma.ticketMessage.create({
      data: {
        ticketId,
        senderId: staffId,
        body: text,
        isStaffReply: true,
      },
    });

    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        lastReplyAt: new Date(),
        status: 'WAITING_USER',
      },
    });

    // Notify user
    await this.notifications.send({
      userId: ticket.userId,
      type: 'TICKET_REPLY',
      title: `💬 پاسخ پشتیبانی - تیکت ${ticket.code}`,
      body: text.slice(0, 100),
      data: { ticketId },
    });

    return message;
  }

  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [open, inProgress, closedToday] = await Promise.all([
      this.prisma.ticket.count({ where: { status: 'OPEN' } }),
      this.prisma.ticket.count({ where: { status: { in: ['IN_PROGRESS', 'WAITING_USER'] as any } } }),
      this.prisma.ticket.count({
        where: { status: 'CLOSED', updatedAt: { gte: today } },
      }),
    ]);

    // Avg response time (first staff reply - ticket creation)
    // [QA Fix 2026-05-25] table=tickets/ticket_messages, column=isStaffReply
    let avgResponseTime = 0;
    try {
      const avgResult = await this.prisma.$queryRaw<{ avg: number }[]>`
        SELECT AVG(EXTRACT(EPOCH FROM (m."createdAt" - t."createdAt")) / 3600) as avg
        FROM "tickets" t
        JOIN "ticket_messages" m ON m."ticketId" = t.id
        WHERE m."isStaffReply" = true
        AND m."createdAt" = (
          SELECT MIN(m2."createdAt") FROM "ticket_messages" m2
          WHERE m2."ticketId" = t.id AND m2."isStaffReply" = true
        )
      `;
      avgResponseTime = Number(avgResult[0]?.avg ?? 0);
    } catch {
      /* table may be empty */
    }

    return {
      open,
      inProgress,
      closedToday,
      avgResponseTime,
      satisfactionRate: 4.2, // Mock — implement via rating after close
    };
  }
}
