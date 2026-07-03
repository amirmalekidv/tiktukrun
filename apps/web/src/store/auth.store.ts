import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'
import { AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY, clearAuthTokens, setAuthTokens } from '@/lib/http'

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  hasHydrated: boolean
  setUser: (user: User | null) => void
  setAccessToken: (token: string | null) => void
  login: (user: User, token: string, refreshToken?: string) => void
  logout: () => void
  setLoading: (loading: boolean) => void
  setHydrated: (hydrated: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,
      hasHydrated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setAccessToken: (token) => set({ accessToken: token }),
      login: (user, token, refreshToken) => {
        set({ user, accessToken: token, isAuthenticated: true, isLoading: false })
        setAuthTokens(token, refreshToken)
      },
      logout: () => {
        set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false })
        clearAuthTokens()
      },
      setLoading: (isLoading) => set({ isLoading }),
      setHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: 'tiktakrun-auth',
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true)
      },
    }
  )
)
