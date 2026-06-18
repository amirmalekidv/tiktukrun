/**
 * Pagination Utilities — TIK TAK RUN Shared Types
 */

export interface PaginationMeta {
  /** صفحه فعلی (شروع از ۱) */
  page: number;
  /** تعداد آیتم در هر صفحه */
  limit: number;
  /** تعداد کل آیتم‌ها */
  total: number;
  /** تعداد کل صفحات */
  totalPages: number;
  /** آیا صفحه بعدی وجود دارد */
  hasNextPage: boolean;
  /** آیا صفحه قبلی وجود دارد */
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/** ساختار query params برای pagination */
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/** helper type برای cursor-based pagination (برای real-time chat) */
export interface CursorPaginatedResponse<T> {
  data: T[];
  nextCursor?: string;
  prevCursor?: string;
  hasMore: boolean;
}
