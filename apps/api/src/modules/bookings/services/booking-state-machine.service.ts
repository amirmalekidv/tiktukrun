import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';

/**
 * BookingStateMachine — مدیریت انتقال state رزرو
 *
 * PENDING   → CONFIRMED  (payment success)
 * PENDING   → CANCELLED  (user/admin/timeout)
 * CONFIRMED → COMPLETED  (slotDateTime+1h گذشت یا ادمین)
 * CONFIRMED → CANCELLED  (با refund)
 * COMPLETED → REFUNDED   (only admin)
 */

type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'REFUNDED';

interface TransitionResult {
  allowed: boolean;
  reason?: string;
}

const VALID_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING:   ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['COMPLETED', 'CANCELLED'],
  COMPLETED: ['REFUNDED'],
  CANCELLED: [],
  REFUNDED:  [],
};

@Injectable()
export class BookingStateMachine {
  canTransition(from: BookingStatus, to: BookingStatus): TransitionResult {
    const allowed = VALID_TRANSITIONS[from]?.includes(to) ?? false;
    if (!allowed) {
      return {
        allowed: false,
        reason:  `انتقال از "${from}" به "${to}" مجاز نیست`,
      };
    }
    return { allowed: true };
  }

  assertTransition(from: BookingStatus, to: BookingStatus): void {
    const result = this.canTransition(from, to);
    if (!result.allowed) {
      throw new BadRequestException(result.reason);
    }
  }
}
