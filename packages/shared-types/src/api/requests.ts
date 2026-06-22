/**
 * API Request DTOs — TIK TAK RUN Shared Types
 * این فایل فقط type تعریف دارد — هیچ logic ندارد
 */

import type { UserRole, BookingStatus, PaymentMethod, TicketPriority, CampaignType, PipelineStage, DiscountType, GenreFilter, GameDifficulty } from '../enums';

// ─── Auth ───────────────────────────────────────────────────

export interface SendOtpRequest {
  mobile: string;
}

export interface VerifyOtpRequest {
  mobile: string;
  code: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// ─── User ───────────────────────────────────────────────────

export interface UpdateProfileRequest {
  fullName?: string;
  nickname?: string;
  bio?: string;
  instagramHandle?: string;
  telegramHandle?: string;
  birthDate?: string;
  gender?: string;
  address?: string;
  cityId?: number;
}

export interface UpdateAvatarConfigRequest {
  hatId?: number | null;
  glassesId?: number | null;
  skinId?: number | null;
  effectId?: number | null;
  backgroundId?: number | null;
}

export interface UpdateUserSettingsRequest {
  notifications?: {
    inapp?: boolean;
    sms?: boolean;
    email?: boolean;
  };
  language?: 'fa' | 'en';
  theme?: 'dark' | 'light';
}

export interface PurchaseAvatarItemRequest {
  itemId: number;
  currency: 'DIAMONDS';
}

// ─── Booking ────────────────────────────────────────────────

export interface CreateBookingRequest {
  gameId: number;
  slotDateTime: string;
  playersCount: number;
  paymentMethod: PaymentMethod;
  discountCode?: string;
  note?: string;
}

export interface UpdateBookingStatusRequest {
  status: BookingStatus;
  cancelReason?: string;
}

// ─── Payment ────────────────────────────────────────────────

export interface ChargeWalletRequest {
  /** مبلغ شارژ (تومان) — به صورت string برای BigInt */
  amount: string;
  method: PaymentMethod;
}

export interface VerifyPaymentRequest {
  authority: string;
  status: string;
}

// ─── Wheel ──────────────────────────────────────────────────

export interface SpinWheelRequest {
  currency: 'COINS' | 'DIAMONDS';
}

// ─── Discount ───────────────────────────────────────────────

export interface ValidateDiscountRequest {
  code: string;
  gameId: number;
  playersCount: number;
}

export interface CreateDiscountCodeRequest {
  code: string;
  name?: string;
  type: DiscountType;
  value: number;
  /** BigInt → string */
  minPurchase?: string;
  maxDiscount?: string;
  validFrom?: string;
  validUntil?: string;
  maxUses?: number;
  targetSegmentId?: number;
  gameIds?: number[];
}

// ─── Review ─────────────────────────────────────────────────

export interface CreateReviewRequest {
  bookingId: number;
  rating: number;
  text?: string;
}

// ─── Team ───────────────────────────────────────────────────

export interface CreateTeamRequest {
  name: string;
  gameId: number;
  branchId?: number;
  capacity: number;
  slotDateTime?: string;
  description?: string;
  isPublic?: boolean;
}

export interface JoinTeamRequest {
  teamId: number;
}

// ─── Ticket ─────────────────────────────────────────────────

export interface CreateTicketRequest {
  subject: string;
  body: string;
  priority?: TicketPriority;
  branchId?: number;
}

export interface ReplyTicketRequest {
  body: string;
  attachments?: string[];
}

// ─── Chat ───────────────────────────────────────────────────

export interface SendChatMessageRequest {
  roomId: number;
  text: string;
  parentMessageId?: number;
}

export interface ReportChatMessageRequest {
  messageId: number;
  reason: string;
}

// ─── Admin: Game ─────────────────────────────────────────────

export interface CreateGameRequest {
  slug: string;
  title: string;
  subtitle?: string;
  categoryId: number;
  branchId: number;
  description: string;
  scenario?: string;
  fearLevel?: number;
  difficulty?: GameDifficulty;
  minPlayers?: number;
  maxPlayers?: number;
  durationMinutes?: number;
  /** BigInt → string */
  pricePerPerson: string;
  siteRank?: number;
  teaserUrl?: string;
  coverImage?: string;
  tags?: string[];
  isFeatured?: boolean;
  weeklyDiscountPercent?: number;
}

export interface UpdateGameRequest extends Partial<CreateGameRequest> {
  isActive?: boolean;
}

// ─── Admin: User ─────────────────────────────────────────────

export interface AdminUpdateUserRequest {
  isActive?: boolean;
  isBanned?: boolean;
  isMuted?: boolean;
  mutedUntil?: string;
}

export interface AssignRoleRequest {
  userId: number;
  role: UserRole;
}

export interface AdjustWalletRequest {
  userId: number;
  currency: 'TOMAN' | 'COINS' | 'DIAMONDS';
  amount: string;
  reason: string;
}

// ─── Admin: Campaign ──────────────────────────────────────────

export interface CreateCampaignRequest {
  name: string;
  type: CampaignType;
  segmentId?: number;
  content: {
    subject?: string;
    body: string;
    templateId?: string;
    templateVars?: Record<string, unknown>;
  };
  scheduledAt?: string;
  /** BigInt → string */
  budget?: string;
}

// ─── Admin: Pipeline ──────────────────────────────────────────

export interface CreatePipelineDealRequest {
  name: string;
  customerId?: number;
  /** BigInt → string */
  value: string;
  stage?: PipelineStage;
  tag?: string;
  expectedCloseDate?: string;
  notes?: string;
}

export interface MovePipelineDealRequest {
  dealId: number;
  newStage: PipelineStage;
  newPosition: number;
}

// ─── Admin: Segment ───────────────────────────────────────────

export interface CreateSegmentRequest {
  name: string;
  conditions: {
    rules: Array<{
      field: string;
      op: string;
      value: unknown;
    }>;
  };
  color: string;
  icon: string;
}

// ─── Invite ───────────────────────────────────────────────────

export interface UseInviteCodeRequest {
  code: string;
}

// ─── Notification ─────────────────────────────────────────────

export interface MarkNotificationsReadRequest {
  notificationIds: number[];
}

// ─── Admin: Setting ───────────────────────────────────────────

export interface UpdateSettingRequest {
  key: string;
  value: unknown;
}

// ─── Admin: Branch ────────────────────────────────────────────

export interface CreateBranchRequest {
  name: string;
  cityId: number;
  address: string;
  phone?: string;
  lat?: number;
  lng?: number;
  managerId?: number;
}

// ─── Filters / Query Params ───────────────────────────────────

export interface GameFiltersQuery {
  categorySlug?: string;
  citySlug?: string;
  branchId?: number;
  genre?: GenreFilter;
  minPlayers?: number;
  maxFearLevel?: number;
  difficulty?: GameDifficulty;
  isFeatured?: boolean;
  search?: string;
  sortBy?: 'siteRank' | 'userRank' | 'price' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface BookingFiltersQuery {
  status?: BookingStatus;
  from?: string;
  to?: string;
  gameId?: number;
  branchId?: number;
  page?: number;
  limit?: number;
}

export interface UserFiltersQuery {
  role?: UserRole;
  isActive?: boolean;
  isBanned?: boolean;
  search?: string;
  levelId?: number;
  page?: number;
  limit?: number;
}
