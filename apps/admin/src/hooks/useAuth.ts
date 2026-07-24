'use client'
import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'
import { authApi } from '@/lib/api/auth'
import { getAccessToken } from '@/lib/auth'
import { can } from '@/lib/permissions'
import toast from 'react-hot-toast'
import type { AdminUser, AdminRole } from '@/types'

interface AuthResponse {
  user: AdminUser
  accessToken: string
  refreshToken: string
}

function isAuthResponse(data: unknown): data is AuthResponse {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>
  return (
    d.user !== null && typeof d.user === 'object' &&
    typeof d.accessToken === 'string' &&
    typeof d.refreshToken === 'string'
  )
}

function getAuthErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const body = err.response?.data as {
      error?: { message?: string }
      message?: string | string[]
    } | undefined
    const msg = body?.error?.message ?? body?.message
    if (typeof msg === 'string') return msg
    if (Array.isArray(msg) && msg[0]) return msg[0]
    if (!err.response) {
      return 'سرور در دسترس نیست. MongoDB و API را بررسی کنید'
    }
  }
  return fallback
}

function getAdminRoles(user: AdminUser & { roleAssignments?: { role: AdminRole }[] }): AdminRole[] {
  if (Array.isArray(user.roles) && user.roles.length > 0) return user.roles
  return (user.roleAssignments ?? []).map((r) => r.role)
}

// Module-level constant — not recreated on every render
const ADMIN_ROLES: AdminRole[] = ['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'SUPPORT', 'MARKETING']

export function useAuth() {
  const { user, isAuthenticated, isLoading, setAuth, setUser, logout, setLoading } = useAuthStore()

  /** Drop any previous admin identity before accepting a new login. */
  const clearPreviousSession = async () => {
    const previous = useAuthStore.getState()
    try {
      if (previous.isAuthenticated || previous.user || getAccessToken()) {
        await authApi.logout()
      }
    } catch {
      // Ignore — previous session may already be invalid
    }
    previous.logout()
  }

  /** Prefer /auth/me as the source of truth after tokens are set. */
  const refreshIdentity = async (fallbackUser: AdminUser) => {
    try {
      const me = await authApi.getMe()
      if (me && typeof me === 'object') {
        setUser(me as AdminUser)
        return
      }
    } catch {
      // Login response user is already in the store via setAuth
    }
    setUser(fallbackUser)
  }

  const sendOtp = async (mobile: string) => {
    setLoading(true)
    try {
      const res = await authApi.sendOtp(mobile)
      const success = res && typeof res === 'object' && 'success' in res
        ? Boolean((res as { success?: boolean }).success)
        : true
      if (success) {
        toast.success('کد تأیید ارسال شد')
        return true
      }
      toast.error((res as { message?: string }).message || 'خطا در ارسال کد')
      return false
    } catch {
      toast.error('خطا در ارسال کد')
      return false
    } finally {
      setLoading(false)
    }
  }

  const verifyOtp = async (mobile: string, otp: string) => {
    setLoading(true)
    try {
      const payload = await authApi.verifyOtp(mobile, otp) as AuthResponse | { data?: AuthResponse }
      const data = 'accessToken' in (payload as AuthResponse)
        ? (payload as AuthResponse)
        : (payload as { data?: AuthResponse }).data
      if (data && isAuthResponse(data)) {
        const { user: u, accessToken, refreshToken } = data
        if (!getAdminRoles(u).some((r) => ADMIN_ROLES.includes(r))) {
          toast.error('شما دسترسی به پنل مدیریت ندارید')
          return false
        }
        await clearPreviousSession()
        setAuth(u, accessToken, refreshToken)
        await refreshIdentity(u)
        toast.success('ورود موفق')
        return true
      }
      toast.error('کد وارد شده صحیح نیست')
      return false
    } catch (err) {
      toast.error(getAuthErrorMessage(err, 'خطا در تأیید کد'))
      return false
    } finally {
      setLoading(false)
    }
  }

  const loginWithPassword = async (mobile: string, password: string) => {
    setLoading(true)
    try {
      const payload = await authApi.loginWithPassword(mobile, password) as AuthResponse | { data?: AuthResponse }
      const data = 'accessToken' in (payload as AuthResponse)
        ? (payload as AuthResponse)
        : (payload as { data?: AuthResponse }).data
      if (data && isAuthResponse(data)) {
        const { user: u, accessToken, refreshToken } = data
        if (!getAdminRoles(u).some((r) => ADMIN_ROLES.includes(r))) {
          toast.error('شما دسترسی به پنل مدیریت ندارید')
          return false
        }
        await clearPreviousSession()
        setAuth(u, accessToken, refreshToken)
        await refreshIdentity(u)
        toast.success('ورود موفق')
        return true
      }
      toast.error('رمز عبور اشتباه است')
      return false
    } catch (err) {
      toast.error(getAuthErrorMessage(err, 'خطا در ورود'))
      return false
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch {}
    logout()
    toast.success('خروج از سیستم')
  }

  const canDo = (permission: string) => can(user, permission)

  return {
    user,
    isAuthenticated,
    isLoading,
    sendOtp,
    verifyOtp,
    loginWithPassword,
    logout: handleLogout,
    can: canDo,
  }
}
