import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format number as Persian Toman with Persian digit separators
 */
export function formatToman(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) return '۰'
  const n = Number(amount)
  if (n === 0) return '۰'
  return n.toLocaleString('fa-IR')
}

/**
 * Format fear level as skull emojis
 */
export function formatFearLevel(level: number): string {
  return '💀'.repeat(Math.max(0, Math.min(5, level)))
}

/**
 * Format duration in minutes to Persian text
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${toPersianDigits(minutes)} دقیقه`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) return `${toPersianDigits(hours)} ساعت`
  return `${toPersianDigits(hours)} ساعت و ${toPersianDigits(mins)} دقیقه`
}

/**
 * Convert Western digits to Persian digits
 */
export function toPersianDigits(n: number | string | null | undefined): string {
  if (n === null || n === undefined) return ''
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  return String(n).replace(/\d/g, (d) => persianDigits[parseInt(d)])
}

/**
 * Format rating (1-5) with star
 */
export function formatRating(rating: number | null | undefined): string {
  const n = Number.isFinite(Number(rating)) ? Number(rating) : 0
  return `${toPersianDigits(n.toFixed(1))} ★`
}

/**
 * Truncate text to specified length
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

/**
 * Get relative time in Persian
 */
export function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) return 'امروز'
  if (days === 1) return 'دیروز'
  if (days < 7) return `${toPersianDigits(days)} روز پیش`
  if (days < 30) return `${toPersianDigits(Math.floor(days / 7))} هفته پیش`
  if (days < 365) return `${toPersianDigits(Math.floor(days / 30))} ماه پیش`
  return `${toPersianDigits(Math.floor(days / 365))} سال پیش`
}

/**
 * Validate Iranian mobile number
 */
export function isValidIranianMobile(mobile: string): boolean {
  return /^09\d{9}$/.test(mobile)
}

/**
 * Mask mobile number for display
 */
export function maskMobile(mobile: string): string {
  if (mobile.length < 11) return mobile
  return `${mobile.slice(0, 4)} ***${mobile.slice(-4)}`
}
