/**
 * TIK TAK RUN — Formatting Utilities
 * فارسی اعداد، تومان، شمسی
 */

import moment from 'moment-jalaali';

// اعداد فارسی
const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function persianNum(num: number | string | undefined | null): string {
  if (num === undefined || num === null) return '—';
  return String(num).replace(/\d/g, (d) => PERSIAN_DIGITS[parseInt(d)]);
}

// فرمت تومان با کاما فارسی
export function formatToman(amount: number | string | bigint | undefined | null): string {
  if (amount === undefined || amount === null) return '—';
  const n = typeof amount === 'bigint' ? Number(amount) : Number(amount);
  if (isNaN(n)) return '—';
  const formatted = n.toLocaleString('fa-IR');
  return `${formatted} تومان`;
}

export function formatTomanShort(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null) return '—';
  const n = Number(amount);
  if (isNaN(n)) return '—';
  if (n >= 1_000_000_000) return `${persianNum((n / 1_000_000_000).toFixed(1))} میلیارد`;
  if (n >= 1_000_000) return `${persianNum((n / 1_000_000).toFixed(1))} میلیون`;
  if (n >= 1_000) return `${persianNum((n / 1_000).toFixed(0))} هزار`;
  return persianNum(n);
}

// تبدیل تاریخ میلادی به شمسی
export function toJalali(date: string | Date | undefined | null, format = 'jYYYY/jMM/jDD'): string {
  if (!date) return '—';
  try {
    return moment(date).format(format);
  } catch {
    return '—';
  }
}

export function toJalaliDateTime(date: string | Date | undefined | null): string {
  return toJalali(date, 'jYYYY/jMM/jDD — HH:mm');
}

export function toJalaliTime(date: string | Date | undefined | null): string {
  if (!date) return '—';
  try {
    return moment(date).format('HH:mm');
  } catch {
    return '—';
  }
}

export function timeAgo(date: string | Date | undefined | null): string {
  if (!date) return '—';
  try {
    return moment(date).fromNow();
  } catch {
    return '—';
  }
}

// کوتاه کردن متن
export function truncate(text: string, maxLen = 50): string {
  if (!text) return '';
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen) + '...';
}

// تولید کد رنگ‌دار برای status
export const STATUS_COLORS: Record<string, string> = {
  // ── Domain-level keys (UPPER_CASE) ──────────────────────────────────
  PENDING: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  CONFIRMED: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  COMPLETED: 'bg-green-500/20 text-green-400 border border-green-500/30',
  CANCELLED: 'bg-red-500/20 text-red-400 border border-red-500/30',
  REFUNDED: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
  OPEN: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  IN_PROGRESS: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  RESOLVED: 'bg-green-500/20 text-green-400 border border-green-500/30',
  CLOSED: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
  WAITING_USER: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  LOW: 'bg-slate-500/20 text-slate-400',
  MEDIUM: 'bg-yellow-500/20 text-yellow-400',
  HIGH: 'bg-orange-500/20 text-orange-400',
  URGENT: 'bg-red-500/20 text-red-400',
  ACTIVE: 'bg-green-500/20 text-green-400',
  INACTIVE: 'bg-red-500/20 text-red-400',
  REPORTED: 'bg-orange-500/20 text-orange-400',
  HIDDEN: 'bg-slate-500/20 text-slate-400',
  DELETED: 'bg-red-500/20 text-red-400',
  APPROVED: 'bg-green-500/20 text-green-400 border border-green-500/30',
  REJECTED: 'bg-red-500/20 text-red-400 border border-red-500/30',
  SUSPENDED: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  NORMAL: 'bg-slate-500/20 text-slate-400',
  // ── Generic CSS-style semantic keys (lowercase) ─────────────────────
  // Used by page files that pass status="success" / status="danger" etc.
  success: 'bg-green-500/20 text-green-400 border border-green-500/30',
  danger: 'bg-red-500/20 text-red-400 border border-red-500/30',
  warning: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  info: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  default: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
  active: 'bg-green-500/20 text-green-400 border border-green-500/30',
  inactive: 'bg-red-500/20 text-red-400 border border-red-500/30',
  maintenance: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
};

export const STATUS_LABELS: Record<string, string> = {
  PENDING: 'در انتظار',
  CONFIRMED: 'تأیید شده',
  COMPLETED: 'تکمیل شده',
  CANCELLED: 'لغو شده',
  REFUNDED: 'بازگشت وجه',
  OPEN: 'باز',
  IN_PROGRESS: 'در حال بررسی',
  RESOLVED: 'حل شده',
  CLOSED: 'بسته',
  WAITING_USER: 'منتظر کاربر',
  LOW: 'کم',
  MEDIUM: 'متوسط',
  HIGH: 'زیاد',
  URGENT: 'فوری',
  ACTIVE: 'فعال',
  INACTIVE: 'غیرفعال',
  REPORTED: 'گزارش‌شده',
  HIDDEN: 'مخفی',
  DELETED: 'حذف شده',
  NORMAL: 'عادی',
  APPROVED: 'تأیید شده',
  REJECTED: 'رد شده',
  SUSPENDED: 'معلق',
  // Generic semantic keys — fallback if no custom label is provided via `label` prop
  success: 'موفق',
  danger: 'خطر',
  warning: 'هشدار',
  info: 'اطلاعات',
  default: 'پیش‌فرض',
  active: 'فعال',
  inactive: 'غیرفعال',
  maintenance: 'تعمیرات',
};

// Fear Level
export const FEAR_EMOJIS = ['😊', '😨', '😱', '🔥', '💀'];
export function fearLabel(level: number): string {
  const labels = ['آرام', 'ترسناک', 'وحشتناک', 'شدید', 'مرگبار'];
  return labels[Math.min(level - 1, 4)] || '—';
}

// تیر ماژول
export const TIER_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  BRONZE: { label: 'برنز', color: 'text-amber-600', bg: 'bg-amber-900/30' },
  SILVER: { label: 'نقره', color: 'text-slate-300', bg: 'bg-slate-700/50' },
  GOLD: { label: 'طلا', color: 'text-yellow-400', bg: 'bg-yellow-900/30' },
  LEGEND: { label: 'افسانه', color: 'text-red-400', bg: 'bg-red-900/30' },
};

// نوع تراکنش
export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  DEPOSIT: 'واریز',
  WITHDRAWAL: 'برداشت',
  BOOKING_PAYMENT: 'پرداخت رزرو',
  BOOKING_REFUND: 'بازگشت رزرو',
  WHEEL_SPIN: 'چرخش گردونه',
  REWARD: 'جایزه',
  BONUS: 'پاداش',
  TRANSFER: 'انتقال',
  PURCHASE: 'خرید',
};

// ارز
export const CURRENCY_LABELS: Record<string, string> = {
  toman: 'تومان',
  coins: 'سکه',
  diamonds: 'الماس',
  xp: 'XP',
};

export function clsx(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
