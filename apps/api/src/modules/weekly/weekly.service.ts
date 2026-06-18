import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const WEEKLY_INCLUDE = {
  category: true,
  branch:   { include: { city: true } },
  images:   { take: 1, orderBy: { displayOrder: 'asc' as const } },
};

@Injectable()
export class WeeklyService {
  constructor(private prisma: PrismaService) {}

  async findWeeklyDiscounts() {
    return this.prisma.game.findMany({
      where: {
        isActive:             true,
        weeklyDiscountPercent: { gt: 0 },
      },
      include: WEEKLY_INCLUDE,
      orderBy: { weeklyDiscountPercent: 'desc' },
    });
  }
}
