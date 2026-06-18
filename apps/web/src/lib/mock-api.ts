/**
 * Mock API Layer — Toggle with NEXT_PUBLIC_USE_MOCK=true
 * Implements same interface as api.ts but returns demo data
 */
import type {
  Game,
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
} from '@/types'

import {
  MOCK_GAMES,
  MOCK_CITIES,
  MOCK_REVIEWS,
  MOCK_LEADERBOARD,
  MOCK_STATS,
  MOCK_SLOTS,
} from './mock-data'

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms))

// ==================== AUTH ====================
export async function mockRequestOtp(mobile: string, inviteCode?: string): Promise<OtpRequestResponse> {
  await delay(800)
  if (!mobile.match(/^09\d{9}$/)) {
    throw new Error('شماره موبایل نامعتبر است')
  }
  return { success: true, message: 'کد تأیید ارسال شد', expiresIn: 120 }
}

export async function mockVerifyOtp(mobile: string, code: string): Promise<OtpVerifyResponse> {
  await delay(600)
  if (code !== '123456') {
    throw new Error('کد تأیید نامعتبر یا منقضی شده است')
  }
  return {
    success: true,
    accessToken: 'mock-access-token-' + Date.now(),
    refreshToken: 'mock-refresh-token-' + Date.now(),
    user: {
      id: 'mock-user-1',
      mobile,
      name: 'کاربر تست',
      avatar: 'https://picsum.photos/seed/mockuser/80/80',
      walletBalance: 2500000,
      xp: 3400,
      rank: 42,
      totalBookings: 12,
      successRate: 67,
      inviteCode: 'TTR-MOCK',
      createdAt: new Date().toISOString(),
    },
    isNewUser: false,
  }
}

export async function mockGetCurrentUser() {
  await delay(200)
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null
  if (!token) return null
  return {
    id: 'mock-user-1',
    mobile: '09123456789',
    name: 'کاربر تست',
    avatar: 'https://picsum.photos/seed/mockuser/80/80',
    walletBalance: 2500000,
    xp: 3400,
    rank: 42,
    totalBookings: 12,
    successRate: 67,
    inviteCode: 'TTR-MOCK',
    createdAt: new Date().toISOString(),
  }
}

// ==================== CITIES ====================
export async function mockGetCities(): Promise<City[]> {
  await delay(200)
  return MOCK_CITIES
}

// ==================== GAMES ====================
export async function mockGetGames(filter: GamesFilter = {}): Promise<PaginatedResponse<Game>> {
  await delay(500)
  let games = [...MOCK_GAMES]

  if (filter.category) {
    games = games.filter((g) => g.category === filter.category)
  }
  if (filter.cityId) {
    games = games.filter((g) => g.branch.city.id === filter.cityId)
  }
  if (filter.genre) {
    games = games.filter((g) => g.genre === filter.genre)
  }
  if (filter.fearMin !== undefined) {
    games = games.filter((g) => g.fearLevel >= filter.fearMin!)
  }
  if (filter.fearMax !== undefined) {
    games = games.filter((g) => g.fearLevel <= filter.fearMax!)
  }
  if (filter.q) {
    const q = filter.q.toLowerCase()
    games = games.filter(
      (g) =>
        g.title.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q) ||
        g.tags?.some((t) => t.toLowerCase().includes(q))
    )
  }
  if (filter.sections) {
    games = games.filter((g) => g.sections?.includes(filter.sections!))
  }

  if (filter.sortBy === 'rating') {
    games.sort((a, b) => b.rating - a.rating)
  } else if (filter.sortBy === 'price') {
    games.sort((a, b) => a.basePrice - b.basePrice)
  } else if (filter.sortBy === 'popularity') {
    games.sort((a, b) => b.totalReviews - a.totalReviews)
  }

  const page = filter.page || 1
  const limit = filter.limit || 9
  const start = (page - 1) * limit
  const paginatedGames = games.slice(start, start + limit)

  return {
    data: paginatedGames,
    total: games.length,
    page,
    limit,
    totalPages: Math.ceil(games.length / limit),
  }
}

