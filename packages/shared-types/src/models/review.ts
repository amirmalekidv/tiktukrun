/**
 * Review Models — TIK TAK RUN Shared Types
 */

import type { User } from './user';

export interface GameReview {
  id: number;
  bookingId: number;
  userId: number;
  gameId: number;
  /** امتیاز ۱-۵ */
  rating: number;
  text?: string;
  isApproved: boolean;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;

  user?: Pick<User, 'id' | 'fullName' | 'nickname' | 'avatarUrl'>;
}

export interface PlayerRating {
  id: number;
  fromUserId: number;
  toUserId: number;
  bookingId?: number;
  /** تغییر XP — مثبت یا منفی */
  xpChange: number;
  reason?: string;
  createdAt: string;
}

/** آمار نظرات یک بازی */
export interface ReviewStats {
  average: string;
  total: number;
  approvedCount: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}
