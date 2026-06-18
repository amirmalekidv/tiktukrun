import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// =============================================
// Tailwind class merger
// =============================================
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// =============================================
// Persian number formatting
// =============================================
const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']

export function toPersianNum(num: number | string): string {
  return String(num).replace(/[0-9]/g, (d) => persianDigits[parseInt(d)])
}

// =============================================
// Format Toman currency
// =============================================
export function formatToman(amount: number | string): string {
  const num = typeof amount === 'string' ? parseInt(amount) : amount
  if (isNaN(num)) return '۰ تومان'
  
  if (num >= 1_000_000_000) {
    return toPersianNum((num / 1_000_000_000).toFixed(1)) + ' میلیارد تومان'
  }
  if (num >= 1_000_000) {
    return toPersianNum((num / 1_000_000).toFixed(1)) + ' میلیون تومان'
  }
  if (num >= 1_000) {
    return toPersianNum(Math.floor(num / 1_000)) + ',' + toPersianNum(String(num % 1_000).padStart(3, '0')) + ' تومان'
  }
  return toPersianNum(num) + ' تومان'
}

export function formatNumber(num: number | string): string {
  const n = typeof num === 'string' ? parseInt(num) : num
  if (isNaN(n)) return '۰'
  return toPersianNum(n.toLocaleString('en-US'))
}

// =============================================
// Jalali date helpers (simple implementation)
// =============================================
const persianMonths = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
]

export function toJalali(dateStr: string | Date): { year: number; month: number; day: number } {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
  // Simple approximation for Gregorian → Jalali
  const jalaliYear = date.getFullYear() - 621
  const jalaliMonth = ((date.getMonth() + 9) % 12) + 1
  const jalaliDay = date.getDate()
  return { year: jalaliYear, month: jalaliMonth, day: jalaliDay }
}

export function formatJalali(dateStr: string | Date, format: 'short' | 'long' | 'datetime' = 'short'): string {
  try {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
    const { year, month, day } = toJalali(date)
    
    if (format === 'long') {
      return `${toPersianNum(day)} ${persianMonths[month - 1]} ${toPersianNum(year)}`
    }
    if (format === 'datetime') {
      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')
      return `${toPersianNum(year)}/${toPersianNum(String(month).padStart(2, '0'))}/${toPersianNum(String(day).padStart(2, '0'))} ${toPersianNum(hours)}:${toPersianNum(minutes)}`
    }
    return `${toPersianNum(year)}/${toPersianNum(String(month).padStart(2, '0'))}/${toPersianNum(String(day).padStart(2, '0'))}`
  } catch {
    return dateStr?.toString() || ''
  }
}

export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return 'همین الان'
  if (minutes < 60) return `${toPersianNum(minutes)} دقیقه پیش`
  if (hours < 24) return `${toPersianNum(hours)} ساعت پیش`
  if (days < 30) return `${toPersianNum(days)} روز پیش`
  return formatJalali(dateStr)
}

// =============================================
// Misc helpers
// =============================================
export function truncate(str: string, length: number): string {
  return str.length > length ? str.slice(0, length) + '...' : str
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

export function getAvatarUrl(name: string, seed?: string): string {
  const s = seed || name
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(s)}&backgroundColor=dc2626&textColor=ffffff`
}

export function tierToLabel(tier: string): string {
  const map: Record<string, string> = {
    VIP: 'VIP',
    PLATINUM: 'پلاتینیوم',
    GOLD: 'طلایی',
    SILVER: 'نقره‌ای',
    BRONZE: 'برنزی',
    AT_RISK: 'در خطر',
    NEWCOMER: 'تازه‌وارد',
  }
  return map[tier] || tier
}

export function tierToColor(tier: string): string {
  const map: Record<string, string> = {
    VIP: 'purple',
    PLATINUM: 'sky',
    GOLD: 'amber',
    SILVER: 'slate',
    BRONZE: 'orange',
    AT_RISK: 'red',
    NEWCOMER: 'emerald',
  }
  return map[tier] || 'slate'
}

export function statusToLabel(status: string): string {
  const map: Record<string, string> = {
    PENDING: 'در انتظار',
    CONFIRMED: 'تأیید شده',
    PLAYING: 'در حال بازی',
    COMPLETED: 'تکمیل شده',
    CANCELLED: 'لغو شده',
    NO_SHOW: 'عدم حضور',
    ACTIVE: 'فعال',
    INACTIVE: 'غیرفعال',
    BANNED: 'مسدود',
    SUSPENDED: 'معلق',
    DRAFT: 'پیش‌نویس',
    SCHEDULED: 'زمان‌بندی شده',
    PAUSED: 'متوقف شده',
    SUCCESS: 'موفق',
    FAILED: 'ناموفق',
    REFUNDED: 'برگشت داده شده',
  }
  return map[status] || status
}

export function pipelineStageToLabel(stage: string): string {
  const map: Record<string, string> = {
    LEAD: 'سرنخ‌ها',
    CONTACTED: 'تماس گرفته شده',
    PROPOSED: 'پیشنهاد داده شده',
    NEGOTIATING: 'در مذاکره',
    CLOSED_WON: 'بسته شده - برنده',
    CLOSED_LOST: 'بسته شده - بازنده',
  }
  return map[stage] || stage
}

export function campaignTypeToLabel(type: string): string {
  const map: Record<string, string> = {
    SMS: 'پیامک',
    EMAIL: 'ایمیل',
    IN_APP: 'درون‌برنامه',
    PUSH: 'پوش نوتیفیکیشن',
  }
  return map[type] || type
}

export function campaignTypeToIcon(type: string): string {
  const map: Record<string, string> = {
    SMS: 'fa-message-sms',
    EMAIL: 'fa-envelope',
    IN_APP: 'fa-bell',
    PUSH: 'fa-mobile-screen',
  }
  return map[type] || 'fa-megaphone'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
