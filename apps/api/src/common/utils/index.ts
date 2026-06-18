/**
 * تبدیل اعداد انگلیسی به فارسی
 */
export function persianNum(num: number | string): string {
  const farsi = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(num).replace(/[0-9]/g, (d) => farsi[parseInt(d)]);
}

/**
 * تبدیل تاریخ میلادی به جلالی (ساده — برای فرانت از moment-jalaali استفاده شود)
 */
export function jalaliDate(date: Date | string): string {
  // Placeholder — در فازهای بعدی با کتابخانه jalali-moment کامل می‌شود
  const d = new Date(date);
  return d.toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * ساخت slug از متن فارسی/انگلیسی
 */
export function slug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9\u0600-\u06FF-]/g, '')
    .replace(/-+/g, '-');
}

/**
 * فرمت تومان
 */
export function formatToman(amount: bigint | number | string): string {
  const num = typeof amount === 'bigint' ? amount : BigInt(String(amount));
  return num.toLocaleString('fa-IR') + ' تومان';
}

/**
 * تولید کد تصادفی OTP
 */
export function generateOtp(length = 6): string {
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10).toString();
  }
  return otp;
}

/**
 * تولید کد یکتا برای رزرو
 */
export function generateBookingCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'TTR-';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
