'use client';
import { useAuthStore } from '../store/auth';

const PERMISSION_MAP: Record<string, string[]> = {
  SUPER_ADMIN: ['*'],
  ADMIN: [
    'bookings.*', 'games.*', 'branches.*', 'cities.*', 'categories.*',
    'reviews.*', 'chats.*', 'tickets.*', 'transactions.read', 'payments.read',
    'reports.*', 'backup.*', 'gamification.*', 'discounts.*', 'monthly.*',
    'settings.*', 'roles.read', 'staff.read', 'audit.read',
  ],
  BRANCH_MANAGER: ['bookings.*', 'games.read', 'reviews.*', 'tickets.*'],
  SUPPORT: ['tickets.*', 'chats.*', 'bookings.read', 'users.read'],
  MARKETING: ['discounts.*', 'reports.read', 'gamification.read'],
};

export function usePermissions() {
  const user = useAuthStore((s) => s.user);

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;

    for (const role of user.roles) {
      const perms = PERMISSION_MAP[role.name] || role.permissions || [];

      if (perms.includes('*')) return true;

      for (const p of perms) {
        if (p === permission) return true;
        if (p.endsWith('.*')) {
          const prefix = p.slice(0, -2);
          if (permission.startsWith(prefix)) return true;
        }
      }
    }

    return false;
  };

  const can = (action: string, resource: string) =>
    hasPermission(`${resource}.${action}`) || hasPermission(`${resource}.*`);

  return { hasPermission, can };
}
