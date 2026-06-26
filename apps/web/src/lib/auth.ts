/**
 * Auth utilities — token management and user session
 */
import {
  AUTH_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  clearAuthTokens,
  getAuthToken,
  setAuthTokens,
} from './http';

export { AUTH_TOKEN_KEY, getAuthToken as getAccessToken, setAuthTokens, clearAuthTokens };

export function setAccessToken(token: string) {
  setAuthTokens(token);
}

export function removeAccessToken() {
  clearAuthTokens();
}

export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

export async function setRefreshTokenCookie(refreshToken: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
  try {
    await fetch('/api-bridge/set-cookie', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
  } catch (e) {
    console.error('Failed to set refresh token cookie', e);
  }
}

export function logout() {
  clearAuthTokens();
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}
