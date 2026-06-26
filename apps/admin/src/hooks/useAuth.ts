'use client'
import { useAuthStore } from '@/stores/authStore'
import { authApi } from '@/lib/api/auth'
import { can, getRoleLabel } from '@/lib/permissions'
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

// Module-level constant — not recreated on every render
const ADMIN_ROLES: AdminRole[] = ['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'SUPPORT', 'MARKETING']

export function useAuth() {
  const { user, isAuthenticated, isLoading, setAuth, logout, setLoading } = useAuthStore()

  const sendOtp = async (mobile: string) => {
    setLoading(true)
    try {
      const res = await authApi.sendOtp(mobile)
      if (res.success) {
        toast.success('کد تأیید ارسال شد')
        return true
      }
      toast.error(res.message || 'خطا در ارسال کد')
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
        if (!u.roles.some((r: AdminRole) => ADMIN_ROLES.includes(r))) {
          toast.error('شما دسترسی به پنل مدیریت ندارید')
          return false
        }
        setAuth(u, accessToken, refreshToken)
        toast.success('ورود موفق')
        return true
      }
      toast.error('کد وارد شده صحیح نیست')
      return false
    } catch {
      toast.error('خطا در تأیید کد')
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
        if (!u.roles.some((r: AdminRole) => ADMIN_ROLES.includes(r))) {
          toast.error('شما دسترسی به پنل مدیریت ندارید')
          return false
        }
        setAuth(u, accessToken, refreshToken)
        toast.success('ورود موفق')
        return true
      }
      toast.error('رمز عبور اشتباه است')
      return false
    } catch {
      toast.error('خطا در ورود')
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
