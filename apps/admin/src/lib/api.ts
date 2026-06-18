import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios'
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './auth'

// =============================================
// TIK TAK RUN Admin — Axios Instance
// =============================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export const api: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api/v1/admin`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// Request interceptor — attach token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — refresh token on 401
let isRefreshing = false
let failedQueue: Array<{ resolve: (v: unknown) => void; reject: (e: unknown) => void }> = []

function processQueue(error: unknown, token?: string) {
  failedQueue.forEach((p) => {
    if (error) p.reject(error)
    else p.resolve(token)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = getRefreshToken()
      if (!refreshToken) {
        clearTokens()
        if (typeof window !== 'undefined') window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        const res = await axios.post(`${API_URL}/api/v1/auth/refresh`, { refreshToken })
        const { accessToken, refreshToken: newRefreshToken } = res.data.data
        setTokens(accessToken, newRefreshToken)
        processQueue(null, accessToken)
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, undefined)
        clearTokens()
        if (typeof window !== 'undefined') window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api

// =============================================
// Bridge: re-export all domain API objects defined in ./api/index.ts
// (bookingsApi, gamesApi, fetcher, branchesApi, citiesApi, categoriesApi,
//  reviewsApi, chatsApi, ticketsApi, transactionsApi, paymentsApi, reportsApi,
//  backupApi, wheelApi, badgesApi, levelsApi, avatarsApi, discountsApi,
//  monthlyApi, settingsApi, rolesApi, staffApi, auditApi, apiClient ...)
// This resolves the `@/lib/api` file shadowing the `@/lib/api/` directory so
// that `import { gamesApi } from '@/lib/api'` continues to work everywhere.
// =============================================
export * from './api/index'
