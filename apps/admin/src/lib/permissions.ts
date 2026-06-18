import type { AdminUser, AdminRole } from '@/types'

// =============================================
// TIK TAK RUN Admin — Permission System
// =============================================

const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  SUPER_ADMIN: ['*'], // All permissions
  ADMIN: [
    'dashboard.view',
    'customers.view', 'customers.write', 'customers.delete', 'customers.ban',
    'segments.view', 'segments.write', 'segments.delete',
    'pipeline.view', 'pipeline.write', 'pipeline.delete',
    'campaigns.view', 'campaigns.write', 'campaigns.send', 'campaigns.delete',
    'bookings.view', 'bookings.write', 'bookings.cancel',
    'analytics.view',
    'activities.view',
    'settings.view',
  ],
  MANAGER: [
    'dashboard.view',
    'customers.view', 'customers.write',
    'segments.view', 'segments.write',
    'pipeline.view', 'pipeline.write',
    'campaigns.view', 'campaigns.write', 'campaigns.send',
    'bookings.view', 'bookings.write',
    'analytics.view',
    'activities.view',
  ],
  SUPPORT: [
    'dashboard.view',
    'customers.view',
    'bookings.view', 'bookings.write',
    'activities.view',
    'pipeline.view',
  ],
  ANALYST: [
    'dashboard.view',
    'customers.view',
    'analytics.view',
    'activities.view',
    'segments.view',
    'campaigns.view',
  ],
}

export function can(user: AdminUser | null, permission: string): boolean {
  if (!user) return false
  if (user.roles.includes('SUPER_ADMIN')) return true
  
  // Check user-specific permissions first
  if (user.permissions.includes(permission)) return true
  if (user.permissions.includes('*')) return true
  
  // Check role-based permissions
  for (const role of user.roles) {
    const rolePerms = ROLE_PERMISSIONS[role] || []
    if (rolePerms.includes('*')) return true
    if (rolePerms.includes(permission)) return true
  }
  
  return false
}

export function canAny(user: AdminUser | null, permissions: string[]): boolean {
  return permissions.some(p => can(user, p))
}

export function canAll(user: AdminUser | null, permissions: string[]): boolean {
  return permissions.every(p => can(user, p))
}

export function getRoleLabel(role: AdminRole): string {
  const map: Record<AdminRole, string> = {
    SUPER_ADMIN: 'مدیر ارشد',
    ADMIN: 'مدیر',
    MANAGER: 'سرپرست',
    SUPPORT: 'پشتیبانی',
    ANALYST: 'تحلیل‌گر',
  }
  return map[role] || role
}
