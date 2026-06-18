// =============================================
// TIK TAK RUN Admin — Mock API Layer
// Toggle with NEXT_PUBLIC_USE_MOCK=true
// =============================================

import type {
  Customer, Booking, Transaction, Review, AdminNote,
  ActivityItem, Segment, Deal, Campaign, OverviewData,
  CustomerTier, CustomerStatus, PipelineStage, CampaignStatus, CampaignType
} from '@/types'
import { sleep } from './utils'

const MOCK_DELAY = 400

// =============================================
// Mock Data Generators
// =============================================

const firstNames = ['محمد', 'علی', 'فاطمه', 'زهرا', 'رضا', 'سارا', 'حسین', 'نرگس', 'امیر', 'مریم', 'آرین', 'پریسا', 'سینا', 'نیلوفر', 'کیان']
const lastNames = ['رضایی', 'محمدی', 'حسینی', 'کریمی', 'صادقی', 'جعفری', 'علوی', 'مرادی', 'نجفی', 'شریفی', 'باقری', 'طاهری', 'موسوی', 'قاسمی', 'رحیمی']
const cities = ['تهران', 'اصفهان', 'مشهد', 'شیراز', 'تبریز', 'کرج', 'اهواز', 'قم']
const tiers: CustomerTier[] = ['VIP', 'PLATINUM', 'GOLD', 'SILVER', 'BRONZE', 'AT_RISK', 'NEWCOMER']
const statuses: CustomerStatus[] = ['ACTIVE', 'ACTIVE', 'ACTIVE', 'INACTIVE', 'BANNED']
const gameNames = ['اتاق فرار زیرزمین', 'سینما ترس قلعه', 'لیزرتگ', 'پینت‌بال', 'VR ترس', 'بردگیم نبرد', 'اتاق فرار بیمارستان', 'بازی گروهی']
const tagsList = [['علاقه‌مند به ترسناک', 'خانوادگی'], ['گیمر حرفه‌ای'], ['گروه دوستی'], ['رقابتی'], ['VIP بالقوه'], ['تولد'], ['گیمر مبتدی']]

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomDate(daysBack: number): string {
  const d = new Date()
  d.setDate(d.getDate() - randomInt(0, daysBack))
  return d.toISOString()
}

function generateMockCustomer(i: number): Customer {
  const firstName = randomChoice(firstNames)
  const lastName = randomChoice(lastNames)
  const tier = tiers[Math.min(i % 7, tiers.length - 1)]
  return {
    id: `cust_${String(i).padStart(4, '0')}`,
    name: `${firstName} ${lastName}`,
    mobile: `09${randomInt(10, 99)}${randomInt(1000000, 9999999)}`,
    email: `user${i}@example.com`,
    avatar: undefined,
    tier,
    status: randomChoice(statuses),
    level: randomInt(1, 50),
    xp: randomInt(100, 50000),
    xpForNextLevel: randomInt(500, 5000),
    ltv: randomInt(500000, 50000000),
    totalBookings: randomInt(1, 80),
    avgRating: parseFloat((randomInt(30, 50) / 10).toFixed(1)),
    lastActiveAt: randomDate(30),
    registeredAt: randomDate(365),
    city: randomChoice(cities),
    tags: randomChoice(tagsList),
    segment: [],
    walletBalance: randomInt(0, 5000000),
    coins: randomInt(0, 10000),
    referredBy: i > 5 ? `cust_${String(i - 3).padStart(4, '0')}` : undefined,
    totalReferrals: randomInt(0, 10),
  }
}

// Pre-generate mock customers
const MOCK_CUSTOMERS: Customer[] = Array.from({ length: 120 }, (_, i) => generateMockCustomer(i + 1))

