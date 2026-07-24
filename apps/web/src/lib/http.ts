/**
 * Unified HTTP helpers for web app — single auth token + API base URL.
 */
export const AUTH_TOKEN_KEY = 'auth_token';
export const REFRESH_TOKEN_KEY = 'auth_refresh_token';

/** Host root without trailing /api/v1 */
export function getApiRoot(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  return raw.replace(/\/api\/v1\/?$/, '');
}

export function getApiV1(): string {
  return `${getApiRoot()}/api/v1`;
}

export function getWsRoot(): string {
  const raw = process.env.NEXT_PUBLIC_WS_URL || getApiRoot();
  return raw
    .replace(/\/api\/v1\/?$/, '')
    .replace(/\/socket\.io\/?$/, '')
    .replace(/\/chat\/?$/, '')
    .replace(/\/$/, '');
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthTokens(accessToken: string, refreshToken?: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export function clearAuthTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  // legacy keys cleanup
  localStorage.removeItem('accessToken');
  localStorage.removeItem('tiktakrun_access_token');
}

export function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function refreshAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  // Block refresh while logout is clearing the httpOnly cookie.
  if (sessionStorage.getItem('tiktakrun-logged-out') === '1') {
    return null;
  }

  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

  try {
    const res = await fetch('/api-bridge/refresh', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(refreshToken ? { refreshToken } : {}),
    });

    if (!res.ok) return null;

    const json = await res.json();
    const payload = json?.data ?? json;
    const accessToken = payload?.accessToken;

    if (!accessToken || typeof accessToken !== 'string') return null;

    setAuthTokens(accessToken, payload?.refreshToken);
    return accessToken;
  } catch {
    return null;
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  init?: RequestInit,
  retry = true,
): Promise<T> {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const url = path.startsWith('http') ? path : `${getApiV1()}${normalized}`;

  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...(init?.headers as Record<string, string> | undefined),
    },
  });

  if (res.status === 401 && retry && !normalized.startsWith('/auth/refresh')) {
    const hadSession =
      typeof window !== 'undefined' &&
      (!!localStorage.getItem(AUTH_TOKEN_KEY) || !!localStorage.getItem(REFRESH_TOKEN_KEY));
    const refreshedToken = await refreshAccessToken();

    if (refreshedToken) {
      return apiFetch<T>(path, init, false);
    }

    clearAuthTokens();
    // Only force navigation when an existing session failed to refresh.
    // Anonymous 401s (e.g. optional chat) must not open the login page.
    if (hadSession && typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || `خطا: ${res.status}`);
  }

  const json = await res.json();
  if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
    return json.data as T;
  }
  return json as T;
}

export const USE_MOCK =
  process.env.NEXT_PUBLIC_USE_MOCK === 'true';
