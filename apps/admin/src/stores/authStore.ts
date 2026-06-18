import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AdminUser } from '@/types'
import { setTokens, clearTokens, saveAdminUser } from '@/lib/auth'

interface AuthState {
  user: AdminUser | null
  isAuthenticated: boolean
  isLoading: boolean
  
  setUser: (user: AdminUser) => void
  setAuth: (user: AdminUser, accessToken: string, refreshToken: string) => void
  logout: () => void
  setLoading: (v: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) => set({ user, isAuthenticated: true }),

      setAuth: (user, accessToken, refreshToken) => {
        setTokens(accessToken, refreshToken)
        saveAdminUser(user)
        set({ user, isAuthenticated: true })
      },

      logout: () => {
        clearTokens()
        set({ user: null, isAuthenticated: false })
      },

      setLoading: (v) => set({ isLoading: v }),
    }),
    {
      name: 'ttr-admin-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
)