// Fix first few for better demo
MOCK_CUSTOMERS[0] = { ...MOCK_CUSTOMERS[0], name: 'محمد رضایی', tier: 'VIP', ltv: 48500000, totalBookings: 76, level: 45 }
MOCK_CUSTOMERS[1] = { ...MOCK_CUSTOMERS[1], name: 'سارا احمدی', tier: 'PLATINUM', ltv: 32000000, totalBookings: 54, level: 38 }
MOCK_CUSTOMERS[2] = { ...MOCK_CUSTOMERS[2], name: 'علیرضا کریمی', tier: 'GOLD', ltv: 18500000, totalBookings: 32, level: 28 }
MOCK_CUSTOMERS[3] = { ...MOCK_CUSTOMERS[3], name: 'نرگس موسوی', tier: 'VIP', ltv: 41000000, totalBookings: 68, level: 42 }

const MOCK_SEGMENTS: Segment[] = [
  { id: 'seg_001', name: 'کاربران VIP', description: 'کاربران با LTV بالا', color: '#7c3aed', icon: 'fa-crown', count: 48, growthPercent: 12.5, rules: [{ id: 'r1', field: 'tier', operator: 'eq', value: 'VIP' }], logic: 'AND', isSystem: true, createdAt: randomDate(180), updatedAt: randomDate(7) },
  { id: 'seg_002', name: 'خطر ریزش', description: 'کاربران که مدت‌هاست رزرو نکرده‌اند', color: '#dc2626', icon: 'fa-triangle-exclamation', count: 156, growthPercent: -8.3, rules: [{ id: 'r1', field: 'lastActiveAt', operator: 'lt', value: 30 }], logic: 'AND', isSystem: true, createdAt: randomDate(180), updatedAt: randomDate(3) },
  { id: 'seg_003', name: 'تازه‌واردان', description: 'رجیستر ۳۰ روز اخیر', color: '#059669', icon: 'fa-user-plus', count: 234, growthPercent: 24.1, rules: [{ id: 'r1', field: 'registeredAt', operator: 'gte', value: 30 }], logic: 'AND', isSystem: true, createdAt: randomDate(180), updatedAt: randomDate(1) },
  { id: 'seg_004', name: 'طرفداران ترسناک', description: 'رزرو اتاق فرار یا VR ترس', color: '#f59e0b', icon: 'fa-ghost', count: 389, growthPercent: 18.7, rules: [{ id: 'r1', field: 'preferredCategory', operator: 'in', value: ['escape_room', 'vr_horror'] }], logic: 'OR', isSystem: false, createdAt: randomDate(90), updatedAt: randomDate(14) },
  { id: 'seg_005', name: 'گروه‌های بزرگ', description: 'رزرو با ۶+ نفر', color: '#0ea5e9', icon: 'fa-users', count: 127, growthPercent: 9.2, rules: [{ id: 'r1', field: 'avgGroupSize', operator: 'gte', value: 6 }], logic: 'AND', isSystem: false, createdAt: randomDate(60), updatedAt: randomDate(10) },
  { id: 'seg_006', name: 'مشتریان پرارزش', description: 'LTV بالای ۱۰ میلیون', color: '#d97706', icon: 'fa-gem', count: 92, growthPercent: 15.4, rules: [{ id: 'r1', field: 'ltv', operator: 'gte', value: 10000000 }], logic: 'AND', isSystem: true, createdAt: randomDate(180), updatedAt: randomDate(5) },
  { id: 'seg_007', name: 'کاربران موبایل', description: 'عمدتاً از اپ استفاده می‌کنند', color: '#6366f1', icon: 'fa-mobile-screen', count: 567, growthPercent: 31.8, rules: [{ id: 'r1', field: 'primaryDevice', operator: 'eq', value: 'mobile' }], logic: 'AND', isSystem: false, createdAt: randomDate(45), updatedAt: randomDate(2) },
  { id: 'seg_008', name: 'باز خریدکنندگان', description: 'رزرو ۳+ بار در ماه', color: '#ec4899', icon: 'fa-repeat', count: 213, growthPercent: 7.6, rules: [{ id: 'r1', field: 'monthlyBookings', operator: 'gte', value: 3 }], logic: 'AND', isSystem: false, createdAt: randomDate(30), updatedAt: randomDate(1) },
]

