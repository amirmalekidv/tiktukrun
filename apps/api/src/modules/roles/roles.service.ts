import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// ─── Hard-coded permissions enum ──────────────────────────────────────────────
export const PERMISSIONS = [
  'users.read', 'users.write', 'users.ban',
  'games.read', 'games.write',
  'bookings.read', 'bookings.write', 'bookings.refund',
  'wallet.adjust',
  'chats.moderate',
  'crm.read', 'crm.write',
  'finance.read', 'finance.export',
  'settings.read', 'settings.write',
  'gamification.manage',
  'branch.read', 'branch.write',
  'analytics.read',
  'tickets.read', 'tickets.write',
  'campaigns.manage',
  'pipeline.manage',
] as const;
export type Permission = typeof PERMISSIONS[number];

// ─── Built-in roles (UserRole enum keys) ──────────────────────────────────────
const DEFAULT_ROLES: Record<string, Permission[]> = {
  SUPER_ADMIN: PERMISSIONS.slice() as unknown as Permission[],
  ADMIN: [
    'users.read', 'users.write', 'users.ban',
    'games.read', 'games.write',
    'bookings.read', 'bookings.write', 'bookings.refund',
    'wallet.adjust', 'chats.moderate',
    'crm.read', 'crm.write',
    'finance.read', 'finance.export',
    'settings.read', 'settings.write',
    'gamification.manage', 'branch.read', 'branch.write',
    'analytics.read', 'tickets.read', 'tickets.write',
    'campaigns.manage', 'pipeline.manage',
  ],
  SUPPORT: [
    'users.read', 'bookings.read', 'tickets.read', 'tickets.write',
    'chats.moderate',
  ],
  MARKETING: [
    'crm.read', 'crm.write', 'campaigns.manage',
    'pipeline.manage', 'analytics.read',
  ],
  BRANCH_MANAGER: [
    'bookings.read', 'bookings.write', 'games.read',
    'branch.read', 'branch.write', 'analytics.read',
  ],
  CUSTOMER: [],
};

/**
 * RolesService
 * [QA Fix 2026-05-25 v2] Schema has NO `Role` model — only `UserRole` enum.
 *   - All role data is served from the hard-coded DEFAULT_ROLES map.
 *   - Per-user role assignment uses UserRoleAssignment which has (userId Int, role UserRole enum).
 *   - Endpoints that list "Roles" now return the in-memory map.
 */
@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * List all built-in roles with their permissions.
   * Shape mirrors what a Role model would have provided.
   */
  async findAll() {
    return Object.entries(DEFAULT_ROLES).map(([name, permissions], idx) => ({
      id: idx + 1,
      name,
      displayName: this.displayName(name),
      description: `نقش سیستمی ${name}`,
      permissions,
      isSystem: true,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
    }));
  }

  async create(_dto: { code?: string; name: string; displayName?: string; permissions: Permission[]; description?: string }) {
    // No DB-backed Role model — creation of custom roles is not supported in current schema.
    throw new NotFoundException('ایجاد نقش جدید در نسخه فعلی پشتیبانی نمی‌شود (نقش‌ها از enum سیستمی هستند)');
  }

  async setPermissions(_roleId: string | number, _permissions: Permission[]) {
    throw new NotFoundException('ویرایش مجوزها در نسخه فعلی پشتیبانی نمی‌شود (نقش‌ها سیستمی هستند)');
  }

  /**
   * Get assigned UserRole enum values for a user.
   */
  async getUserRoles(userId: string): Promise<string[]> {
    const assignments = await this.prisma.userRoleAssignment.findMany({
      where: { userId: String(userId) },
    });
    return assignments.map((a: any) => a.role as string);
  }

  /**
   * Replace UserRole enum assignments for a user.
   */
  async assignRoles(userId: string, roleNames: string[]) {
    const uid = String(userId);
    const user = await this.prisma.user.findUnique({ where: { id: uid } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.userRoleAssignment.deleteMany({ where: { userId: uid } });
    if (roleNames.length > 0) {
      await this.prisma.userRoleAssignment.createMany({
        data: roleNames.map((r) => ({ userId: uid, role: r as any })),
      });
    }

    return { assigned: roleNames };
  }

  /**
   * Check if a user has a permission based on their UserRole assignments.
   */
  async hasPermission(userId: string | number, permission: Permission): Promise<boolean> {
    const userRoles = await this.getUserRoles(String(userId));
    if (userRoles.length === 0) return false;
    return userRoles.some((r) => (DEFAULT_ROLES[r] || []).includes(permission));
  }

  private displayName(name: string): string {
    const map: Record<string, string> = {
      SUPER_ADMIN: 'مدیر ارشد',
      ADMIN: 'مدیر',
      SUPPORT: 'پشتیبانی',
      MARKETING: 'بازاریابی',
      BRANCH_MANAGER: 'مدیر شعبه',
      CUSTOMER: 'کاربر',
    };
    return map[name] || name;
  }
}
