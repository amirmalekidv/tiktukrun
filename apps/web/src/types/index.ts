// ================== SHARED TYPES ==================

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT' | 'VERY_HARD' | 'LEGENDARY'
export type GameTier = 'STANDARD' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND'
export type Genre = 'HORROR' | 'ADVENTURE' | 'MYSTERY' | 'SCI_FI' | 'FANTASY' | 'ACTION'
export type GameCategory = 'ESCAPE_ROOM' | 'CINEMA_HORROR' | 'BOARD_GAME' | 'LASER_TAG' | 'MAFIA' | 'VR' | 'PAINTBALL'
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'EXPIRED'
export type PaymentMethod = 'WALLET' | 'ZARINPAL' | 'CASH'
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'

export interface User {
  id: string
  mobile: string
  name?: string
  avatar?: string
  walletBalance: number
  xp: number
  rank: number
  totalBookings: number
  successRate: number
  inviteCode: string
  createdAt: string
}

export interface City {
  id: string
  name: string
  slug: string
  province?: string
}

export interface Branch {
  id: string
  name: string
  address: string
  city: City
  lat?: number
  lng?: number
  phone?: string
  instagram?: string
  mapUrl?: string
}

export interface GameImage {
  id: string
  url: string
  alt?: string
  isPrimary: boolean
}

export interface Game {
  id: string
  title: string
  slug: string
  subtitle?: string
  description: string
  scenario?: string
  category: GameCategory
  genre: Genre
  difficulty: Difficulty
  fearLevel: number // 1-5
  minPlayers: number
  maxPlayers: number
  duration: number // minutes
  basePrice: number // Toman
  pricePerPlayer?: number
  coverImage?: string
  images: GameImage[]
  teaserUrl?: string
  branch: Branch
  rating: number
  totalReviews: number
  successRate: number
  isActive: boolean
  hasAgeLimit: boolean
  ageLimit?: number
  warningText?: string
  sections?: string[]
  tags?: string[]
  tier?: GameTier
  likesCount?: number
  commentsCount?: number
  likedByMe?: boolean
  createdAt: string
}

export interface GameComment {
  id: string
  gameId: string
  text: string
  parentId?: string | null
  likesCount: number
  likedByMe?: boolean
  createdAt: string
  user: {
    id: string
    name: string
    avatar?: string | null
  }
  replies?: GameComment[]
}

export interface GameLikeStatus {
  likesCount: number
  likedByMe: boolean
}

export interface TimeSlot {
  id: string
  slotDateTime?: string
  startTime: string // ISO
  endTime: string
  availableCapacity: number
  totalCapacity: number
  price: number
  isAvailable: boolean
}

export interface Availability {
  date: string
  slots: TimeSlot[]
}

export interface DiscountCode {
  id: string
  code: string
  discountType: 'PERCENT' | 'FIXED'
  discountValue: number
  maxUse?: number
  usedCount: number
  minPlayers?: number
  expiresAt?: string
}

export interface DiscountValidation {
  valid: boolean
  code?: DiscountCode
  discountAmount: number
  message?: string
}

export interface BookingPreview {
  gameId: string
  slotId: string
  players: number
  baseAmount: number
  discountAmount: number
  finalAmount: number
  discountCode?: string
}

export interface Booking {
  id: string
  game: Game
  slot: TimeSlot
  players: number
  status: BookingStatus
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  baseAmount: number
  discountAmount: number
  finalAmount: number
  paymentUrl?: string
  discountCode?: string
  review?: Review
  createdAt: string
}

export interface Review {
  id: string
  user: {
    id: string
    name?: string
    avatar?: string
  }
  game: {
    id: string
    title: string
  }
  rating: number // 1-5
  comment: string
  helpful: number
  createdAt: string
  isVerified: boolean
}

export interface LeaderboardEntry {
  rank: number
  user: User
  score: number
  gamesPlayed: number
  period: 'WEEKLY' | 'MONTHLY' | 'ALL_TIME'
}

export interface SiteStats {
  totalGames: number
  totalBookings: number
  successRate: number
  minAge: number
  maxAge: number
  citiesCount: number
}

export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface GamesFilter {
  cityId?: string
  categoryId?: string
  category?: GameCategory
  genre?: Genre
  fearMin?: number
  fearMax?: number
  minPlayers?: number
  maxPlayers?: number
  priceMin?: number
  priceMax?: number
  q?: string
  page?: number
  limit?: number
  sortBy?: 'rating' | 'price' | 'newest' | 'popularity'
  sections?: string
}

export interface OtpRequestResponse {
  success: boolean
  message: string
  expiresIn: number // seconds
}

export interface OtpVerifyResponse {
  success: boolean
  accessToken: string
  refreshToken: string
  user: User
  isNewUser: boolean
}

export const DIFFICULTY_FA: Record<Difficulty, string> = {
  EASY: 'آسان',
  MEDIUM: 'متوسط',
  HARD: 'سخت',
  EXPERT: 'حرفه‌ای',
  VERY_HARD: 'بسیار سخت',
  LEGENDARY: 'افسانه‌ای',
}

export const TIER_FA: Record<GameTier, string> = {
  STANDARD: 'استاندارد',
  SILVER: 'نقره‌ای',
  GOLD: 'طلایی',
  PLATINUM: 'پلاتینیوم',
  DIAMOND: 'دایموند',
}

export const TIER_STYLE: Record<GameTier, { label: string; color: string; bg: string; icon: string }> = {
  STANDARD: { label: 'استاندارد', color: '#94a3b8', bg: 'rgba(148,163,184,0.15)', icon: '🎮' },
  SILVER:   { label: 'نقره‌ای',   color: '#cbd5e1', bg: 'rgba(203,213,225,0.15)', icon: '🥈' },
  GOLD:     { label: 'طلایی',     color: '#fbbf24', bg: 'rgba(251,191,36,0.15)',  icon: '🥇' },
  PLATINUM: { label: 'پلاتینیوم', color: '#67e8f9', bg: 'rgba(103,232,249,0.15)', icon: '💠' },
  DIAMOND:  { label: 'دایموند',   color: '#a78bfa', bg: 'rgba(167,139,250,0.18)', icon: '💎' },
}

export const CATEGORY_FA: Record<GameCategory, string> = {
  ESCAPE_ROOM: 'اتاق فرار',
  CINEMA_HORROR: 'سینمای ترس',
  BOARD_GAME: 'بردگیم',
  LASER_TAG: 'لیزرتگ',
  MAFIA: 'مافیا',
  VR: 'واقعیت مجازی',
  PAINTBALL: 'پینت‌بال',
}

export const CATEGORY_ICON: Record<GameCategory, string> = {
  ESCAPE_ROOM: '🗝️',
  CINEMA_HORROR: '🎬',
  BOARD_GAME: '🎲',
  LASER_TAG: '🔫',
  MAFIA: '🕵️',
  VR: '🥽',
  PAINTBALL: '🎯',
}

export const GENRE_FA: Record<Genre, string> = {
  HORROR: 'ترسناک',
  ADVENTURE: 'ماجراجویی',
  MYSTERY: 'معمایی',
  SCI_FI: 'علمی‌تخیلی',
  FANTASY: 'فانتزی',
  ACTION: 'اکشن',
}