export async function mockGetGameBySlug(slug: string): Promise<Game | null> {
  await delay(400)
  return MOCK_GAMES.find((g) => g.slug === slug) || null
}

export async function mockGetFeaturedGames(): Promise<Game[]> {
  await delay(300)
  return MOCK_GAMES.filter((g) => g.sections?.includes('featured')).slice(0, 9)
}

export async function mockGetGamesBySection(section: string): Promise<Game[]> {
  await delay(300)
  return MOCK_GAMES.filter((g) => g.sections?.includes(section))
}

// ==================== AVAILABILITY ====================
export async function mockGetAvailability(gameId: string, date: string): Promise<Availability> {
  await delay(400)
  return {
    date,
    slots: MOCK_SLOTS,
  }
}

// ==================== DISCOUNT ====================
export async function mockValidateDiscountCode(
  code: string,
  gameId: string,
  players: number,
  slotId: string
): Promise<DiscountValidation> {
  await delay(500)
  if (code === 'TAKTIK20') {
    return {
      valid: true,
      code: {
        id: 'dc1',
        code: 'TAKTIK20',
        discountType: 'PERCENT',
        discountValue: 20,
        usedCount: 100,
      },
      discountAmount: Math.round(890000 * 0.2),
      message: '۲۰٪ تخفیف اعمال شد',
    }
  }
  if (code === 'TIKTAK50') {
    return {
      valid: true,
      code: {
        id: 'dc2',
        code: 'TIKTAK50',
        discountType: 'FIXED',
        discountValue: 50000,
        usedCount: 45,
      },
      discountAmount: 50000,
      message: '۵۰,۰۰۰ تومان تخفیف اعمال شد',
    }
  }
  return { valid: false, discountAmount: 0, message: 'کد تخفیف نامعتبر است' }
}

// ==================== BOOKING ====================
export async function mockBookingPreview(params: {
  gameId: string
  slotId: string
  players: number
  discountCode?: string
}): Promise<BookingPreview> {
  await delay(400)
  const game = MOCK_GAMES.find((g) => g.id === params.gameId)
  const baseAmount = (game?.basePrice || 890000) + params.players * (game?.pricePerPlayer || 0)
  const discountAmount = params.discountCode === 'TAKTIK20' ? Math.round(baseAmount * 0.2) : 0
  return {
    gameId: params.gameId,
    slotId: params.slotId,
    players: params.players,
    baseAmount,
    discountAmount,
    finalAmount: baseAmount - discountAmount,
    discountCode: params.discountCode,
  }
}

export async function mockCreateBooking(params: {
  gameId: string
  slotId: string
  players: number
  discountCode?: string
  paymentMethod: string
}): Promise<{ booking: Partial<Booking>; paymentUrl?: string }> {
  await delay(800)
  const game = MOCK_GAMES.find((g) => g.id === params.gameId)
  if (params.paymentMethod === 'ZARINPAL') {
    return {
      booking: { id: 'bk-' + Date.now() },
      paymentUrl: 'https://www.zarinpal.com/pg/StartPay/mock-authority',
    }
  }
  return {
    booking: {
      id: 'bk-' + Date.now(),
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      game: game as Game,
      players: params.players,
      finalAmount: game?.basePrice || 890000,
    },
  }
}

// ==================== REVIEWS ====================
export async function mockGetReviews(gameId: string): Promise<Review[]> {
  await delay(300)
  return MOCK_REVIEWS.filter((r) => r.game.id === gameId)
}

export async function mockGetAllReviews(): Promise<Review[]> {
  await delay(300)
  return MOCK_REVIEWS
}

// ==================== LEADERBOARD ====================
export async function mockGetLeaderboard(period: 'WEEKLY' | 'MONTHLY' | 'ALL_TIME' = 'WEEKLY'): Promise<LeaderboardEntry[]> {
  await delay(300)
  return MOCK_LEADERBOARD.map((e) => ({ ...e, period }))
}

// ==================== STATS ====================
export async function mockGetSiteStats(): Promise<SiteStats> {
  await delay(200)
  return MOCK_STATS
}
