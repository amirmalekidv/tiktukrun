/**
 * Jalali (Shamsi) date utilities
 * Wraps moment-jalaali for consistent date handling
 */

// Note: moment-jalaali will be imported at runtime
// Using a simple implementation to avoid peer dependency issues

/**
 * Convert Gregorian date to Jalali string
 * Format: YYYY/MM/DD
 */
export function toJalali(date: Date | string): string {
  const d = new Date(date);
  // Simple Gregorian to Jalali conversion
  const g2j = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  return `${g2j[0]}/${String(g2j[1]).padStart(2, '0')}/${String(g2j[2]).padStart(2, '0')}`;
}

/**
 * Format date with time in Jalali
 */
export function toJalaliDateTime(date: Date | string): string {
  const d = new Date(date);
  const jalali = toJalali(d);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${jalali} ${hours}:${minutes}:${seconds}`;
}

/**
 * Get current date in Jalali
 */
export function nowJalali(): string {
  return toJalali(new Date());
}

/**
 * Convert Gregorian to Jalali (algorithm)
 */
function gregorianToJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const g_d_no = [
    0, 31,
    (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28,
    31, 30, 31, 30, 31, 31, 30, 31, 30, 31
  ];
  const j_d_no = [0, 31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];

  let jy = gy - 1600;
  let jm: number;
  let jd: number;
  let g_y = gy - 600;
  let gm_idx = gm - 1;

  let gy2 = gm > 2 ? gy + 1 : gy;
  let g_day_no =
    365 * (gy - 1) +
    Math.floor((gy2 - 1) / 4) -
    Math.floor((gy2 - 1) / 100) +
    Math.floor((gy2 - 1) / 400);

  for (let i = 0; i < gm_idx; ++i) g_day_no += g_d_no[i + 1];
  g_day_no += gd - 1;

  let j_day_no = g_day_no - 79;
  let j_np = Math.floor(j_day_no / 12053);
  j_day_no %= 12053;

  jy = 979 + 33 * j_np + 4 * Math.floor(j_day_no / 1461);
  j_day_no %= 1461;

  if (j_day_no >= 366) {
    jy += Math.floor((j_day_no - 1) / 365);
    j_day_no = (j_day_no - 1) % 365;
  }

  for (let i = 0; i < 11 && j_day_no >= j_d_no[i + 1]; ++i) {
    j_day_no -= j_d_no[i + 1];
    jm = i + 2;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  jm = jm || 1;
  jd = j_day_no + 1;

  return [jy, jm, jd];
}

/**
 * Get age from birth date in years
 */
export function getAge(birthDate: Date | string): number {
  const birth = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}
