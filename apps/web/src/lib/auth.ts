/**
 * Auth utilities — token management and user session
 */

const ACCESS_TOKEN_KEY = 'tiktakrun_access_token'

export function getAccessToken(): string | null {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function setAccessToken(token: string) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(ACCESS_TOKEN_KEY, token)
}

export function removeAccessToken() {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(ACCESS_TOKEN_KEY)
}

export function isAuthenticated(): boolean {
  return !!getAccessToken()
}

export async function setRefreshTokenCookie(refreshToken: string) {
  try {
    await fetch('/api-bridge/set-cookie', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
  } catch (e) {
    console.error('Failed to set refresh token cookie', e)
  }
}

export function logout() {
  removeAccessToken()
  if (typeof window !== 'undefined') {
    window.location.href = '/login'
  }
}
