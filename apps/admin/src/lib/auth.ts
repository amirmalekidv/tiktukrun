// =============================================
// TIK TAK RUN Admin — Auth Token Management
// =============================================

const ACCESS_TOKEN_KEY = 'ttr_admin_access_token'
const REFRESH_TOKEN_KEY = 'ttr_admin_refresh_token'
const ADMIN_USER_KEY = 'ttr_admin_user'
/** Zustand persist key — must stay in sync with authStore */
export const ADMIN_AUTH_PERSIST_KEY = 'ttr-admin-auth'

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}

export function clearTokens(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(ADMIN_USER_KEY)
  // Drop persisted auth identity so a new login cannot revive a previous role
  localStorage.removeItem(ADMIN_AUTH_PERSIST_KEY)
}

export function isAuthenticated(): boolean {
  return !!getAccessToken()
}

export function saveAdminUser(user: unknown): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user))
}

export function getAdminUser(): unknown | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(ADMIN_USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function parseJwt(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1]
    if (!base64) return null
    const normalized = base64.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
    const decoded = atob(padded)
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

export function isTokenExpired(token: string, skewMs = 0): boolean {
  const payload = parseJwt(token)
  if (!payload || !payload.exp) return true
  return Date.now() + skewMs >= (payload.exp as number) * 1000
}

/** JWT `sub` (user id), or null if the token is unreadable. */
export function getTokenSubject(token: string | null | undefined): string | null {
  if (!token) return null
  const payload = parseJwt(token)
  return typeof payload?.sub === 'string' ? payload.sub : null
}

/** True when cached user id matches the access-token subject. */
export function isUserBoundToToken(
  user: { id?: string } | null | undefined,
  token: string | null | undefined,
): boolean {
  if (!user?.id || !token) return false
  const sub = getTokenSubject(token)
  return !!sub && user.id === sub
}
