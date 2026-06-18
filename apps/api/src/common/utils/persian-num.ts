/**
 * Persian/Arabic digit conversion utilities
 */

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

/**
 * Convert Persian/Arabic digits to English digits
 */
export function toEnglishDigits(str: string): string {
  if (!str) return str;
  let result = str;
  for (let i = 0; i < 10; i++) {
    result = result
      .replace(new RegExp(PERSIAN_DIGITS[i], 'g'), i.toString())
      .replace(new RegExp(ARABIC_DIGITS[i], 'g'), i.toString());
  }
  return result;
}

/**
 * Convert English digits to Persian digits
 */
export function toPersianDigits(str: string | number): string {
  const s = str.toString();
  return s.replace(/[0-9]/g, (d) => PERSIAN_DIGITS[parseInt(d)]);
}

/**
 * Normalize Iranian mobile number
 * Converts Persian digits and ensures format 09XXXXXXXXX
 */
export function normalizeMobile(mobile: string): string {
  const english = toEnglishDigits(mobile.trim());
  // Remove +98 or 0098 prefix
  if (english.startsWith('+98')) return '0' + english.slice(3);
  if (english.startsWith('0098')) return '0' + english.slice(4);
  if (english.startsWith('98') && english.length === 12) return '0' + english.slice(2);
  return english;
}

/**
 * Validate Iranian mobile number
 */
export function isValidIranianMobile(mobile: string): boolean {
  const normalized = normalizeMobile(mobile);
  return /^09\d{9}$/.test(normalized);
}

/**
 * Format number with thousand separators (Persian style)
 */
export function formatNumber(num: number | bigint): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
