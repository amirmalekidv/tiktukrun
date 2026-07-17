/**
 * API Client — wraps axios with auth & error handling.
 * Connected directly to the real TIK TAK RUN backend (no mock mode).
 */
import axios, { AxiosError } from 'axios'
import { AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY, getApiV1, getApiRoot, refreshAccessToken } from './http'
import {
  buildGamesQueryParams,
  normalizeGame,
  normalizeGameList,
  parsePaginatedGames,
  resolveMediaUrl,
} from './games'
import type {
  Game,
  LandingSection,
  LandingBanner,
  City,
  Availability,
  DiscountValidation,
  BookingPreview,
  Booking,
  Review,
  LeaderboardEntry,
  SiteStats,
  PaginatedResponse,
  GamesFilter,
  OtpRequestResponse,
  OtpVerifyResponse,
  GameComment,
  GameLikeStatus,
} from '@/types'

const httpClient = axios.create({
  baseURL: getApiV1(),
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

httpClient.interceptors.request.use((config) => {
  if (typeof localStorage !== 'undefined') {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

httpClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      try {
        const accessToken = await refreshAccessToken()
        if (error.config && accessToken) {
          error.config.headers = error.config.headers ?? {}
          error.config.headers.Authorization = `Bearer ${accessToken}`
          return httpClient(error.config)
        }
      } catch {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(AUTH_TOKEN_KEY)
          localStorage.removeItem(REFRESH_TOKEN_KEY)
        }
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
      }
    }
    const msg = getApiErrorMessage(error)
    throw new Error(msg)
  }
)

function getApiErrorMessage(error: AxiosError): string {
  const data = error.response?.data as Record<string, unknown> | undefined
  if (!data) return error.message

  const nested = data.error as { message?: string } | undefined
  if (nested?.message) return nested.message

  const top = data.message
  if (typeof top === 'string') return top
  if (Array.isArray(top) && typeof top[0] === 'string') return top[0]

  return error.message
}

export { httpClient }

function normalizeReview(raw: any): Review {
  const user = raw?.user ?? {}
  const game = raw?.game ?? {}

  return {
    id: String(raw?.id ?? ''),
    user: {
      id: String(user?.id ?? ''),
      name: user?.name ?? user?.fullName ?? user?.nickname ?? undefined,
      avatar: user?.avatar ?? user?.avatarUrl ?? undefined,
    },
    game: {
      id: String(game?.id ?? raw?.gameId ?? ''),
      title: String(game?.title ?? ''),
    },
    rating: Number(raw?.rating ?? 0),
    comment: String(raw?.comment ?? raw?.text ?? ''),
    helpful: Number(raw?.helpful ?? raw?.helpfulCount ?? 0),
    createdAt: String(raw?.createdAt ?? ''),
    isVerified: Boolean(raw?.isVerified ?? raw?.bookingId),
  }
}

// ==================== AUTH ====================
export async function requestOtp(mobile: string, inviteCode?: string): Promise<OtpRequestResponse> {
  const { data } = await httpClient.post('/auth/otp/request', { mobile, inviteCode })
  const payload = data.data ?? data
  return {
    success: data.success ?? true,
    message: data.message ?? 'کد تأیید ارسال شد',
    expiresIn: payload.expiresIn ?? payload.expiresInSeconds ?? 120,
  }
}

export async function verifyOtp(mobile: string, code: string): Promise<OtpVerifyResponse> {
  const { data } = await httpClient.post('/auth/otp/verify', { mobile, code })
  return data.data ?? data
}

export async function getCurrentUser() {
  const { data } = await httpClient.get('/auth/me')
  return data.data ?? data
}

export async function refreshToken() {
  const { data } = await httpClient.post('/auth/refresh', {}, { withCredentials: true })
  return data
}

// ==================== CITIES ====================
export async function getCities(): Promise<City[]> {
  const { data } = await httpClient.get('/cities')
  return data.data
}

// ==================== GAMES ====================
export async function getGames(filter: GamesFilter = {}): Promise<PaginatedResponse<Game>> {
  const { data } = await httpClient.get('/games', { params: buildGamesQueryParams(filter) })
  return parsePaginatedGames(data)
}

export async function getGameBySlug(slug: string): Promise<Game | null> {
  const { data } = await httpClient.get(`/games/${slug}`)
  const raw = data.data ?? data
  return raw ? normalizeGame(raw as Record<string, unknown>) : null
}

export async function getFeaturedGames(): Promise<Game[]> {
  const { data } = await httpClient.get('/games', {
    params: { featured: true, limit: 9, sortBy: 'popular' },
  })
  return normalizeGameList(data.data ?? data)
}

export async function getGamesBySection(section: string): Promise<Game[]> {
  const { data } = await httpClient.get(`/games/by-section/${section}`)
  return normalizeGameList(data.data ?? data)
}

export async function getLandingSections(): Promise<LandingSection[]> {
  const { data } = await httpClient.get('/landing-sections')
  const raw = data.data ?? data
  if (!Array.isArray(raw)) return []
  return raw.map((section) => ({
    ...section,
    games: normalizeGameList(section.games ?? []),
  }))
}

export async function getLandingSection(key: string): Promise<LandingSection | null> {
  try {
    const { data } = await httpClient.get(`/landing-sections/${key}`)
    const raw = data.data ?? data
    if (!raw) return null
    return {
      ...raw,
      games: normalizeGameList(raw.games ?? []),
    }
  } catch {
    return null
  }
}

export async function getLandingBanners(): Promise<LandingBanner[]> {
  const { data } = await httpClient.get('/landing-banners')
  const raw = data.data ?? data
  if (!Array.isArray(raw)) return []
  return raw
    .filter((banner) => banner?.imageUrl)
    .map((banner) => ({
      id: String(banner.id ?? ''),
      title: banner.title ?? null,
      altText: banner.altText ?? null,
      href: banner.href ?? null,
      imageUrl: resolveMediaUrl(banner.imageUrl) ?? '',
      displayOrder: Number(banner.displayOrder ?? 0),
      isActive: Boolean(banner.isActive ?? true),
    }))
}

// ==================== AVAILABILITY ====================
export async function getAvailability(gameId: string, date: string): Promise<Availability> {
  const { data } = await httpClient.get(`/games/availability/${gameId}`, { params: { date } })
  return data.data ?? data
}

// ==================== DISCOUNT ====================
export async function validateDiscountCode(
  code: string,
  gameId: string,
  players: number,
  slotDateTime: string
): Promise<DiscountValidation> {
  const { data } = await httpClient.post('/discounts/validate', {
    code,
    gameId,
    playersCount: players,
    slotDateTime,
  })
  return data.data
}

// ==================== BOOKING ====================
export async function bookingPreview(params: {
  gameId: string
  slotId?: string
  slotDateTime?: string
  players?: number
  playersCount?: number
  discountCode?: string
}): Promise<BookingPreview> {
  const payload = {
    gameId: params.gameId,
    slotDateTime: params.slotDateTime ?? params.slotId,
    playersCount: params.playersCount ?? params.players,
    discountCode: params.discountCode,
  }
  const { data } = await httpClient.post('/bookings/preview', payload)
  return data.data
}

export async function createBooking(params: {
  gameId: string
  slotId?: string
  slotDateTime?: string
  players?: number
  playersCount?: number
  teamName?: string
  discountCode?: string
  paymentMethod: string
}): Promise<{
  booking: Partial<Booking> & { id?: string; code?: string; status?: string; slotDateTime?: string }
  bookingId?: string
  code?: string
  status?: string
  paymentUrl?: string
  message?: string
  walletBalance?: number
}> {
  const payload = {
    gameId: params.gameId,
    slotDateTime: params.slotDateTime ?? params.slotId,
    playersCount: params.playersCount ?? params.players,
    teamName: params.teamName,
    discountCode: params.discountCode,
    paymentMethod: params.paymentMethod,
  }
  const { data } = await httpClient.post('/bookings', payload)
  const body = data.data ?? data
  return {
    ...body,
    message: data.message ?? body.message,
  }
}

export async function getBookingById(id: string): Promise<Booking> {
  const { data } = await httpClient.get(`/bookings/${id}`)
  return data.data
}

// ==================== REVIEWS ====================
export async function getReviews(gameId: string): Promise<Review[]> {
  const { data } = await httpClient.get(`/games/${gameId}/reviews`)
  const items = Array.isArray(data?.data) ? data.data : []
  return items.map(normalizeReview)
}

export async function getAllReviews(): Promise<Review[]> {
  try {
    const { data } = await httpClient.get('/reviews/public')
    const items = Array.isArray(data?.data) ? data.data : []
    return items.map(normalizeReview)
  } catch {
    return []
  }
}

export async function submitReview(bookingId: string, rating: number, comment: string) {
  const { data } = await httpClient.post(`/reviews/booking/${bookingId}`, { rating, text: comment })
  return data.data
}

export async function markReviewHelpful(reviewId: string) {
  const { data } = await httpClient.post(`/reviews/${reviewId}/helpful`)
  return data.data
}

// ==================== LIKES ====================
function normalizeLike(payload: any): GameLikeStatus {
  const p = payload?.data ?? payload ?? {}
  return {
    likesCount: p.likesCount ?? 0,
    likedByMe: Boolean(p.liked ?? p.likedByMe),
  }
}

export async function getGameLikeStatus(gameId: string): Promise<GameLikeStatus> {
  const isLoggedIn = typeof localStorage !== 'undefined' && !!localStorage.getItem(AUTH_TOKEN_KEY)
  // Authenticated users get likedByMe via /likes/me; anonymous users get public count only
  const url = isLoggedIn ? `/games/${gameId}/likes/me` : `/games/${gameId}/likes`
  const { data } = await httpClient.get(url)
  return normalizeLike(data)
}

export async function getMyGameLike(gameId: string): Promise<GameLikeStatus> {
  const { data } = await httpClient.get(`/games/${gameId}/likes/me`)
  return normalizeLike(data)
}

export async function toggleGameLike(gameId: string): Promise<GameLikeStatus> {
  const { data } = await httpClient.post(`/games/${gameId}/like`)
  return normalizeLike(data)
}

// ==================== COMMENTS ====================
function normalizeComment(c: any): GameComment {
  return {
    id: c.id,
    gameId: c.gameId,
    text: c.text,
    parentId: c.parentId ?? null,
    likesCount: c.likesCount ?? 0,
    likedByMe: Boolean(c.likedByMe),
    createdAt: c.createdAt,
    user: {
      id: c.user?.id ?? '',
      name: c.user?.name ?? c.user?.fullName ?? 'کاربر',
      avatar: c.user?.avatar ?? c.user?.avatarUrl ?? null,
    },
    replies: Array.isArray(c.replies) ? c.replies.map(normalizeComment) : [],
  }
}

export async function getGameComments(
  gameId: string,
  page = 1,
  limit = 20
): Promise<PaginatedResponse<GameComment>> {
  const { data } = await httpClient.get(`/games/${gameId}/comments`, { params: { page, limit } })
  // Backend (wrapped): { success, data: { data: comments, total, page, limit } }
  const payload = data?.data ?? data
  const list = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : []
  return {
    data: list.map(normalizeComment),
    total: payload?.total ?? list.length,
    page: payload?.page ?? page,
    limit: payload?.limit ?? limit,
    totalPages: payload?.totalPages ?? Math.max(1, Math.ceil((payload?.total ?? list.length) / limit)),
  }
}

export async function addGameComment(
  gameId: string,
  text: string,
  parentId?: string
): Promise<GameComment> {
  const { data } = await httpClient.post(`/games/${gameId}/comments`, { text, parentId })
  return normalizeComment(data?.data ?? data)
}

export async function toggleCommentLike(commentId: string): Promise<{ likesCount: number; likedByMe: boolean }> {
  const { data } = await httpClient.post(`/games/comments/${commentId}/like`)
  return data.data ?? data
}

export async function deleteGameComment(commentId: string): Promise<void> {
  await httpClient.delete(`/games/comments/${commentId}`)
}

// ==================== LEADERBOARD ====================
export async function getLeaderboard(period: 'WEEKLY' | 'MONTHLY' | 'ALL_TIME' = 'WEEKLY'): Promise<LeaderboardEntry[]> {
  try {
    // Map UI period names → API period names
    const apiPeriod = period === 'WEEKLY' ? 'week' : period === 'MONTHLY' ? 'month' : 'all'
    const { data } = await httpClient.get('/profile/leaderboard', {
      params: { type: 'xp', period: apiPeriod, limit: 10 },
    })
    const raw = Array.isArray(data?.data) ? data.data : []
    // Map flat API shape → frontend's nested shape
    return raw.map((row: any) => {
      const rawUser = row.user ?? {}
      return {
        rank: row.rank ?? 0,
        score: row.score ?? row.xp ?? 0,
        gamesPlayed: row.gamesPlayed ?? row.totalGames ?? 0,
        user: {
          ...rawUser,
          id: String(rawUser.id ?? row.userId ?? ''),
          name: rawUser.name ?? rawUser.nickname ?? rawUser.fullName ?? row.name ?? row.nickname ?? row.fullName ?? '',
          avatar: rawUser.avatar ?? rawUser.avatarUrl ?? row.avatarUrl ?? row.avatar ?? null,
        },
      }
    }) as LeaderboardEntry[]
  } catch {
    return []
  }
}

// ==================== STATS ====================
export async function getSiteStats(): Promise<SiteStats> {
  const fallback: SiteStats = {
    totalGames: 0,
    totalBookings: 0,
    successRate: 0,
    minAge: 0,
    maxAge: 99,
    citiesCount: 0,
  }
  try {
    const { data } = await httpClient.get('/settings/public')
    return { ...fallback, ...(data.data?.stats ?? {}) } as SiteStats
  } catch {
    return fallback
  }
}
