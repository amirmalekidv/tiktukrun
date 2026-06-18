import api from '../api'
import { mockApi, USE_MOCK } from '../mock-admin-api'

export const authApi = {
  sendOtp: (mobile: string) =>
    USE_MOCK ? mockApi.sendOtp(mobile) : api.post('/auth/otp/send', { mobile }).then(r => r.data),

  verifyOtp: (mobile: string, otp: string) =>
    USE_MOCK ? mockApi.verifyOtp(mobile, otp) : api.post('/auth/otp/verify', { mobile, otp }).then(r => r.data),

  loginWithPassword: (mobile: string, password: string) =>
    USE_MOCK ? mockApi.loginWithPassword(mobile, password) : api.post('/auth/login', { mobile, password }).then(r => r.data),

  logout: () =>
    USE_MOCK ? Promise.resolve({ success: true }) : api.post('/auth/logout').then(r => r.data),

  getMe: () =>
    USE_MOCK ? Promise.resolve({ success: true, data: null }) : api.get('/auth/me').then(r => r.data),
}
