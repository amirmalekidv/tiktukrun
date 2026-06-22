import { PaginationMeta } from '@tiktakrun/shared-types';

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export function parsePagination(query: PaginationQuery): {
  skip: number;
  take: number;
  page: number;
  limit: number;
} {
  const page  = Math.max(1, Number(query.page)  || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  return { skip: (page - 1) * limit, take: limit, page, limit };
}

export function buildPaginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): { success: true; data: T[]; meta: PaginationMeta } {
  const totalPages = Math.ceil(total / limit);
  return {
    success: true,
    data: items,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}
