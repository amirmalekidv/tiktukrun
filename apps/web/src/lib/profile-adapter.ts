// Mirrors apps/api/src/modules/users/leveling.service.ts LEVEL_XP_TABLE
const LEVEL_XP_THRESHOLDS = [
  0, 100, 250, 500, 900, 1400, 2100, 3000, 4200, 5700,
  7500, 9800, 12500, 15800, 19800, 24600, 30400, 37200, 45200, 54600,
] as const;
const MAX_LEVEL = LEVEL_XP_THRESHOLDS.length;

const LEVEL_TITLE_RANGES = [
  { min: 1, max: 2, title: 'تازه‌نفس' },
  { min: 3, max: 4, title: 'ردیاب سایه' },
  { min: 5, max: 7, title: 'شکارچی کابوس' },
  { min: 8, max: 11, title: 'فاتح هزارتو' },
  { min: 12, max: 15, title: 'سالار تاریکی' },
  { min: 16, max: MAX_LEVEL, title: 'افسانه قلمرو' },
] as const;

export function getLevelFromXp(xp: number): number {
  const safeXp = Math.max(0, Number.isFinite(xp) ? xp : 0);

  for (let i = LEVEL_XP_THRESHOLDS.length - 1; i >= 0; i -= 1) {
    if (safeXp >= LEVEL_XP_THRESHOLDS[i]) return i + 1;
  }

  return 1;
}

export function getLevelXpBounds(level: number): { levelStartXp: number; levelEndXp: number } {
  const safeLevel = Math.min(Math.max(1, level), MAX_LEVEL);
  const levelStartXp = LEVEL_XP_THRESHOLDS[safeLevel - 1] ?? 0;
  const levelEndXp =
    safeLevel >= MAX_LEVEL
      ? LEVEL_XP_THRESHOLDS[MAX_LEVEL - 1]
      : LEVEL_XP_THRESHOLDS[safeLevel] ?? levelStartXp + 100;
  return { levelStartXp, levelEndXp };
}

export function getLevelTitle(level: number): string {
  const safeLevel = Math.min(Math.max(1, level), MAX_LEVEL);
  return LEVEL_TITLE_RANGES.find((range) => safeLevel >= range.min && safeLevel <= range.max)?.title ?? 'شجاع قلمرو';
}

export function getXpProgressMeta(xp: number) {
  const level = getLevelFromXp(xp);
  const { levelStartXp, levelEndXp } = getLevelXpBounds(level);
  const range = Math.max(1, levelEndXp - levelStartXp);
  const currentXp = Math.max(0, xp);
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round(((currentXp - levelStartXp) / range) * 100)),
  );

  return {
    level,
    title: getLevelTitle(level),
    levelStartXp,
    levelEndXp,
    progressPercent,
    xpToNextLevel: Math.max(0, levelEndXp - currentXp),
  };
}

export interface ProfileViewModel {
  name: string;
  nickname?: string;
  avatar?: string | null;
  level: number;
  title?: string;
  city?: string;
  joinedAt?: string;
  currentXp: number;
  levelStartXp: number;
  levelEndXp: number;
}

export interface StatsViewModel {
  totalXp: number;
  survivedRooms: number;
  badgesCount: number;
  bookingsCount: number;
}

export interface BadgeViewModel {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earnedAt?: string;
}

interface BadgeCollections {
  earned: BadgeViewModel[];
  available: BadgeViewModel[];
}

function asRecord(value: unknown): Record<string, any> | null {
  return value && typeof value === 'object' ? (value as Record<string, any>) : null;
}

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function formatPersianDate(value: unknown, mode: 'date' | 'yearMonth' = 'date'): string | undefined {
  const text = toText(value);
  if (!text) return undefined;

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return undefined;

  return mode === 'yearMonth'
    ? new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long' }).format(date)
    : new Intl.DateTimeFormat('fa-IR').format(date);
}

function extractCity(raw: Record<string, any> | null, profile: Record<string, any> | null): string | undefined {
  const candidates = [
    profile?.city?.name,
    profile?.cityName,
    raw?.city?.name,
    raw?.cityName,
    raw?.city,
  ];

  for (const value of candidates) {
    const text = toText(value);
    if (text) return text;
  }

  return undefined;
}

