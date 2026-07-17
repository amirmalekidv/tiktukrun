import axios from 'axios'
import { mockApi, USE_MOCK } from '../mock-admin-api'
import { getAccessToken } from '../auth'

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(
  /\/api\/v1\/?$/,
  '',
)

/** Auth routes live under /api/v1/auth — NOT /api/v1/admin */
const authHttp = axios.create({
  baseURL: `${API_URL}/api/v1`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

authHttp.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

function unwrap<T>(res: { data: T & { data?: T } }): T {
  const body = res.data as T & { data?: T }
  return (body as { data?: T }).data ?? body
}

export const authApi = {
  sendOtp: (mobile: string) =>
    USE_MOCK
      ? mockApi.sendOtp(mobile)
      : authHttp.post('/auth/otp/request', { mobile }).then((r) => {
          const body = r.data as { success?: boolean; message?: string; data?: unknown }
          return {
            success: body.success ?? true,
            message: body.message,
            data: body.data,
          }
        }),

  verifyOtp: (mobile: string, code: string) =>
    USE_MOCK
      ? mockApi.verifyOtp(mobile, code)
      : authHttp.post('/auth/otp/verify', { mobile, code }).then((r) => unwrap(r)),

  loginWithPassword: (mobile: string, password: string) =>
    USE_MOCK
      ? mockApi.loginWithPassword(mobile, password)
      : authHttp.post('/auth/admin/login', { mobile, password }).then((r) => unwrap(r)),

  logout: () =>
    USE_MOCK
      ? Promise.resolve({ success: true })
      : authHttp.post('/auth/logout').then((r) => r.data),

  getMe: () =>
    USE_MOCK
      ? Promise.resolve({ success: true, data: null })
      : authHttp.get('/auth/me').then((r) => unwrap(r)),
}
