'use client';

import { useAuthStore } from '../store/auth';
import {
  DEFAULT_ROLE_PERMISSIONS,
  roleHasPermission,
  roleHasUiPermission,
} from '@tiktakrun/shared-types';

export function usePermissions() {
  const user = useAuthStore((s) => s.user);

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;

    for (const rawRole of user.roles) {
      const role = typeof rawRole === 'string' ? rawRole : String(rawRole);
      if (role === 'SUPER_ADMIN') return true;
      if (roleHasUiPermission(role, permission)) return true;
      if (roleHasPermission(role, permission as never)) return true;
    }

    return false;
  };

  const can = (action: string, resource: string) =>
    hasPermission(`${resource}.${action}`) || hasPermission(`${resource}.*`);

  const rolePermissions = (role: string) =>
    DEFAULT_ROLE_PERMISSIONS[role] ?? [];

  return { hasPermission, can, rolePermissions };
}