const pipelineStages: PipelineStage[] = ['LEAD', 'CONTACTED', 'PROPOSED', 'NEGOTIATING', 'CLOSED_WON', 'CLOSED_LOST']

const MOCK_DEALS: Deal[] = [
  { id: 'd001', title: 'پکیج تیم‌سازی شرکت آریا', customerId: 'cust_0001', customerName: 'محمد رضایی', value: 8500000, stage: 'PROPOSED', tag: 'تیم‌سازی', tagColor: '#7c3aed', expectedCloseDate: randomDate(-7), position: 0, createdAt: randomDate(15), updatedAt: randomDate(2) },
  { id: 'd002', title: 'رزرو تولد لوکس', customerId: 'cust_0002', customerName: 'سارا احمدی', value: 4200000, stage: 'LEAD', tag: 'تولد', tagColor: '#ec4899', expectedCloseDate: randomDate(-5), position: 0, createdAt: randomDate(10), updatedAt: randomDate(1) },
  { id: 'd003', title: 'پکیج ماهانه VIP', customerId: 'cust_0004', customerName: 'نرگس موسوی', value: 12000000, stage: 'NEGOTIATING', tag: 'VIP', tagColor: '#d97706', expectedCloseDate: randomDate(-3), position: 0, createdAt: randomDate(20), updatedAt: randomDate(3) },
  { id: 'd004', title: 'رزرو گروهی دانشگاه', customerId: 'cust_0010', customerName: 'امیر صادقی', value: 3500000, stage: 'CONTACTED', tag: 'گروه', tagColor: '#0ea5e9', expectedCloseDate: randomDate(-8), position: 0, createdAt: randomDate(8), updatedAt: randomDate(1) },
  { id: 'd005', title: 'پکیج سالیانه شرکتی', customerId: 'cust_0003', customerName: 'علیرضا کریمی', value: 48000000, stage: 'PROPOSED', tag: 'سالیانه', tagColor: '#059669', expectedCloseDate: randomDate(-14), position: 1, createdAt: randomDate(25), updatedAt: randomDate(4) },
  { id: 'd006', title: 'رزرو مراسم عروسی', customerId: 'cust_0015', customerName: 'زهرا حسینی', value: 15000000, stage: 'CLOSED_WON', tag: 'مراسم', tagColor: '#dc2626', expectedCloseDate: randomDate(5), position: 0, createdAt: randomDate(30), updatedAt: randomDate(0) },
  { id: 'd007', title: 'پکیج گردشگری', customerId: 'cust_0020', customerName: 'رضا باقری', value: 6500000, stage: 'LEAD', tag: 'گردشگری', tagColor: '#f59e0b', expectedCloseDate: randomDate(-6), position: 1, createdAt: randomDate(5), updatedAt: randomDate(1) },
  { id: 'd008', title: 'اشتراک سازمانی', customerId: 'cust_0008', customerName: 'پریسا جعفری', value: 24000000, stage: 'CONTACTED', tag: 'سازمانی', tagColor: '#7c3aed', expectedCloseDate: randomDate(-10), position: 1, createdAt: randomDate(12), updatedAt: randomDate(2) },
  { id: 'd009', title: 'رزرو مکرر ماهانه', customerId: 'cust_0025', customerName: 'کیان موسوی', value: 2800000, stage: 'CLOSED_LOST', tag: 'منظم', tagColor: '#6366f1', expectedCloseDate: randomDate(3), position: 0, createdAt: randomDate(20), updatedAt: randomDate(5) },
]

