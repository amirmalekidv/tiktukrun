const IR_MOBILE_RE = /^09\d{9}$/;

function normalizeText(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

/** True when a string looks like an Iranian mobile number (privacy-sensitive). */
export function looksLikeMobile(value: string): boolean {
  return IR_MOBILE_RE.test(value.replace(/\s/g, ''));
}

export function maskMobileForDisplay(value?: string | null): string | undefined {
  const digits = value?.replace(/\s/g, '');
  if (!digits || !looksLikeMobile(digits)) return undefined;
  return `${digits.slice(0, 4)} ***${digits.slice(-4)}`;
}

export interface PublicNameUser {
  nickname?: string | null;
  fullName?: string | null;
  mobile?: string | null;
}

/**
 * Resolve a safe public display name for chat, leaderboards, and other social surfaces.
 * Never returns a raw mobile number.
 */
export function resolvePublicDisplayName(
  user?: PublicNameUser | null,
  fallback = 'کاربر',
): string {
  if (!user) return fallback;

  const nickname = normalizeText(user.nickname);
  if (nickname) return nickname;

  const fullName = normalizeText(user.fullName);
  if (fullName && !looksLikeMobile(fullName)) return fullName;

  const maskedMobile = maskMobileForDisplay(user.mobile);
  if (maskedMobile) return maskedMobile;

  return fallback;
}