function mapBadgeRarity(rawBadge: Record<string, any> | null): BadgeViewModel['rarity'] {
  const value = toText(rawBadge?.rarity)?.toLowerCase();
  if (value === 'rare' || value === 'epic' || value === 'legendary') return value;
  return 'common';
}

function normalizeBadge(rawBadge: unknown, earnedAt?: unknown): BadgeViewModel | null {
  const badgeRecord = asRecord(asRecord(rawBadge)?.badge ?? rawBadge);
  if (!badgeRecord) return null;

  return {
    id: String(badgeRecord.id ?? badgeRecord.code ?? badgeRecord.name ?? 'badge'),
    name: toText(badgeRecord.name) ?? 'نشان',
    description: toText(badgeRecord.description) ?? '',
    icon: toText(badgeRecord.icon) ?? 'fa-medal',
    rarity: mapBadgeRarity(badgeRecord),
    earnedAt: formatPersianDate(earnedAt ?? badgeRecord.earnedAt ?? badgeRecord.awardedAt),
  };
}

export function normalizeProfilePayload(raw: unknown, statsRaw?: unknown): ProfileViewModel | null {
  const record = asRecord(raw);
  if (!record) return null;

  const profile = asRecord(record.profile);
  const stats = asRecord(statsRaw);

  const name =
    toText(record.fullName) ??
    toText(record.name) ??
    toText(record.nickname);

  if (!name) return null;

  const level = toNumber(stats?.currentLevel ?? record.level ?? profile?.levelId, 1) || 1;
  const currentXp = toNumber(stats?.currentXp ?? record.currentXp ?? profile?.xp, 0);
  const { levelStartXp, levelEndXp } = getLevelXpBounds(level);

  return {
    name,
    nickname: toText(record.nickname),
    avatar: toText(record.avatarUrl) ?? toText(record.avatar) ?? null,
    level,
    title: toText(record.title) ?? getLevelTitle(level),
    city: extractCity(record, profile),
    joinedAt: formatPersianDate(record.createdAt, 'yearMonth'),
    currentXp,
    levelStartXp,
    levelEndXp,
  };
}

export function normalizeProfileStats(raw: unknown, badgesCount = 0): StatsViewModel {
  const record = asRecord(raw);

  return {
    totalXp: toNumber(record?.totalXp ?? record?.currentXp, 0),
    survivedRooms: toNumber(record?.survivedRooms ?? record?.successfulBookings, 0),
    badgesCount: toNumber(record?.badgesCount, badgesCount),
    bookingsCount: toNumber(record?.bookingsCount ?? record?.totalBookings, 0),
  };
}

export function normalizeBadgeCollections(raw: unknown): BadgeCollections {
  const record = asRecord(raw);
  const earnedRaw = Array.isArray(record?.earned) ? record.earned : [];
  const allRaw = Array.isArray(record?.all) ? record.all : [];

  const earned = earnedRaw
    .map((badge) => normalizeBadge(badge, asRecord(badge)?.awardedAt ?? asRecord(badge)?.earnedAt))
    .filter((badge): badge is BadgeViewModel => badge !== null);

  const available = allRaw
    .filter((badge) => !asRecord(badge)?.isEarned)
    .map((badge) => normalizeBadge(badge))
    .filter((badge): badge is BadgeViewModel => badge !== null);

  return { earned, available };
}

export function normalizePublicProfilePayload(raw: unknown) {
  const record = asRecord(raw);
  if (!record) return null;

  const profile = normalizeProfilePayload(record, {
    currentXp: asRecord(record.profile)?.xp,
    currentLevel: asRecord(record.profile)?.levelId,
  });

  if (!profile) return null;

  const badges = Array.isArray(record.badges)
    ? record.badges
        .map((badge) => normalizeBadge(badge))
        .filter((badge): badge is BadgeViewModel => badge !== null)
    : [];

  return {
    ...profile,
    totalXp: toNumber(asRecord(record.profile)?.xp, profile.currentXp),
    survivedRooms: toNumber(record.successfulBookings ?? record.totalBookings, 0),
    badges,
  };
}