const campaignStatuses: CampaignStatus[] = ['DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'COMPLETED']
const campaignTypes: CampaignType[] = ['SMS', 'EMAIL', 'IN_APP', 'PUSH']

const MOCK_CAMPAIGNS: Campaign[] = [
  { id: 'camp_001', name: 'جشنواره پاییز', type: 'SMS', status: 'ACTIVE', segmentId: 'seg_001', segmentName: 'کاربران VIP', targetCount: 48, sentCount: 48, openedCount: 42, clickedCount: 35, convertedCount: 28, budget: 500000, content: { body: 'سلام {{name}} عزیز! جشنواره پاییزی TIK TAK RUN شروع شد. ۳۰٪ تخفیف با کد FALL30', variables: ['name'] }, scheduledAt: randomDate(2), startedAt: randomDate(1), createdAt: randomDate(5), updatedAt: randomDate(1) },
  { id: 'camp_002', name: 'برگردون کاربران از دست رفته', type: 'SMS', status: 'SCHEDULED', segmentId: 'seg_002', segmentName: 'خطر ریزش', targetCount: 156, sentCount: 0, openedCount: 0, clickedCount: 0, convertedCount: 0, budget: 1200000, content: { body: '{{name}} عزیز، دلمان برایت تنگ شده! ۴۰٪ تخفیف ویژه برای بازگشت شما' }, scheduledAt: randomDate(-2), createdAt: randomDate(8), updatedAt: randomDate(3) },
  { id: 'camp_003', name: 'خوش‌آمد گویی تازه‌واردان', type: 'IN_APP', status: 'ACTIVE', segmentId: 'seg_003', segmentName: 'تازه‌واردان', targetCount: 234, sentCount: 234, openedCount: 198, clickedCount: 145, convertedCount: 89, budget: 0, content: { body: 'به TIK TAK RUN خوش آمدید! اولین رزرو شما ۲۰٪ تخفیف دارد', link: '/bookings' }, startedAt: randomDate(10), createdAt: randomDate(15), updatedAt: randomDate(2) },
  { id: 'camp_004', name: 'پیشنهاد هالووین', type: 'PUSH', status: 'COMPLETED', segmentId: 'seg_004', segmentName: 'طرفداران ترسناک', targetCount: 389, sentCount: 389, openedCount: 312, clickedCount: 267, convertedCount: 156, budget: 800000, content: { body: 'شب هالووین رو با VR ترس و اتاق فرار جشن بگیر!' }, completedAt: randomDate(5), createdAt: randomDate(20), updatedAt: randomDate(5) },
  { id: 'camp_005', name: 'اطلاع‌رسانی بازی جدید', type: 'EMAIL', status: 'DRAFT', targetCount: 0, sentCount: 0, openedCount: 0, clickedCount: 0, convertedCount: 0, content: { subject: 'بازی جدید: پینت‌بال آرنا', body: 'با خوشحالی اعلام می‌کنیم که پینت‌بال آرنا به مجموعه ما اضافه شد!' }, createdAt: randomDate(2), updatedAt: randomDate(1) },
]

const activityTypes = ['BOOKING', 'PAYMENT', 'REVIEW', 'LOGIN', 'CAMPAIGN', 'DEAL', 'SUPPORT', 'BADGE', 'LEVEL_UP'] as const

function generateActivity(i: number): ActivityItem {
  const customer = MOCK_CUSTOMERS[randomInt(0, 20)]
  const typeIndex = i % activityTypes.length
  const type = activityTypes[typeIndex]
  
  const templates: Record<string, { title: string; description: string; icon: string; color: string }> = {
    BOOKING: { title: 'رزرو جدید', description: `${customer.name} رزرو ${randomChoice(gameNames)} را ثبت کرد`, icon: 'fa-calendar-check', color: 'emerald' },
    PAYMENT: { title: 'پرداخت موفق', description: `${customer.name} مبلغ ${randomInt(500, 5000)}،۰۰۰ تومان پرداخت کرد`, icon: 'fa-credit-card', color: 'sky' },
    REVIEW: { title: 'نظر جدید', description: `${customer.name} برای ${randomChoice(gameNames)} نظر ثبت کرد`, icon: 'fa-star', color: 'amber' },
    LOGIN: { title: 'ورود به سیستم', description: `${customer.name} وارد سیستم شد`, icon: 'fa-right-to-bracket', color: 'slate' },
    CAMPAIGN: { title: 'کمپین دریافت شد', description: `${customer.name} کمپین پیامکی را دریافت کرد`, icon: 'fa-megaphone', color: 'purple' },
    DEAL: { title: 'معامله جدید', description: `برای ${customer.name} یک deal جدید ایجاد شد`, icon: 'fa-handshake', color: 'indigo' },
    SUPPORT: { title: 'تیکت جدید', description: `${customer.name} تیکت پشتیبانی ثبت کرد`, icon: 'fa-headset', color: 'orange' },
    BADGE: { title: 'بج اعطا شد', description: `به ${customer.name} بج طلایی اعطا شد`, icon: 'fa-medal', color: 'amber' },
    LEVEL_UP: { title: 'ارتقاء سطح', description: `${customer.name} به سطح ${randomInt(5, 50)} ارتقاء یافت`, icon: 'fa-arrow-up', color: 'emerald' },
  }
  
  const t = templates[type]
  return {
    id: `act_${String(i).padStart(6, '0')}`,
    type,
    title: t.title,
    description: t.description,
    customerId: customer.id,
    customerName: customer.name,
    icon: t.icon,
    color: t.color,
    createdAt: randomDate(7),
  }
}

const MOCK_ACTIVITIES: ActivityItem[] = Array.from({ length: 50 }, (_, i) => generateActivity(i + 1))
  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

// =============================================
// Mock API Functions
// =============================================

export const mockApi = {
  // Auth
  async sendOtp(mobile: string) {
    await sleep(MOCK_DELAY)
    return { success: true, data: { expiresIn: 120 }, message: 'کد OTP ارسال شد' }
  },

  async verifyOtp(mobile: string, otp: string) {
    await sleep(MOCK_DELAY)
    // Admin check: only specific mobiles
    if (otp === '12345') {
      return {
        success: true,
        data: {
          accessToken: 'mock_access_token_admin',
          refreshToken: 'mock_refresh_token_admin',
          user: {
            id: 'admin_001',
            name: 'مدیر سیستم',
            email: 'admin@tiktakrun.com',
            mobile,
            avatar: undefined,
            roles: ['SUPER_ADMIN'],
            permissions: ['*'],
            createdAt: new Date().toISOString(),
          }
        }
      }
    }
    return { success: false, data: null, message: 'کد وارد شده صحیح نیست' }
  },

  async loginWithPassword(mobile: string, password: string) {
    await sleep(MOCK_DELAY)
    if (password === 'admin123') {
      return {
        success: true,
        data: {
          accessToken: 'mock_access_token_admin',
          refreshToken: 'mock_refresh_token_admin',
          user: {
            id: 'admin_001',
            name: 'مدیر سیستم',
            email: 'admin@tiktakrun.com',
            mobile,
            roles: ['SUPER_ADMIN'],
            permissions: ['*'],
            createdAt: new Date().toISOString(),
          }
        }
      }
    }
    return { success: false, data: null, message: 'رمز عبور اشتباه است' }
  },

  // Overview
  async getOverview(): Promise<{ success: boolean; data: OverviewData }> {
    await sleep(MOCK_DELAY)
    const revenueChart = Array.from({ length: 30 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (29 - i))
      return {
        date: d.toISOString().split('T')[0],
        revenue: randomInt(3000000, 15000000),
        bookings: randomInt(20, 80),
      }
    })
    
    return {
      success: true,
      data: {
        kpis: {
          monthlyRevenue: { label: 'درآمد ماهانه', value: '۲۴۸٫۵ میلیون', rawValue: 248500000, change: 18.5, changeType: 'increase', target: 300000000, targetPercent: 82.8, icon: 'fa-sack-dollar', color: 'emerald', trend: [40, 55, 45, 62, 70, 58, 75, 82] },
          newCustomers: { label: 'مشتریان جدید', value: '۲۳۴', rawValue: 234, change: 24.1, changeType: 'increase', icon: 'fa-users-plus', color: 'sky', trend: [20, 35, 28, 42, 38, 52, 47, 61] },
          activeBookings: { label: 'رزروهای فعال', value: '۱۸۷', rawValue: 187, change: 7.3, changeType: 'increase', icon: 'fa-calendar-check', color: 'amber', trend: [60, 75, 68, 82, 71, 88, 79, 92] },
          conversionRate: { label: 'نرخ تبدیل', value: '۳۲٫۵٪', rawValue: 32.5, change: -2.1, changeType: 'decrease', icon: 'fa-chart-line', color: 'purple', trend: [35, 33, 37, 34, 36, 31, 34, 32] },
        },
        revenueChart,
        categoryStats: [
          { name: 'اتاق فرار', count: 389, revenue: 85000000, color: '#dc2626' },
          { name: 'VR ترس', count: 256, revenue: 62000000, color: '#7c3aed' },
          { name: 'لیزرتگ', count: 198, revenue: 42000000, color: '#0ea5e9' },
          { name: 'سینما ترس', count: 145, revenue: 35000000, color: '#f59e0b' },
          { name: 'پینت‌بال', count: 134, revenue: 28000000, color: '#059669' },
          { name: 'بردگیم', count: 98, revenue: 18000000, color: '#ec4899' },
        ],
        acquisitionSources: [
          { source: 'مستقیم', count: 345, percent: 38.2 },
          { source: 'اینستاگرام', count: 234, percent: 25.9 },
          { source: 'معرفی دوست', count: 189, percent: 20.9 },
          { source: 'گوگل', count: 98, percent: 10.8 },
          { source: 'تلگرام', count: 37, percent: 4.2 },
        ],
        topCustomers: MOCK_CUSTOMERS.slice(0, 10),
        recentBookings: Array.from({ length: 10 }, (_, i) => ({
          id: `book_${i + 1}`,
          customerId: MOCK_CUSTOMERS[i].id,
          customerName: MOCK_CUSTOMERS[i].name,
          gameId: `game_${i + 1}`,
          gameName: gameNames[i % gameNames.length],
          branchName: 'شعبه مرکزی',
          status: (['CONFIRMED', 'PLAYING', 'COMPLETED', 'PENDING'] as const)[i % 4],
          scheduledAt: randomDate(3),
          participants: randomInt(2, 8),
          totalAmount: randomInt(500000, 4000000),
          paidAmount: randomInt(500000, 4000000),
          createdAt: randomDate(7),
        })),
        financialKpis: {
          cac: 85000,
          clv: 4200000,
          churnRate: 8.5,
          nps: 72,
        },
      }
    }
  },

  // Customers
  async getCustomers(params: Record<string, unknown> = {}) {
    await sleep(MOCK_DELAY)
    let filtered = [...MOCK_CUSTOMERS]
    if (params.search) {
      const q = String(params.search).toLowerCase()
      filtered = filtered.filter(c => c.name.includes(q) || c.mobile.includes(q))
    }
    if (params.tier) filtered = filtered.filter(c => c.tier === params.tier)
    if (params.status) filtered = filtered.filter(c => c.status === params.status)
    
    const page = Number(params.page) || 1
    const limit = Number(params.limit) || 20
    const start = (page - 1) * limit
    
    return {
      success: true,
      data: filtered.slice(start, start + limit),
      meta: { total: filtered.length, page, limit, totalPages: Math.ceil(filtered.length / limit) }
    }
  },

  async getCustomer(id: string) {
    await sleep(MOCK_DELAY)
    const customer = MOCK_CUSTOMERS.find(c => c.id === id) || MOCK_CUSTOMERS[0]
    return { success: true, data: customer }
  },

  async getCustomerBookings(id: string) {
    await sleep(MOCK_DELAY)
    return {
      success: true,
      data: Array.from({ length: 8 }, (_, i) => ({
        id: `book_${id}_${i}`,
        customerId: id,
        customerName: 'مشتری',
        gameId: `game_${i}`,
        gameName: gameNames[i % gameNames.length],
        branchName: 'شعبه مرکزی',
        status: (['COMPLETED', 'CONFIRMED', 'CANCELLED'] as const)[i % 3],
        scheduledAt: randomDate(60),
        participants: randomInt(2, 6),
        totalAmount: randomInt(800000, 3500000),
        paidAmount: randomInt(800000, 3500000),
        createdAt: randomDate(70),
      }))
    }
  },

  async getCustomerTransactions(id: string) {
    await sleep(MOCK_DELAY)
    return {
      success: true,
      data: Array.from({ length: 10 }, (_, i) => ({
        id: `txn_${id}_${i}`,
        customerId: id,
        type: (['CHARGE', 'DEBIT', 'REFUND', 'REWARD'] as const)[i % 4],
        amount: randomInt(100000, 3000000),
        currency: (['TOMAN', 'COINS'] as const)[i % 2],
        description: ['شارژ کیف پول', 'پرداخت رزرو', 'برگشت وجه', 'پاداش معرفی'][i % 4],
        status: 'SUCCESS' as const,
        createdAt: randomDate(60),
      }))
    }
  },

  async getCustomerReviews(id: string) {
    await sleep(MOCK_DELAY)
    return {
      success: true,
      data: Array.from({ length: 5 }, (_, i) => ({
        id: `rev_${id}_${i}`,
        customerId: id,
        customerName: 'مشتری',
        gameId: `game_${i}`,
        gameName: gameNames[i % gameNames.length],
        rating: randomInt(3, 5),
        comment: ['عالی بود! حتماً دوباره میام', 'تجربه فوق‌العاده‌ای بود', 'محیط خوب، دکور زیبا', 'همه چیز عالی بود'][i % 4],
        isApproved: true,
        isHidden: false,
        createdAt: randomDate(90),
      }))
    }
  },

  async getCustomerNotes(id: string) {
    await sleep(MOCK_DELAY)
    return {
      success: true,
      data: Array.from({ length: 3 }, (_, i) => ({
        id: `note_${id}_${i}`,
        customerId: id,
        adminId: 'admin_001',
        adminName: 'مدیر سیستم',
        content: ['مشتری VIP — اولویت بالا', 'درخواست تخفیف ویژه داشت', 'برای گروه شرکتی رزرو می‌کند'][i],
        createdAt: randomDate(30),
        updatedAt: randomDate(10),
      }))
    }
  },

  // Segments
  async getSegments() {
    await sleep(MOCK_DELAY)
    return { success: true, data: MOCK_SEGMENTS }
  },

  async getSegmentMembers(id: string, params = {}) {
    await sleep(MOCK_DELAY)
    const seg = MOCK_SEGMENTS.find(s => s.id === id)
    const count = seg?.count || 20
    return {
      success: true,
      data: MOCK_CUSTOMERS.slice(0, Math.min(count, 20)),
      meta: { total: count, page: 1, limit: 20, totalPages: Math.ceil(count / 20) }
    }
  },

  async previewSegment(rules: unknown[], logic: string) {
    await sleep(300)
    return { success: true, data: { count: randomInt(50, 500) } }
  },

  async createSegment(data: unknown) {
    await sleep(MOCK_DELAY)
    return { success: true, data: { id: `seg_new_${Date.now()}`, ...data as object }, message: 'سگمنت با موفقیت ایجاد شد' }
  },

  // Pipeline
  async getPipeline() {
    await sleep(MOCK_DELAY)
    return { success: true, data: MOCK_DEALS }
  },

  async moveDeal(id: string, newStage: string, newPosition: number) {
    await sleep(200)
    return { success: true, data: { id, stage: newStage, position: newPosition }, message: 'معامله جابجا شد' }
  },

  async createDeal(data: unknown) {
    await sleep(MOCK_DELAY)
    return { success: true, data: { id: `d_new_${Date.now()}`, ...data as object }, message: 'معامله ایجاد شد' }
  },

  async updateDeal(id: string, data: unknown) {
    await sleep(MOCK_DELAY)
    return { success: true, data: { id, ...data as object }, message: 'معامله بروز شد' }
  },

  async deleteDeal(id: string) {
    await sleep(MOCK_DELAY)
    return { success: true, data: null, message: 'معامله حذف شد' }
  },

  // Campaigns
  async getCampaigns() {
    await sleep(MOCK_DELAY)
    return { success: true, data: MOCK_CAMPAIGNS }
  },

  async getCampaign(id: string) {
    await sleep(MOCK_DELAY)
    const camp = MOCK_CAMPAIGNS.find(c => c.id === id) || MOCK_CAMPAIGNS[0]
    return { success: true, data: camp }
  },

  async createCampaign(data: unknown) {
    await sleep(MOCK_DELAY)
    return { success: true, data: { id: `camp_new_${Date.now()}`, ...data as object }, message: 'کمپین ایجاد شد' }
  },

  async updateCampaign(id: string, data: unknown) {
    await sleep(MOCK_DELAY)
    return { success: true, data: { id, ...data as object }, message: 'کمپین بروز شد' }
  },

  async launchCampaign(id: string) {
    await sleep(MOCK_DELAY)
    return { success: true, data: null, message: 'کمپین با موفقیت ارسال شد' }
  },

  // Activities
  async getActivities(params = {}) {
    await sleep(MOCK_DELAY)
    return {
      success: true,
      data: MOCK_ACTIVITIES,
      meta: { total: MOCK_ACTIVITIES.length, page: 1, limit: 50, totalPages: 1 }
    }
  },

  // Admin actions
  async banCustomer(id: string, reason: string) {
    await sleep(MOCK_DELAY)
    return { success: true, data: null, message: 'کاربر مسدود شد' }
  },

  async unbanCustomer(id: string) {
    await sleep(MOCK_DELAY)
    return { success: true, data: null, message: 'کاربر از مسدودی خارج شد' }
  },

  async grantBadge(id: string, badge: string) {
    await sleep(MOCK_DELAY)
    return { success: true, data: null, message: 'بج اعطا شد' }
  },

  async adjustXp(id: string, amount: number, reason: string) {
    await sleep(MOCK_DELAY)
    return { success: true, data: null, message: `${amount > 0 ? '+' : ''}${amount} XP اعمال شد` }
  },

  async adjustWallet(id: string, amount: number, reason: string) {
    await sleep(MOCK_DELAY)
    return { success: true, data: null, message: 'کیف پول تنظیم شد' }
  },

  async addNote(customerId: string, content: string) {
    await sleep(MOCK_DELAY)
    return {
      success: true, data: {
        id: `note_new_${Date.now()}`, customerId, adminId: 'admin_001', adminName: 'مدیر سیستم',
        content, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
      }
    }
  },

  async getNotifications() {
    await sleep(200)
    return {
      success: true,
      data: Array.from({ length: 8 }, (_, i) => ({
        id: `notif_${i}`,
        type: (['info', 'success', 'warning', 'error'] as const)[i % 4],
        title: ['رزرو جدید', 'پرداخت موفق', 'کاربر At-Risk', 'تیکت جدید'][i % 4],
        message: ['یک رزرو جدید ثبت شد', 'پرداخت با موفقیت انجام شد', 'تعداد کاربران At-Risk افزایش یافت', 'تیکت پشتیبانی جدید'][i % 4],
        isRead: i > 3,
        createdAt: randomDate(3),
        link: '/dashboard',
      }))
    }
  }
}

export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true'
