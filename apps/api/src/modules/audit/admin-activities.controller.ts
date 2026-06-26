import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Admin - Activities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN', 'MARKETING', 'SUPPORT')
@Controller('admin/activities')
export class AdminActivitiesController {
  constructor(
    private readonly audit: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'فید فعالیت‌های اخیر (audit + bookings + tickets)' })
  async findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '30',
  ) {
    const take = Math.min(Number(limit), 100);
    const items: any[] = [];

    const [auditLogs, recentBookings, recentTickets] = await Promise.all([
      this.audit.findAll({}, 1, take),
      this.prisma.booking.findMany({
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, fullName: true } },
          game: { select: { title: true } },
        },
      }),
      this.prisma.ticket.findMany({
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, fullName: true } },
        },
      }),
    ]);

    for (const log of auditLogs.data as any[]) {
      items.push({
        id: `audit-${log.id}`,
        type: 'audit',
        action: log.action,
        entity: log.entity,
        entityId: log.entityId,
        userId: log.actorId,
        userName: log.actor?.fullName ?? 'سیستم',
        description: `${log.action} ${log.entity ?? ''}`.trim(),
        createdAt: log.createdAt,
      });
    }

    for (const b of recentBookings) {
      items.push({
        id: `booking-${b.id}`,
        type: 'booking',
        action: 'booking.created',
        entity: 'Booking',
        entityId: b.id,
        userId: b.userId,
        userName: b.user?.fullName ?? 'کاربر',
        description: `رزرو ${b.game?.title ?? ''} — ${b.status}`,
        createdAt: b.createdAt,
      });
    }

    for (const t of recentTickets) {
      items.push({
        id: `ticket-${t.id}`,
        type: 'ticket',
        action: 'ticket.created',
        entity: 'Ticket',
        entityId: t.id,
        userId: t.userId,
        userName: t.user?.fullName ?? 'کاربر',
        description: `تیکت: ${t.subject}`,
        createdAt: t.createdAt,
      });
    }

    items.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const p = Number(page);
    const start = (p - 1) * take;
    const data = items.slice(start, start + take);

    return {
      success: true,
      data,
      total: items.length,
      page: p,
      limit: take,
    };
  }
}
