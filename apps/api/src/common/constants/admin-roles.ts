import { UserRole } from '@tiktakrun/shared-types';

/** Super Admin only — backup, audit, role catalog */
export const SUPER_ADMIN_ROLES = [UserRole.SUPER_ADMIN] as const;

/** Platform-wide administrators (not branch-scoped) */
export const PLATFORM_ADMIN_ROLES = [UserRole.SUPER_ADMIN, UserRole.ADMIN] as const;

/** Branch-scoped ops + platform admins — bookings, games read, branch profile */
export const BRANCH_OPS_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.BRANCH_MANAGER,
] as const;

/** Any staff role that may access the admin panel */
export const STAFF_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.BRANCH_MANAGER,
  UserRole.SUPPORT,
  UserRole.MARKETING,
] as const;
