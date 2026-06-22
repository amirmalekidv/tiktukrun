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
  branchId?: string;
  sessionId: string;
}

export type CurrentUserPayload = AuthenticatedUser;
