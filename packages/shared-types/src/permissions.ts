/**
 * Canonical RBAC permissions — single source for API and admin UI.
 */
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

export type Permission = (typeof PERMISSIONS)[number];

export const DEFAULT_ROLE_PERMISSIONS: Record<string, readonly Permission[]> = {
  SUPER_ADMIN: PERMISSIONS,
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
    // branch.read: scoped reads for filters / own branch context — not catalog admin UI
    'branch.read', 'analytics.read',
  ],
  CUSTOMER: [],
};

/** Maps legacy admin UI permission strings to backend permissions. */
export const UI_PERMISSION_ALIASES: Record<string, readonly Permission[]> = {
  'dashboard.view': ['analytics.read'],
  'customers.view': ['crm.read'],
  'customers.write': ['crm.write'],
  'customers.delete': ['crm.write'],
  'customers.ban': ['users.ban'],
  'segments.view': ['crm.read'],
  'segments.write': ['crm.write'],
  'segments.delete': ['crm.write'],
  'pipeline.view': ['pipeline.manage'],
  'pipeline.write': ['pipeline.manage'],
  'pipeline.delete': ['pipeline.manage'],
  'campaigns.view': ['campaigns.manage'],
  'campaigns.write': ['campaigns.manage'],
  'campaigns.send': ['campaigns.manage'],
  'campaigns.delete': ['campaigns.manage'],
  'bookings.view': ['bookings.read'],
  'bookings.write': ['bookings.write'],
  'bookings.cancel': ['bookings.write'],
  'analytics.view': ['analytics.read'],
  'activities.view': ['analytics.read'],
  'settings.view': ['settings.read'],
  'settings.write': ['settings.write'],
  'games.view': ['games.read'],
  'games.write': ['games.write'],
  'branches.view': ['branch.read'],
  'branches.write': ['branch.write'],
  'tickets.view': ['tickets.read'],
  'tickets.write': ['tickets.write'],
  'chats.view': ['chats.moderate'],
  'chats.write': ['chats.moderate'],
  'finance.view': ['finance.read'],
  'finance.export': ['finance.export'],
  'roles.read': ['settings.read'],
  'staff.read': ['users.read'],
  'audit.read': ['settings.read'],
  'gamification.view': ['gamification.manage'],
  'gamification.write': ['gamification.manage'],
  'discounts.view': ['campaigns.manage'],
  'discounts.write': ['campaigns.manage'],
  'reports.view': ['analytics.read'],
  'backup.view': ['settings.read'],
  'monthly.view': ['gamification.manage'],
  'transactions.read': ['finance.read'],
  'payments.read': ['finance.read'],
};

export function resolveUiPermission(uiPermission: string): readonly Permission[] {
  if ((PERMISSIONS as readonly string[]).includes(uiPermission)) {
    return [uiPermission as Permission];
  }
  return UI_PERMISSION_ALIASES[uiPermission] ?? [];
}

export function roleHasPermission(
  role: string,
  permission: Permission,
): boolean {
  const perms = DEFAULT_ROLE_PERMISSIONS[role];
  if (!perms) return false;
  return perms.includes(permission);
}

export function roleHasUiPermission(role: string, uiPermission: string): boolean {
  if (role === 'SUPER_ADMIN') return true;
  const resolved = resolveUiPermission(uiPermission);
  if (resolved.length === 0) {
    return roleHasPermission(role, uiPermission as Permission);
  }
  return resolved.some((p) => roleHasPermission(role, p));
}
