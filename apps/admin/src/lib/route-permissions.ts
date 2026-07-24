import type { AdminUser } from '@/types';
import { can } from '@/lib/permissions';

/** Longest-prefix wins. Omit permission = any authenticated admin. */
const ROUTE_PERMISSIONS: { prefix: string; permission: string }[] = [
  { prefix: '/roles', permission: 'settings.read' },
  { prefix: '/staff', permission: 'users.read' },
  { prefix: '/audit', permission: 'settings.read' },
  { prefix: '/backup', permission: 'settings.read' },
  { prefix: '/settings', permission: 'settings.read' },
  { prefix: '/customers', permission: 'customers.view' },
  { prefix: '/branch-managers', permission: 'users.read' },
  { prefix: '/segments', permission: 'segments.view' },
  { prefix: '/pipeline', permission: 'pipeline.view' },
  { prefix: '/campaigns', permission: 'campaigns.view' },
  { prefix: '/bookings', permission: 'bookings.view' },
  { prefix: '/games/new', permission: 'games.write' },
  { prefix: '/games', permission: 'games.view' },
  { prefix: '/branches/new', permission: 'branches.write' },
  { prefix: '/branches', permission: 'branches.view' },
  { prefix: '/cities', permission: 'branches.write' },
  { prefix: '/categories', permission: 'games.write' },
  { prefix: '/landing-banners', permission: 'games.write' },
  { prefix: '/platform-intro', permission: 'games.write' },
  { prefix: '/landing-sections', permission: 'games.write' },
  { prefix: '/reviews', permission: 'games.write' },
  { prefix: '/comments', permission: 'games.view' },
  { prefix: '/chats', permission: 'chats.view' },
  { prefix: '/tickets', permission: 'tickets.view' },
  { prefix: '/transactions', permission: 'finance.view' },
  { prefix: '/payments', permission: 'finance.view' },
  { prefix: '/reports', permission: 'reports.view' },
  { prefix: '/wheel', permission: 'gamification.view' },
  { prefix: '/badges', permission: 'gamification.view' },
  { prefix: '/levels', permission: 'gamification.view' },
  { prefix: '/avatars', permission: 'gamification.view' },
  { prefix: '/discounts', permission: 'discounts.view' },
  { prefix: '/monthly', permission: 'monthly.view' },
  { prefix: '/dashboard', permission: 'dashboard.view' },
  { prefix: '/activities', permission: 'activities.view' },
];

/** Branch/city catalog & location admin — not for branch-scoped managers */
const PLATFORM_ADMIN_PREFIXES = [
  '/branches',
  '/cities',
];

export function canAccessPath(user: AdminUser | null, pathname: string): boolean {
  if (!user) return false;
  if (user.roles.includes('SUPER_ADMIN')) return true;

  if (PLATFORM_ADMIN_PREFIXES.some((prefix) =>
    pathname === prefix || pathname.startsWith(`${prefix}/`),
  )) {
    return isPlatformAdmin(user);
  }

  const match = ROUTE_PERMISSIONS.find(({ prefix }) =>
    pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!match) return true;
  return can(user, match.permission);
}

export function isBranchOwner(user: AdminUser | null): boolean {
  if (!user) return false;
  if (user.roles.includes('SUPER_ADMIN') || user.roles.includes('ADMIN')) return false;
  return user.roles.includes('BRANCH_MANAGER');
}

export function isSuperAdmin(user: AdminUser | null): boolean {
  return !!user?.roles.includes('SUPER_ADMIN');
}

export function isPlatformAdmin(user: AdminUser | null): boolean {
  return !!user?.roles.some((r) => r === 'SUPER_ADMIN' || r === 'ADMIN');
}
