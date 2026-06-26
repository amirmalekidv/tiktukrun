import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@tiktakrun/shared-types';

/** Resolve effective branchId for branch-scoped admin users. */
export function resolveBranchScope(
  userRole: UserRole | string,
  userBranchId?: string | null,
  requestedBranchId?: string,
): string | undefined {
  if (userRole === UserRole.BRANCH_MANAGER || userRole === 'BRANCH_MANAGER') {
    if (!userBranchId) {
      throw new ForbiddenException('شعبه کاربر مشخص نیست');
    }
    return userBranchId;
  }
  return requestedBranchId;
}

export function applyBranchToWhere(
  where: Record<string, unknown>,
  userRole: UserRole | string,
  branchId?: string | null,
  field = 'branchId',
): Record<string, unknown> {
  const scoped = resolveBranchScope(userRole, branchId);
  if (scoped) {
    where[field] = scoped;
  }
  return where;
}
