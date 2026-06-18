import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: User | null) => void
  setAccessToken: (token: string | null) => void
  login: (user: User, token: string) => void
  logout: () => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setAccessToken: (token) => set({ accessToken: token }),
      login: (user, token) => {
        set({ user, accessToken: token, isAuthenticated: true })
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('tiktakrun_access_token', token)
        }
      },
      logout: () => {
        set({ user: null, accessToken: null, isAuthenticated: false })
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('tiktakrun_access_token')
        }
      },
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'tiktakrun-auth',
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken, isAuthenticated: state.isAuthenticated }),
    }
  )
)
