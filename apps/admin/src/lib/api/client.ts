/**
 * TIK TAK RUN — API Client
 * کلاینت مرکزی برای ارتباط با Backend
 */

import axios from 'axios';
import { getAccessToken, clearTokens } from '../auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const apiClient = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor — add JWT token
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      // Prefer the canonical token (lib/auth.ts), fall back to legacy key.
      const token = getAccessToken() || localStorage.getItem('admin_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        clearTokens();
        localStorage.removeItem('admin_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// SWR fetcher
export const fetcher = async (url: string) => {
  const response = await apiClient.get(url);
  return response.data;
};

export default apiClient;
