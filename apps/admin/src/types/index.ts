// =============================================
// TIK TAK RUN Admin — Shared Types
// =============================================

export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'BRANCH_MANAGER' | 'SUPPORT' | 'MARKETING' | 'CUSTOMER'

export interface AdminUser {
  id: string
  name: string
  email: string
  mobile: string
  avatar?: string
  roles: AdminRole[]
  permissions: string[]
  branch?: string
  branchIds?: string[]
  lastLoginAt?: string
  createdAt: string
}

export type CustomerTier = 'VIP' | 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE' | 'AT_RISK' | 'NEWCOMER'
export type CustomerStatus = 'ACTIVE' | 'INACTIVE' | 'BANNED' | 'SUSPENDED'
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'PLAYING' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
export type TransactionStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'CANCELLED'
export type CampaignStatus = 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED'
export type CampaignType = 'SMS' | 'EMAIL' | 'IN_APP' | 'PUSH'
export type PipelineStage = 'LEAD' | 'CONTACTED' | 'PROPOSED' | 'NEGOTIATING' | 'CLOSED_WON' | 'CLOSED_LOST'

export interface Customer {
  id: string
  name: string
  mobile: string
  email?: string
  avatar?: string
  tier: CustomerTier
  status: CustomerStatus
  level: number
  xp: number
  xpForNextLevel: number
  ltv: number
  totalBookings: number
  avgRating: number
  lastActiveAt: string
  registeredAt: string
  city?: string
  tags?: string[]
  segment?: string[]
  walletBalance: number
  coins: number
  referredBy?: string
  totalReferrals: number
}

export interface Booking {
  id: string
  customerId: string
  customerName: string
  gameId: string
  gameName: string
  branchName: string
  status: BookingStatus
  scheduledAt: string
  participants: number
  teamName?: string
  totalAmount: number
  paidAmount: number
  createdAt: string
}

export interface Transaction {
  id: string
  customerId: string
  type: 'CHARGE' | 'DEBIT' | 'REFUND' | 'REWARD' | 'GIFT'
  amount: number
  currency: 'TOMAN' | 'COINS' | 'XP'
  description: string
  status: TransactionStatus
  createdAt: string
  reference?: string
}

export interface Review {
  id: string
  customerId: string
  customerName: string
  gameId: string
  gameName: string
  rating: number
  comment: string
  isApproved: boolean
  isHidden: boolean
  createdAt: string
}

export interface AdminNote {
  id: string
  customerId: string
  adminId: string
  adminName: string
  content: string
  createdAt: string
  updatedAt: string
}

export interface ActivityItem {
  id: string
  type: 'BOOKING' | 'PAYMENT' | 'REVIEW' | 'LOGIN' | 'CAMPAIGN' | 'DEAL' | 'SUPPORT' | 'BADGE' | 'LEVEL_UP'
  title: string
  description: string
  customerId?: string
  customerName?: string
  customerAvatar?: string
  data?: Record<string, unknown>
  createdAt: string
  icon?: string
  color?: string
}

export interface Segment {
  id: string
  name: string
  description?: string
  color: string
  icon: string
  count: number
  growthPercent: number
  rules: SegmentRule[]
  logic: 'AND' | 'OR'
  isSystem: boolean
  createdAt: string
  updatedAt: string
}

export interface SegmentRule {
  id: string
  field: string
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in' | 'not_in'
  value: string | number | string[]
}

export interface Deal {
  id: string
  title: string
  customerId: string
  customerName: string
  customerAvatar?: string
  value: number
  stage: PipelineStage
  tag?: string
  tagColor?: string
  expectedCloseDate: string
  assignedTo?: string
  description?: string
  position: number
  createdAt: string
  updatedAt: string
}

export interface Campaign {
  id: string
  name: string
  type: CampaignType
  status: CampaignStatus
  segmentId?: string
  segmentName?: string
  targetCount: number
  sentCount: number
  openedCount: number
  clickedCount: number
  convertedCount: number
  budget?: number
  content: CampaignContent
  scheduledAt?: string
  startedAt?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

export interface CampaignContent {
  subject?: string
  body: string
  senderName?: string
  link?: string
  imageUrl?: string
  variables?: string[]
}

export interface KpiData {
  label: string
  value: string | number
  rawValue: number
  change: number
  changeType: 'increase' | 'decrease' | 'neutral'
  target?: number
  targetPercent?: number
  icon: string
  color: string
  trend: number[]
}

export interface OverviewData {
  kpis: {
    monthlyRevenue: KpiData
    newCustomers: KpiData
    activeBookings: KpiData
    conversionRate: KpiData
  }
  revenueChart: { date: string; revenue: number; bookings: number }[]
  categoryStats: { name: string; count: number; revenue: number; color: string }[]
  acquisitionSources: { source: string; count: number; percent: number }[]
  topCustomers: Customer[]
  recentBookings: Booking[]
  financialKpis: {
    cac: number
    clv: number
    churnRate: number
    nps: number
  }
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  meta?: {
    total?: number
    page?: number
    limit?: number
    totalPages?: number
  }
}

export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface CustomerFilterParams extends PaginationParams {
  tier?: CustomerTier
  status?: CustomerStatus
  segment?: string
  minLevel?: number
  maxLevel?: number
  minLtv?: number
  maxLtv?: number
  city?: string
}

export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  isRead: boolean
  createdAt: string
  link?: string
}
