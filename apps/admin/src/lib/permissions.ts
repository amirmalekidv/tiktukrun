import type { AdminUser } from '@/types';
import {
  DEFAULT_ROLE_PERMISSIONS,
  roleHasUiPermission,
  resolveUiPermission,
  type Permission,
} from '@tiktakrun/shared-types';

export type AdminRole = keyof typeof DEFAULT_ROLE_PERMISSIONS;

export function can(user: AdminUser | null, permission: string): boolean {
  if (!user) return false;

  const roles = user.roles.map((r) => (typeof r === 'string' ? r : r));
  if (roles.includes('SUPER_ADMIN')) return true;

  if (user.permissions.includes(permission)) return true;
  if (user.permissions.includes('*')) return true;

  const backendPerms = resolveUiPermission(permission);

  for (const role of roles) {
    if (roleHasUiPermission(role, permission)) return true;
    for (const p of backendPerms) {
      if ((DEFAULT_ROLE_PERMISSIONS[role] ?? []).includes(p)) return true;
    }
    const rolePerms = DEFAULT_ROLE_PERMISSIONS[role] ?? [];
    if ((rolePerms as readonly string[]).includes(permission)) return true;
  }

  return false;
}

export function canAny(user: AdminUser | null, permissions: string[]): boolean {
  return permissions.some((p) => can(user, p));
}

export function canAll(user: AdminUser | null, permissions: string[]): boolean {
  return permissions.every((p) => can(user, p));
}

export function getRoleLabel(role: AdminRole | string): string {
  const map: Record<string, string> = {
    SUPER_ADMIN: 'مدیر ارشد',
    ADMIN: 'مدیر',
    BRANCH_MANAGER: 'مالک شعبه',
    SUPPORT: 'پشتیبانی',
    MARKETING: 'بازاریابی',
    CUSTOMER: 'مشتری',
  };
  return map[role] || role;
}

export function getBackendPermissions(role: AdminRole): readonly Permission[] {
  return DEFAULT_ROLE_PERMISSIONS[role] ?? [];
}
