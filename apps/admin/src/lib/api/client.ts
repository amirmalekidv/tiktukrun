/**
 * TIK TAK RUN — Unified API Client (auth + admin routes)
 */
import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  type AxiosResponse,
} from 'axios';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from '../auth';

const API_ROOT = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(
  /\/api\/v1\/?$/,
  '',
);

export const apiClient = axios.create({
  baseURL: `${API_ROOT}/api/v1`,
  headers: { Accept: 'application/json' },
  timeout: 30000,
});

/** Admin-scoped routes under /api/v1/admin */
export const adminApi = axios.create({
  baseURL: `${API_ROOT}/api/v1/admin`,
  headers: { Accept: 'application/json' },
  timeout: 30000,
});

function attachAuth(config: InternalAxiosRequestConfig) {
  if (typeof window !== 'undefined') {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
}

apiClient.interceptors.request.use(attachAuth);
adminApi.interceptors.request.use(attachAuth);

let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: unknown) => void; reject: (e: unknown) => void }> = [];

function processQueue(error: unknown, token?: string) {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token);
  });
  failedQueue = [];
}

function installRefreshInterceptor(instance: AxiosInstance) {
  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error) => {
      const originalRequest = error.config;
      if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return instance(originalRequest);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          clearTokens();
          if (typeof window !== 'undefined') window.location.href = '/login';
          return Promise.reject(error);
        }

        try {
          const res = await axios.post(`${API_ROOT}/api/v1/auth/refresh`, { refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = res.data.data;
          setTokens(accessToken, newRefreshToken);
          processQueue(null, accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return instance(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, undefined);
          clearTokens();
          if (typeof window !== 'undefined') window.location.href = '/login';
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }
      return Promise.reject(error);
    },
  );
}

installRefreshInterceptor(apiClient);
installRefreshInterceptor(adminApi);

export const fetcher = async (url: string) => {
  const response = await apiClient.get(url);
  return response.data;
};

export default apiClient;
