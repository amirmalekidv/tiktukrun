import apiClient from './client';
import type { Game, Review, ApiResponse } from '../types';

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

  toggleActive: (id: string) =>
    apiClient.patch(`/admin/games/${id}/toggle-active`),

  toggleFeatured: (id: string) =>
    apiClient.patch(`/admin/games/${id}/toggle-featured`),

  uploadImage: (id: string, file: File) => {
    const fd = new FormData();
    fd.append('image', file);
    return apiClient.post(`/admin/games/${id}/images`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deleteImage: (id: string, imageUrl: string) =>
    apiClient.delete(`/admin/games/${id}/images`, { data: { imageUrl } }),

  reorderImages: (id: string, images: string[]) =>
    apiClient.patch(`/admin/games/${id}/images/reorder`, { images }),

  getReviews: (id: string, params?: Record<string, unknown>) =>
    apiClient.get<ApiResponse<Review[]>>(`/admin/games/${id}/reviews`, { params }),

  getStats: (id: string) =>
    apiClient.get(`/admin/games/${id}/stats`),
};
