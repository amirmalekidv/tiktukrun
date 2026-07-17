import apiClient from './client';
import type { Game, ApiResponse } from '../types';

const API_ROOT = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(
  /\/api\/v1\/?$/,
  '',
);

function resolveMediaUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_ROOT}${path.startsWith('/') ? path : `/${path}`}`;
}

function normalizeDifficulty(value: unknown): Game['difficulty'] {
  switch (value) {
    case 'EASY':
    case 'MEDIUM':
    case 'HARD':
    case 'EXPERT':
      return value;
    case 'VERY_HARD':
    case 'LEGENDARY':
      return 'EXPERT';
    default:
      return 'MEDIUM';
  }
}

function normalizeCategory(raw: any): Game['category'] {
  if (!raw) return undefined;
  return {
    ...raw,
    id: String(raw?.id ?? ''),
    name: String(raw?.name ?? ''),
    slug: String(raw?.slug ?? ''),
    isActive: raw?.isActive ?? true,
  };
}

function normalizeBranch(raw: any): Game['branch'] {
  if (!raw) return undefined;
  return {
    ...raw,
    id: String(raw?.id ?? ''),
    name: String(raw?.name ?? ''),
    cityId: String(raw?.cityId ?? raw?.city?.id ?? ''),
    address: String(raw?.address ?? ''),
    isActive: raw?.isActive ?? true,
    city: raw?.city
      ? {
          ...raw.city,
          id: String(raw.city?.id ?? ''),
          name: String(raw.city?.name ?? ''),
          slug: String(raw.city?.slug ?? ''),
          isActive: raw.city?.isActive ?? true,
        }
      : undefined,
  };
}

function normalizeOptionalNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function normalizeGame(raw: any): Game {
  const siteRank = normalizeOptionalNumber(raw?.siteRank ?? raw?.rank);
  const images = Array.isArray(raw?.images)
    ? raw.images.map((img: any, index: number) => ({
        id: String(img?.id ?? index),
        url: resolveMediaUrl(img?.url) || '',
        displayOrder: Number(img?.displayOrder ?? index),
        caption: img?.caption ?? undefined,
      }))
    : [];

  return {
    ...raw,
    id: String(raw?.id ?? ''),
    title: String(raw?.title ?? ''),
    slug: String(raw?.slug ?? ''),
    subtitle: raw?.subtitle ?? undefined,
    categoryId: String(raw?.categoryId ?? raw?.category?.id ?? ''),
    category: normalizeCategory(raw?.category) ?? (
      raw?.categoryName
        ? {
            id: String(raw?.categoryId ?? ''),
            name: String(raw.categoryName),
            slug: String(raw?.categorySlug ?? ''),
            isActive: true,
          }
        : undefined
    ),
    branchId: String(raw?.branchId ?? raw?.branch?.id ?? ''),
    branch: normalizeBranch(raw?.branch) ?? (
      raw?.branchName
        ? {
            id: String(raw?.branchId ?? ''),
            name: String(raw.branchName),
            cityId: String(raw?.cityId ?? raw?.branch?.cityId ?? ''),
            address: String(raw?.branchAddress ?? ''),
            isActive: true,
            city: raw?.cityName
              ? {
                  id: String(raw?.cityId ?? ''),
                  name: String(raw.cityName),
                  slug: String(raw?.citySlug ?? ''),
                  isActive: true,
                }
              : undefined,
          }
        : undefined
    ),
    description: raw?.description ?? undefined,
    scenario: raw?.scenario ?? undefined,
    fearLevel: Number(raw?.fearLevel ?? 0),
    difficulty: normalizeDifficulty(raw?.difficulty),
    tier: raw?.tier ?? undefined,
    minPlayers: Number(raw?.minPlayers ?? 0),
    maxPlayers: Number(raw?.maxPlayers ?? 0),
    duration: Number(raw?.duration ?? raw?.durationMinutes ?? 0),
    pricePerPerson: String(raw?.pricePerPerson ?? ''),
    weeklyDiscountPercent: normalizeOptionalNumber(raw?.weeklyDiscountPercent),
    siteRank,
    tags: Array.isArray(raw?.tags) ? raw.tags : [],
    coverImage: resolveMediaUrl(raw?.coverImage) || images[0]?.url,
    images,
    teaserUrl: resolveMediaUrl(raw?.teaserUrl),
    isActive: Boolean(raw?.isActive),
    isFeatured: Boolean(raw?.isFeatured),
    rating: raw?.rating != null
      ? Number(raw.rating)
      : siteRank != null
        ? siteRank
        : raw?.userRankCached != null
          ? Number(raw.userRankCached)
          : undefined,
    totalBookings: raw?.totalBookings != null
      ? Number(raw.totalBookings)
      : raw?.stats?.totalBookings != null
        ? Number(raw.stats.totalBookings)
        : raw?._count?.bookings != null
          ? Number(raw._count.bookings)
          : undefined,
    totalRevenue: raw?.totalRevenue != null
      ? String(raw.totalRevenue)
      : raw?.stats?.totalRevenue != null
        ? String(raw.stats.totalRevenue)
        : undefined,
    createdAt: String(raw?.createdAt ?? ''),
    updatedAt: String(raw?.updatedAt ?? ''),
  };
}

function normalizeGameListPayload(payload: any) {
  if (Array.isArray(payload?.data)) {
    payload.data = payload.data.map((game: any) => normalizeGame(game));
  }
  return payload;
}

function normalizeSingleGamePayload(payload: any) {
  if (payload?.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
    payload.data = normalizeGame(payload.data);
  }
  return payload;
}

export const gamesApi = {
  getAll: async (params?: Record<string, unknown>) => {
    const res = await apiClient.get<ApiResponse<Game[]>>('/admin/games', { params });
    if (res.data && typeof res.data === 'object') {
      normalizeGameListPayload(res.data as any);
    }
    return res;
  },

  getById: async (id: string) => {
    const res = await apiClient.get<ApiResponse<Game>>(`/admin/games/${id}`);
    if (res.data && typeof res.data === 'object') {
      normalizeSingleGamePayload(res.data as any);
    }
    return res;
  },

  create: async (data: FormData) => {
    const res = await apiClient.post<ApiResponse<Game>>('/admin/games', data);
    if (res.data && typeof res.data === 'object') {
      normalizeSingleGamePayload(res.data as any);
    }
    return res;
  },

  update: async (id: string, data: FormData) => {
    const res = await apiClient.patch<ApiResponse<Game>>(`/admin/games/${id}`, data);
    if (res.data && typeof res.data === 'object') {
      normalizeSingleGamePayload(res.data as any);
    }
    return res;
  },

  delete: (id: string) =>
    apiClient.delete(`/admin/games/${id}`),

  // backend: @Post(':id/toggle-active') / @Post(':id/toggle-featured')
  toggleActive: (id: string) =>
    apiClient.post(`/admin/games/${id}/toggle-active`),

  toggleFeatured: (id: string) =>
    apiClient.post(`/admin/games/${id}/toggle-featured`),

  // backend: @Post(':id/images') expects field name "images" (FilesInterceptor, up to 10)
  uploadImage: (id: string, files: File | File[]) => {
    const fd = new FormData();
    const list = Array.isArray(files) ? files : [files];
    list.forEach((f) => fd.append('images', f));
    return apiClient.post(`/admin/games/${id}/images`, fd);
  },

  // backend: @Delete(':id/images/:imageId')
  deleteImage: (id: string, imageId: string) =>
    apiClient.delete(`/admin/games/${id}/images/${imageId}`),

  // backend: @Post(':id/recompute-rank')
  recomputeRank: (id: string) =>
    apiClient.post(`/admin/games/${id}/recompute-rank`),

  // سطح‌بندی بازی: STANDARD | SILVER | GOLD | PLATINUM | DIAMOND
  setTier: (id: string, tier: string) =>
    apiClient.patch(`/admin/games/${id}/tier`, { tier }),
};

// ──────────────────────────────────────────────────────────────
// مدیریت/مودریشن کامنت‌های بازی + آمار لایک‌ها
// endpoints بک‌اند: /admin/games/comments
// ──────────────────────────────────────────────────────────────
export const gameCommentsApi = {
  list: (filter: 'pending' | 'all' | 'hidden' = 'pending', page = 1, limit = 30) =>
    apiClient.get(`/admin/games/comments`, { params: { filter, page, limit } }),

  stats: () =>
    apiClient.get(`/admin/games/comments/stats`),

  approve: (commentId: string) =>
    apiClient.post(`/admin/games/comments/${commentId}/approve`),

  reject: (commentId: string) =>
    apiClient.post(`/admin/games/comments/${commentId}/reject`),

  remove: (commentId: string) =>
    apiClient.delete(`/admin/games/comments/${commentId}`),
};
