import { getApiRoot } from './http'
import type { Game, GameCategory, GameImage, Genre, PaginatedResponse, GamesFilter } from '@/types'

/** Local fallback — avoids unconfigured remote hosts in next/image */
export const GAME_COVER_PLACEHOLDER = '/placeholder-game.svg'

export function shouldBypassImageOptimization(src?: string | null): boolean {
  if (!src) return false
  if (src.toLowerCase().includes('/uploads/')) return true
  return src.startsWith('/') && src.toLowerCase().endsWith('.svg')
}

const CATEGORY_SLUG_TO_ENUM: Record<string, GameCategory> = {
  'cinema-horror': 'CINEMA_HORROR',
  'board-games': 'BOARD_GAME',
  'board-game': 'BOARD_GAME',
  mafia: 'MAFIA',
  lasertag: 'LASER_TAG',
  'laser-tag': 'LASER_TAG',
  vr: 'VR',
  'escape-room': 'ESCAPE_ROOM',
  paintball: 'PAINTBALL',
}

const CATEGORY_ENUM_TO_SLUG: Record<GameCategory, string> = {
  CINEMA_HORROR: 'cinema-horror',
  BOARD_GAME: 'board-games',
  MAFIA: 'mafia',
  LASER_TAG: 'lasertag',
  VR: 'vr',
  ESCAPE_ROOM: 'escape-room',
  PAINTBALL: 'paintball',
}

export function resolveMediaUrl(path?: string | null): string | undefined {
  if (!path) return undefined
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const root = getApiRoot()
  return `${root}${path.startsWith('/') ? path : `/${path}`}`
}

function mapImages(raw: unknown): GameImage[] {
  if (!Array.isArray(raw)) return []
  return raw.map((img, i) => ({
    id: String((img as { id?: string }).id ?? i),
    url: resolveMediaUrl((img as { url?: string }).url) ?? '',
    alt: (img as { alt?: string }).alt,
    isPrimary: i === 0,
  }))
}

function putCoverFirst(coverImage: string | undefined, images: GameImage[], title: string): GameImage[] {
  if (!coverImage) return images

  const existingCover = images.find((img) => img.url === coverImage)
  const cover = existingCover
    ? { ...existingCover, alt: existingCover.alt || title, isPrimary: true }
    : { id: 'cover', url: coverImage, alt: title, isPrimary: true }

  return [
    cover,
    ...images
      .filter((img) => img.url !== coverImage)
      .map((img) => ({ ...img, isPrimary: false })),
  ]
}

function toOptionalNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined
  const num = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(num) ? num : undefined
}

function normalizeBranch(rawBranch: unknown, branchId: unknown): Game['branch'] {
  const branch = (rawBranch && typeof rawBranch === 'object' ? rawBranch : {}) as Record<string, unknown>
  const city = (branch.city && typeof branch.city === 'object' ? branch.city : {}) as Record<string, unknown>

  return {
    id: String(branch.id ?? branchId ?? ''),
    name: String(branch.name ?? ''),
    address: String(branch.address ?? ''),
    phone: branch.phone ? String(branch.phone) : undefined,
    lat: toOptionalNumber(branch.lat),
    lng: toOptionalNumber(branch.lng),
    city: {
      id: String(city.id ?? ''),
      name: String(city.name ?? ''),
      slug: String(city.slug ?? ''),
    },
  }
}

