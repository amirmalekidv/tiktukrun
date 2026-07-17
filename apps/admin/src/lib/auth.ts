// =============================================
// TIK TAK RUN Admin — Auth Token Management
// =============================================

const ACCESS_TOKEN_KEY = 'ttr_admin_access_token'
const REFRESH_TOKEN_KEY = 'ttr_admin_refresh_token'
const ADMIN_USER_KEY = 'ttr_admin_user'

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
