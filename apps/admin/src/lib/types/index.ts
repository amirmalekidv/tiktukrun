/**
 * TIK TAK RUN — Shared Types
 * تایپ‌های مشترک کل پروژه
 */

// ==================== User ====================
export interface User {
  id: string;
  mobile: string;
  name: string;
  nickname?: string;
  email?: string;
  avatar?: string;
  level: number;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'LEGEND';
  xp: number;
  coins: number;
  diamonds: number;
  roles: Role[];
  isActive: boolean;
  isVip: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

// ==================== Role & Permission ====================
export interface Role {
  id: string;
  name: string;
  label: string;
  permissions: string[];
  isSystem: boolean;
  usersCount?: number;
}

export interface Permission {
  id: string;
  name: string;
  label: string;
  group: string;
}

// ==================== Booking ====================
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
export type PaymentMethod = 'WALLET' | 'ZARINPAL' | 'CASH' | 'MIXED';

export interface Booking {
  id: string;
  code: string;
  userId: string;
  user?: User;
  gameId: string;
  game?: Game;
  branchId: string;
  branch?: Branch;
  slotId: string;
  slotDate: string;
  slotTime: string;
  playersCount: number;
  teamName?: string;
  amount: string;
  discountAmount?: string;
  finalAmount: string;
  paymentMethod: PaymentMethod;
  paymentRef?: string;
  status: BookingStatus;
  notes?: string;
  rating?: number;
  createdAt: string;
  updatedAt: string;
  timeline?: BookingEvent[];
}

export interface BookingEvent {
  id: string;
  type: string;
  description: string;
  actorId?: string;
  actor?: User;
  createdAt: string;
  meta?: Record<string, unknown>;
}

// ==================== Game ====================
export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
export type GameTier = 'STANDARD' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND';

export const GAME_TIER_FA: Record<GameTier, string> = {
  STANDARD: 'استاندارد',
  SILVER: 'نقره‌ای',
  GOLD: 'طلایی',
  PLATINUM: 'پلاتینیوم',
  DIAMOND: 'دایموند',
};

export const GAME_TIER_STYLE: Record<GameTier, string> = {
  STANDARD: 'bg-slate-500/20 text-slate-300',
  SILVER: 'bg-gray-300/20 text-gray-200',
  GOLD: 'bg-yellow-500/20 text-yellow-300',
  PLATINUM: 'bg-cyan-400/20 text-cyan-200',
  DIAMOND: 'bg-purple-500/20 text-purple-300',
};

export interface GameImageAsset {
  id: string;
  url: string;
  displayOrder: number;
  caption?: string;
}

export interface Game {
  id: string;
  title: string;
  subtitle?: string;
  slug: string;
  categoryId: string;
  category?: Category;
  branchId: string;
  branch?: Branch;
  description?: string;
  scenario?: string;
  fearLevel: number;
  difficulty: DifficultyLevel;
  tier?: GameTier;
  likesCount?: number;
  commentsCount?: number;
  minPlayers: number;
  maxPlayers: number;
  duration: number;
  pricePerPerson: string;
  weeklyDiscountPercent?: number;
  siteRank?: number;
  tags: string[];
  coverImage?: string;
  images: GameImageAsset[];
  teaserUrl?: string;
  isActive: boolean;
  isFeatured: boolean;
  rating?: number;
  totalBookings?: number;
  totalRevenue?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== Branch ====================
export interface Branch {
  id: string;
  name: string;
  cityId: string;
  city?: City;
  address: string;
  phone?: string;
  email?: string;
  lat?: number;
  lng?: number;
  isActive: boolean;
  games?: Game[];
  createdAt: string;
}

// ==================== City & Category ====================
export interface City {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  branchesCount?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  isActive: boolean;
  gamesCount?: number;
}

export type LandingSectionFilterType =
  | 'WEEKLY_DISCOUNT'
  | 'FEATURED'
  | 'CATEGORY'
  | 'CATEGORY_CITY'
  | 'MULTI_CATEGORY'
  | 'POPULAR_THIS_WEEK'
  | 'MANUAL';

export interface LandingSection {
  id: string;
  key: string;
  title: string;
  description?: string;
  icon: string;
  displayOrder: number;
  isActive: boolean;
  filterType: LandingSectionFilterType;
  categorySlug?: string;
  categorySlugs?: string[];
  citySlug?: string;
  tagFilter?: string;
  manualGames?: { gameId: string; displayOrder: number; game?: { id: string; title: string; slug: string } }[];
}

export interface LandingBanner {
  id: string;
  title?: string | null;
  altText?: string | null;
  href?: string | null;
  imageUrl: string;
  displayOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ==================== Review ====================
export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Review {
  id: string;
  userId: string;
  user?: User;
  gameId: string;
  game?: Game;
  bookingId?: string;
  rating: number;
  comment: string;
  status: ReviewStatus;
  adminNote?: string;
  createdAt: string;
}

// ==================== Chat ====================
export type ChatMessageStatus = 'NORMAL' | 'REPORTED' | 'HIDDEN' | 'DELETED';
export type ChatRoomType = 'GLOBAL' | 'TEAM' | 'PRIVATE';

export interface ChatMessage {
  id: string;
  userId: string;
  user?: User;
  roomType: ChatRoomType;
  roomId?: string;
  content: string;
  status: ChatMessageStatus;
  reportsCount: number;
  createdAt: string;
}

// ==================== Ticket ====================
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_USER' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Ticket {
  id: string;
  code: string;
  userId: string;
  user?: User;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  assigneeId?: string;
  assignee?: User;
  tags: string[];
  messages?: TicketMessage[];
  createdAt: string;
  updatedAt: string;
  lastReplyAt?: string;
  resolvedAt?: string;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  sender?: User;
  content: string;
  isInternal: boolean;
  attachments?: string[];
  createdAt: string;
}

// ==================== Transaction ====================
export type TransactionCurrency = 'toman' | 'coins' | 'diamonds' | 'xp';
export type TransactionType =
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'BOOKING_PAYMENT'
  | 'BOOKING_REFUND'
  | 'WHEEL_SPIN'
  | 'REWARD'
  | 'BONUS'
  | 'TRANSFER'
  | 'PURCHASE';

export interface Transaction {
  id: string;
  userId: string;
  user?: User;
  type: TransactionType;
  currency: TransactionCurrency;
  amount: string;
  balanceBefore?: string;
  balanceAfter?: string;
  description?: string;
  refId?: string;
  meta?: Record<string, unknown>;
  createdAt: string;
}

export interface Payment {
  id: string;
  userId: string;
  user?: User;
  bookingId?: string;
  booking?: Booking;
  amount: string;
  gateway: string;
  refId?: string;
  trackId?: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  createdAt: string;
}

// ==================== Gamification ====================
export interface WheelPrize {
  id: string;
  name: string;
  type: 'COINS' | 'DIAMONDS' | 'XP' | 'BADGE' | 'DISCOUNT' | 'NOTHING';
  value: number;
  probabilityWeight: number;
  color: string;
  icon?: string;
  isActive: boolean;
  wonCount?: number;
}

export interface WheelSpin {
  id: string;
  userId: string;
  user?: User;
  prizeId: string;
  prize?: WheelPrize;
  paidWith: 'coins' | 'diamonds';
  paidAmount: number;
  createdAt: string;
}

export interface Badge {
  id: string;
  code: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  criteria: Record<string, unknown>;
  totalAwarded: number;
  isActive: boolean;
}

export interface Level {
  id: number;
  name: string;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'LEGEND';
  requiredXp: number;
  perks: Record<string, unknown>;
}

export interface AvatarItem {
  id: string;
  code: string;
  name: string;
  thumbnail: string;
  type: 'HAT' | 'GLASSES' | 'SKIN' | 'EFFECT' | 'BACKGROUND';
  requiredLevel: number;
  priceDiamonds: number;
  isDefault: boolean;
  isActive: boolean;
}

// ==================== Discount ====================
export type DiscountType = 'PERCENT' | 'FIXED';
export type DiscountSegment = 'ALL' | 'VIP' | 'NEW' | 'RETURNING' | 'SPECIFIC';

export interface DiscountCode {
  id: string;
  code: string;
  type: DiscountType;
  value: number;
  minPurchase?: string;
  maxDiscount?: string;
  validFrom?: string;
  validUntil?: string;
  usedCount: number;
  maxUses?: number;
  targetSegment: DiscountSegment;
  isActive: boolean;
  createdAt: string;
}

export interface AutoDiscount {
  id: string;
  name: string;
  trigger: 'VIP' | 'WEEKLY' | 'FIRST_BOOKING' | 'BIRTHDAY' | 'INVITE';
  type: DiscountType;
  value: number;
  conditions: Record<string, unknown>;
  isActive: boolean;
  matchingUsersCount?: number;
}

// ==================== Monthly Winners ====================
export interface MonthlyWinner {
  id: string;
  year: number;
  month: number;
  type: 'TOP_PLAYER' | 'TOP_TEAM' | 'TOP_GAME' | 'RAFFLE_WINNER';
  winnerId: string;
  winner?: User | Game;
  prize: string;
  distributedAt?: string;
}

// ==================== Settings ====================
export interface Setting {
  id: string;
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'json' | 'bigint';
  group: string;
  label: string;
  description?: string;
}

// ==================== Audit ====================
export interface AuditLog {
  id: string;
  actorId: string;
  actor?: User;
  action: string;
  entity: string;
  entityId: string;
  ipAddress?: string;
  userAgent?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  meta?: Record<string, unknown>;
  createdAt: string;
}

// ==================== Staff ====================
export interface StaffMember extends User {
  lastLoginAt?: string;
  invitedBy?: string;
}

// ==================== Backup ====================
export interface Backup {
  id: string;
  filename: string;
  size: string;
  type: 'FULL' | 'DB' | 'FILES';
  createdAt: string;
  downloadUrl?: string;
}

// ==================== API Response ====================
export interface ApiResponse<T> {
  data: T;
  message?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

// ==================== Dashboard Stats ====================
export interface DashboardStats {
  todayBookings: number;
  todayRevenue: string;
  weeklyBookings: number;
  weeklyRevenue: string;
  monthlyBookings: number;
  monthlyRevenue: string;
  activeUsers: number;
  pendingTickets: number;
  reportedMessages: number;
}
