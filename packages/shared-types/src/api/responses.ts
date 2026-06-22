/**
 * API Response DTOs — TIK TAK RUN Shared Types
 * این فایل فقط type تعریف دارد — هیچ logic ندارد
 */

import type { User, Profile, Wallet, UserBadge } from '../models/user';
import type { GameCard, GameDetail } from '../models/game';
import type { Booking, BookingDetail, Payment, GameReview } from '../models/booking';
import type { Transaction } from '../models/wallet';
import type { AvatarItem, WheelSpinResult, UserLevelInfo, MonthlyWinner } from '../models/gamification';
import type { TeamDetail, ChatRoom, ChatMessage } from '../models/chat';
import type { Notification } from '../models/notification';
import type { Ticket } from '../models/ticket';
import type { Campaign, CustomerSegment, PipelineBoard } from '../models/crm';
import type { DiscountValidationResult } from '../models/discount';
import type { City, Branch } from '../models/branch';
import type { Setting } from '../models/setting';
import type { PaginatedResponse } from '../utils/pagination';

// ─── Auth Responses ──────────────────────────────────────────

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUserPayload;
}

export interface AuthUserPayload {
  id: number;
  mobile: string;
  fullName?: string;
  avatarUrl?: string;
  roles: string[];
  levelId: number;
  levelTier: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  expiresIn: number;
}

// ─── User Responses ──────────────────────────────────────────

export interface UserMeResponse {
  user: User;
  profile: Profile;
  wallet: Wallet;
  levelInfo: UserLevelInfo;
  badges: UserBadge[];
  recentNotifications: Notification[];
}

export interface PublicProfileResponse {
  id: number;
  fullName?: string;
  nickname?: string;
  avatarUrl?: string;
  levelId: number;
  levelName: string;
  levelTier: string;
  xp: number;
  totalBookings: number;
  badges: UserBadge[];
}

// ─── Game Responses ──────────────────────────────────────────

export type GameListResponse = PaginatedResponse<GameCard>;

export interface GameDetailResponse extends GameDetail {
  relatedGames: GameCard[];
  isBookmarked: boolean;
}

export interface FeaturedGamesResponse {
  featured: GameCard[];
  horror: GameCard[];
  nonHorror: GameCard[];
  topRated: GameCard[];
}

// ─── Booking Responses ───────────────────────────────────────

export type BookingListResponse = PaginatedResponse<Booking>;

export interface BookingDetailResponse extends BookingDetail {
  payment?: Payment;
  review?: GameReview;
}

export interface CreateBookingResponse {
  booking: Booking;
  payment?: Payment;
  /** برای redirect به zarinpal */
  zarinpalUrl?: string;
}

// ─── Wallet Responses ────────────────────────────────────────

export interface WalletResponse {
  wallet: Wallet;
  transactions: PaginatedResponse<Transaction>;
}

export interface ChargeWalletResponse {
  /** برای redirect به zarinpal */
  zarinpalUrl?: string;
  authority?: string;
  walletId: number;
  /** BigInt → string */
  amount: string;
}

export interface PaymentVerifyResponse {
  success: boolean;
  refId?: string;
  /** BigInt → string */
  amount: string;
  newBalance?: string;
}

// ─── Wheel Responses ──────────────────────────────────────────

export type WheelSpinResponse = WheelSpinResult;

// ─── Gamification Responses ───────────────────────────────────

export interface LeaderboardEntry {
  rank: number;
  userId: number;
  fullName?: string;
  nickname?: string;
  avatarUrl?: string;
  levelId: number;
  levelTier: string;
  xp: number;
  totalBookings: number;
}

export type LeaderboardResponse = LeaderboardEntry[];

export type AvatarShopResponse = {
  byType: {
    hats: AvatarItem[];
    glasses: AvatarItem[];
    skins: AvatarItem[];
    effects: AvatarItem[];
    backgrounds: AvatarItem[];
  };
  userItems: number[];
};

// ─── Team Responses ───────────────────────────────────────────

export type TeamListResponse = PaginatedResponse<TeamDetail>;

export interface JoinTeamResponse {
  team: TeamDetail;
  success: boolean;
  message: string;
}

// ─── Chat Responses ───────────────────────────────────────────

export interface ChatRoomResponse {
  room: ChatRoom;
  messages: PaginatedResponse<ChatMessage>;
  totalParticipants: number;
}

// ─── Discount Responses ───────────────────────────────────────

export type ValidateDiscountResponse = DiscountValidationResult;

// ─── Admin: Dashboard ─────────────────────────────────────────

export interface DashboardStatsResponse {
  totalUsers: number;
  activeUsers: number;
  totalBookings: number;
  completedBookings: number;
  /** BigInt → string (تومان) */
  totalRevenue: string;
  monthlyRevenue: string;
  newUsersToday: number;
  bookingsToday: number;
  popularGames: GameCard[];
  recentBookings: Booking[];
  userGrowth: ChartDataPoint[];
  revenueChart: ChartDataPoint[];
}

export interface ChartDataPoint {
  label: string;
  value: number | string;
  date?: string;
}

// ─── Admin: CRM Responses ─────────────────────────────────────

export type CampaignListResponse = PaginatedResponse<Campaign>;

export type SegmentListResponse = CustomerSegment[];

export type PipelineBoardResponse = PipelineBoard;

// ─── Admin: User Management ───────────────────────────────────

export type AdminUserListResponse = PaginatedResponse<User & { profile: Profile; wallet: Wallet }>;

export interface AdminUserDetailResponse {
  user: User;
  profile: Profile;
  wallet: Wallet;
  bookings: PaginatedResponse<Booking>;
  transactions: PaginatedResponse<Transaction>;
  badges: UserBadge[];
  notes: string[];
}

// ─── Notification Responses ───────────────────────────────────

export interface NotificationsResponse {
  notifications: PaginatedResponse<Notification>;
  unreadCount: number;
}

// ─── Ticket Responses ─────────────────────────────────────────

export type TicketListResponse = PaginatedResponse<Ticket>;

// ─── City/Branch Responses ────────────────────────────────────

export interface CitiesWithBranchesResponse {
  cities: Array<City & { branches: Branch[] }>;
}

// ─── Settings Responses ───────────────────────────────────────

export type SettingsResponse = Setting[];

// ─── Monthly Winners ──────────────────────────────────────────

export interface MonthlyWinnersResponse {
  topPlayer?: MonthlyWinner;
  topTeam?: MonthlyWinner;
  topGame?: MonthlyWinner;
  history: MonthlyWinner[];
}

// ─── Invite Responses ────────────────────────────────────────

export interface InviteInfoResponse {
  code: string;
  totalUses: number;
  totalRewardXp: number;
  shareUrl: string;
}
