import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import {
  PERMISSIONS,
  Permission,
  DEFAULT_ROLE_PERMISSIONS,
} from '@tiktakrun/shared-types';
import { PrismaService } from '../../prisma/prisma.service';

export { PERMISSIONS, Permission };

const DEFAULT_ROLES: Record<string, Permission[]> = Object.fromEntries(
  Object.entries(DEFAULT_ROLE_PERMISSIONS).map(([name, perms]) => [
    name,
    [...perms],
  ]),
) as Record<string, Permission[]>;

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

  async findOne(idOrName: string) {
    const roles = await this.findAll();
    const match =
      roles.find((r) => String(r.id) === idOrName) ??
      roles.find((r) => r.name === idOrName);
    if (!match) throw new NotFoundException('نقش یافت نشد');
    return match;
  }

  async getUsersWithRole(roleName: string, limit = 50) {
    const assignments = await this.prisma.userRoleAssignment.findMany({
      where: { role: roleName as any },
      take: limit,
      include: {
        user: {
          select: { id: true, fullName: true, mobile: true, avatarUrl: true },
        },
      },
    });
    return assignments.map((a: any) => a.user);
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
