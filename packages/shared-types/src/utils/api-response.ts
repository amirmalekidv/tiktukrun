/**
 * API Response Wrapper — TIK TAK RUN Shared Types
 * ساختار یکپارچه پاسخ‌های API
 */

/** پاسخ موفق API */
export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
}

/** پاسخ خطای API */
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    /** جزئیات اعتبارسنجی (در صورت validation error) */
    details?: ValidationError[];
    /** stack trace فقط در محیط development */
    stack?: string;
  };
  timestamp: string;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

/** Union type برای همه پاسخ‌های API */
export type ApiResult<T> = ApiResponse<T> | ApiError;

/** کدهای خطا */
export const API_ERROR_CODES = {
  // Auth
  UNAUTHORIZED:          'UNAUTHORIZED',
  FORBIDDEN:             'FORBIDDEN',
  INVALID_TOKEN:         'INVALID_TOKEN',
  TOKEN_EXPIRED:         'TOKEN_EXPIRED',
  OTP_INVALID:           'OTP_INVALID',
  OTP_EXPIRED:           'OTP_EXPIRED',
  OTP_MAX_ATTEMPTS:      'OTP_MAX_ATTEMPTS',

  // Validation
  VALIDATION_ERROR:      'VALIDATION_ERROR',
  INVALID_MOBILE:        'INVALID_MOBILE',
  DUPLICATE_MOBILE:      'DUPLICATE_MOBILE',
  DUPLICATE_EMAIL:       'DUPLICATE_EMAIL',
  DUPLICATE_NICKNAME:    'DUPLICATE_NICKNAME',

  // Resources
  NOT_FOUND:             'NOT_FOUND',
  GAME_NOT_FOUND:        'GAME_NOT_FOUND',
  BOOKING_NOT_FOUND:     'BOOKING_NOT_FOUND',
  USER_NOT_FOUND:        'USER_NOT_FOUND',

  // Business Logic
  BOOKING_SLOT_TAKEN:    'BOOKING_SLOT_TAKEN',
  INSUFFICIENT_BALANCE:  'INSUFFICIENT_BALANCE',
  WALLET_LOCKED:         'WALLET_LOCKED',
  DISCOUNT_INVALID:      'DISCOUNT_INVALID',
  DISCOUNT_EXPIRED:      'DISCOUNT_EXPIRED',
  DISCOUNT_MAX_USES:     'DISCOUNT_MAX_USES',
  DISCOUNT_MIN_PURCHASE: 'DISCOUNT_MIN_PURCHASE',
  TEAM_FULL:             'TEAM_FULL',
  TEAM_NOT_FOUND:        'TEAM_NOT_FOUND',
  ALREADY_IN_TEAM:       'ALREADY_IN_TEAM',
  WHEEL_INSUFFICIENT:    'WHEEL_INSUFFICIENT',
  USER_BANNED:           'USER_BANNED',
  USER_MUTED:            'USER_MUTED',

  // Server
  INTERNAL_ERROR:        'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE:   'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED:   'RATE_LIMIT_EXCEEDED',
} as const;

export type ApiErrorCode = typeof API_ERROR_CODES[keyof typeof API_ERROR_CODES];
