import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@tiktakrun/shared-types';

export interface BranchScopeContext {
  role: UserRole | string;
  branchId?: string | null;
  branchIds?: string[] | null;
}

export function isBranchManagerRole(role: UserRole | string): boolean {
  return role === UserRole.BRANCH_MANAGER || role === 'BRANCH_MANAGER';
}

export function isElevatedAdminRole(role: UserRole | string): boolean {
  return (
    role === UserRole.SUPER_ADMIN ||
    role === UserRole.ADMIN ||
    role === 'SUPER_ADMIN' ||
    role === 'ADMIN'
  );
}

export function getManagedBranchIds(ctx: BranchScopeContext): string[] {
  if (ctx.branchIds?.length) return ctx.branchIds;
  if (ctx.branchId) return [ctx.branchId];
  return [];
}

export function assertBranchManagerHasBranches(ctx: BranchScopeContext): string[] {
  if (!isBranchManagerRole(ctx.role)) return [];
  const ids = getManagedBranchIds(ctx);
  if (!ids.length) {
    throw new ForbiddenException('شعبه کاربر مشخص نیست');
  }
  return ids;
}

/** Resolve branch filter for queries — single id, `{ in: ids }`, or global. */
export function resolveBranchFilter(
  ctx: BranchScopeContext,
  requestedBranchId?: string,
): string | { in: string[] } | undefined {
  if (!isBranchManagerRole(ctx.role)) {
    return requestedBranchId || undefined;
  }

  const ids = assertBranchManagerHasBranches(ctx);

  if (requestedBranchId) {
    if (!ids.includes(requestedBranchId)) {
      throw new ForbiddenException('دسترسی به این شعبه مجاز نیست');
    }
    return requestedBranchId;
  }

  return ids.length === 1 ? ids[0] : { in: ids };
}

/** @deprecated Use resolveBranchFilter — kept for calendar endpoints expecting a single id */
export function resolveBranchScope(
  ctx: BranchScopeContext,
  requestedBranchId?: string,
): string | undefined {
  if (!isBranchManagerRole(ctx.role)) {
    return requestedBranchId;
  }

  const ids = assertBranchManagerHasBranches(ctx);

  if (requestedBranchId) {
    if (!ids.includes(requestedBranchId)) {
      throw new ForbiddenException('دسترسی به این شعبه مجاز نیست');
    }
    return requestedBranchId;
  }

  return ids.length === 1 ? ids[0] : undefined;
}

/** Apply branch filter to a Prisma where clause (supports multi-branch managers). */
export function applyBranchFilter(
  where: Record<string, unknown>,
  ctx: BranchScopeContext,
  field = 'branchId',
): Record<string, unknown> {
  if (!isBranchManagerRole(ctx.role)) return where;

  const ids = assertBranchManagerHasBranches(ctx);
  where[field] = ids.length === 1 ? ids[0] : { in: ids };
  return where;
}

export function assertResourceInBranchScope(
  resourceBranchId: string,
  ctx: BranchScopeContext,
  notFoundMsg = 'یافت نشد',
): void {
  if (!isBranchManagerRole(ctx.role)) return;

  const ids = assertBranchManagerHasBranches(ctx);
  if (!ids.includes(resourceBranchId)) {
    throw new NotFoundException(notFoundMsg);
  }
}

export function toBranchScope(user: {
  role: UserRole | string;
  branchId?: string | null;
  branchIds?: string[] | null;
}): BranchScopeContext {
  return {
    role: user.role,
    branchId: user.branchId,
    branchIds: user.branchIds,
  };
}
