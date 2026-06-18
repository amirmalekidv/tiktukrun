import apiClient from './client';
import type { Game, ApiResponse } from '../types';

export const gamesApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<ApiResponse<Game[]>>('/admin/games', { params }),

  getById: (id: string) =>
    apiClient.get<ApiResponse<Game>>(`/admin/games/${id}`),

  create: (data: FormData) =>
    apiClient.post<ApiResponse<Game>>('/admin/games', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  update: (id: string, data: FormData) =>
    apiClient.patch<ApiResponse<Game>>(`/admin/games/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

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
    return apiClient.post(`/admin/games/${id}/images`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
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
