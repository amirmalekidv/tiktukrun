/**
 * Auth utilities — token management and user session
 */
import {
  AUTH_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  clearAuthTokens,
  getAuthToken,
  refreshAccessToken as refreshAccessTokenRequest,
  setAuthTokens,
} from './http';

export {
  AUTH_TOKEN_KEY,
  getAuthToken as getAccessToken,
  setAuthTokens,
  clearAuthTokens,
};

/** Prevents AuthBootstrap from restoring a session while logout cookie clear is in flight. */
const LOGGED_OUT_FLAG = 'tiktakrun-logged-out';

export function setAccessToken(token: string) {
  setAuthTokens(token);
}

export function removeAccessToken() {
  clearAuthTokens();
}

export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

export function markLoggedOut(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(LOGGED_OUT_FLAG, '1');
  }
}

export function clearLoggedOutFlag(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(LOGGED_OUT_FLAG);
  }
}

export function isLoggedOutFlagSet(): boolean {
  return typeof window !== 'undefined' && sessionStorage.getItem(LOGGED_OUT_FLAG) === '1';
}

/** Refresh access token — blocked while a logout is in progress. */
export async function refreshAccessToken(): Promise<string | null> {
  if (isLoggedOutFlagSet()) return null;
  return refreshAccessTokenRequest();
}

export async function setRefreshTokenCookie(refreshToken: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
  clearLoggedOutFlag();
  try {
    await fetch('/api-bridge/set-cookie', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
  } catch (e) {
    console.error('Failed to set refresh token cookie', e);
  }
}

export async function clearRefreshTokenCookie() {
  try {
    await fetch('/api-bridge/set-cookie', {
      method: 'DELETE',
      credentials: 'include',
    });
    clearLoggedOutFlag();
  } catch (e) {
    console.error('Failed to clear refresh token cookie', e);
  }
}

/** Clears local tokens, httpOnly refresh cookie, and chat socket. */
export async function clearSession() {
  markLoggedOut();
  clearAuthTokens();
  try {
    const { disconnectSocket } = await import('./socket');
    disconnectSocket();
  } catch {
    // socket unavailable (SSR / early boot)
  }
  await clearRefreshTokenCookie();
}

export function logout() {
  void clearSession().finally(() => {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  });
}