/** Map API game document → web Game type expected by UI components. */
export function normalizeGame(raw: Record<string, unknown>): Game {
  const categoryObj = raw.category as { slug?: string } | undefined
  const categorySlug = categoryObj?.slug ?? ''
  const branch = normalizeBranch(raw.branch, raw.branchId)
  const title = String(raw.title ?? '')
  const coverImage = resolveMediaUrl(raw.coverImage as string | undefined)
  const images = mapImages(raw.images)

  return {
    id: String(raw.id),
    title,
    slug: String(raw.slug ?? ''),
    subtitle: raw.subtitle as string | undefined,
    description: String(raw.description ?? ''),
    scenario: raw.scenario as string | undefined,
    category: CATEGORY_SLUG_TO_ENUM[categorySlug] ?? 'ESCAPE_ROOM',
    genre: (raw.genre as Genre) ?? 'HORROR',
    difficulty: (raw.difficulty as Game['difficulty']) ?? 'MEDIUM',
    fearLevel: Number(raw.fearLevel ?? 3),
    minPlayers: Number(raw.minPlayers ?? 2),
    maxPlayers: Number(raw.maxPlayers ?? 6),
    duration: Number(raw.durationMinutes ?? raw.duration ?? 60),
    basePrice: Number(raw.pricePerPerson ?? raw.basePrice ?? 0),
    pricePerPlayer: Number(raw.pricePerPerson ?? raw.pricePerPlayer ?? 0),
    coverImage,
    images: putCoverFirst(coverImage, images, title),
    teaserUrl: resolveMediaUrl(raw.teaserUrl as string | undefined),
    branch,
    rating: Number(raw.siteRank ?? raw.userRankCached ?? raw.rating ?? 0),
    totalReviews: Number(raw.totalReviews ?? 0),
    successRate: Number(raw.successRate ?? 0),
    isActive: Boolean(raw.isActive ?? true),
    hasAgeLimit: Boolean(raw.hasAgeLimit ?? false),
    ageLimit: raw.ageLimit as number | undefined,
    warningText: raw.warningText as string | undefined,
    sections: raw.sections as string[] | undefined,
    tags: (raw.tags as string[]) ?? [],
    tier: raw.tier as Game['tier'],
    likesCount: Number(raw.likesCount ?? 0),
    commentsCount: Number(raw.commentsCount ?? 0),
    likedByMe: raw.likedByMe as boolean | undefined,
    availableSlots: raw.availableSlots == null ? undefined : Number(raw.availableSlots),
    createdAt: String(raw.createdAt ?? ''),
  }
}

export function buildGamesQueryParams(filter: GamesFilter = {}): Record<string, unknown> {
  const params: Record<string, unknown> = { ...filter }

  if (filter.category) {
    params.categorySlug = CATEGORY_ENUM_TO_SLUG[filter.category]
    delete params.category
  }

  if (filter.sortBy === 'rating') params.sortBy = 'rating'
  else if (filter.sortBy === 'price') params.sortBy = 'price-asc'
  else if (filter.sortBy === 'newest') params.sortBy = 'newest'
  else if (filter.sortBy === 'popularity') params.sortBy = 'popular'

  if (filter.fearMin !== undefined) {
    params.minFear = filter.fearMin
    delete params.fearMin
  }
  if (filter.fearMax !== undefined) {
    params.maxFear = filter.fearMax
    delete params.fearMax
  }
  if (filter.priceMin !== undefined) {
    params.minPrice = filter.priceMin
    delete params.priceMin
  }
  if (filter.priceMax !== undefined) {
    params.maxPrice = filter.priceMax
    delete params.priceMax
  }

  return params
}

export function parsePaginatedGames(body: {
  data?: unknown[]
  meta?: { total?: number; page?: number; limit?: number; totalPages?: number }
}): PaginatedResponse<Game> {
  const items = Array.isArray(body?.data) ? body.data.map((g) => normalizeGame(g as Record<string, unknown>)) : []
  const meta = body?.meta ?? {}
  return {
    data: items,
    total: meta.total ?? items.length,
    page: meta.page ?? 1,
    limit: meta.limit ?? items.length,
    totalPages: meta.totalPages ?? 1,
  }
}

export function normalizeGameList(raw: unknown): Game[] {
  if (Array.isArray(raw)) {
    return raw.map((g) => normalizeGame(g as Record<string, unknown>))
  }
  if (raw && typeof raw === 'object') {
    return [normalizeGame(raw as Record<string, unknown>)]
  }
  return []
}
