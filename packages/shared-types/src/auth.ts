import type { UserRole } from './enums';

export interface JwtPayload {
  sub: string;
  mobile: string;
  roles: UserRole[];
  sessionId: string;
  type: 'access' | 'refresh';
}

export interface AuthenticatedUser {
  id: string;
  mobile: string;
  roles: UserRole[];
  role: UserRole;
  /** Primary / first managed branch (backward compatible) */
  branchId?: string;
  /** All branches this user manages (venue owners) */
  branchIds?: string[];
  sessionId: string;
}

export type CurrentUserPayload = AuthenticatedUser;
