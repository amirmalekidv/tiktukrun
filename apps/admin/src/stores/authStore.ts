import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { apiClient } from '@/lib/api/client'
import type { AdminUser } from '@/types'
import {
  clearTokens,
  getAccessToken,
  getAdminUser,
  getRefreshToken,
  isTokenExpired,
  saveAdminUser,
  setTokens,
} from '@/lib/auth'
import { DEFAULT_ROLE_PERMISSIONS } from '@tiktakrun/shared-types'

interface AuthState {
  user: AdminUser | null
  isAuthenticated: boolean
  isLoading: boolean
  hasHydrated: boolean
  
  setUser: (user: AdminUser) => void
  setAuth: (user: AdminUser, accessToken: string, refreshToken: string) => void
  logout: () => void
  setLoading: (v: boolean) => void
  setHasHydrated: (v: boolean) => void
  restoreSession: () => Promise<boolean>
}

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'SUPPORT', 'MARKETING'] as const

function normalizeAdminUser(value: unknown): AdminUser | null {
  if (!value || typeof value !== 'object') return null

  const record = value as Record<string, unknown>
  const roleAssignments = Array.isArray(record.roleAssignments) ? record.roleAssignments : []
  const rawRoles = Array.isArray(record.roles)
    ? record.roles
    : roleAssignments
        .map((assignment) =>
          assignment && typeof assignment === 'object'
            ? (assignment as { role?: unknown }).role
            : null,
        )

  const roles = rawRoles.filter(
    (role): role is AdminUser['roles'][number] => typeof role === 'string',
  )

  if (!record.id || typeof record.id !== 'string' || roles.length === 0) return null

  const permissions = Array.isArray(record.permissions)
    ? record.permissions.filter((permission): permission is string => typeof permission === 'string')
    : roles.includes('SUPER_ADMIN')
      ? ['*', ...Object.values(DEFAULT_ROLE_PERMISSIONS).flat()]
      : Array.from(
          new Set(
            roles.flatMap((role) => DEFAULT_ROLE_PERMISSIONS[role] ?? []),
          ),
        )

  const managedBranches = Array.isArray(record.managedBranches) ? record.managedBranches : []
  const branchIds = Array.isArray(record.branchIds)
    ? record.branchIds.filter((branchId): branchId is string => typeof branchId === 'string')
    : managedBranches
        .map((branch) =>
          branch && typeof branch === 'object' ? (branch as { id?: unknown }).id : null,
        )
        .filter((branchId): branchId is string => typeof branchId === 'string')

  const branch =
    typeof record.branch === 'string'
      ? record.branch
      : managedBranches
          .map((branchItem) =>
            branchItem && typeof branchItem === 'object'
              ? (branchItem as { name?: unknown }).name
              : null,
          )
          .find((name): name is string => typeof name === 'string')

  return {
    id: record.id,
    name:
      typeof record.name === 'string'
        ? record.name
        : typeof record.fullName === 'string'
          ? record.fullName
          : '',
    email: typeof record.email === 'string' ? record.email : '',
    mobile: typeof record.mobile === 'string' ? record.mobile : '',
    avatar:
      typeof record.avatar === 'string'
        ? record.avatar
        : typeof record.avatarUrl === 'string'
          ? record.avatarUrl
          : undefined,
    roles,
    permissions,
    branch,
    branchIds,
    createdAt: typeof record.createdAt === 'string' ? record.createdAt : new Date().toISOString(),
    lastLoginAt: typeof record.lastLoginAt === 'string' ? record.lastLoginAt : undefined,
  }
}

function hasAdminRole(user: AdminUser): boolean {
  return user.roles.some((role) => ADMIN_ROLES.includes(role as (typeof ADMIN_ROLES)[number]))
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      hasHydrated: false,

      setUser: (user) => {
        saveAdminUser(user)
        set({ user, isAuthenticated: true })
      },

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

      setHasHydrated: (v) => set({ hasHydrated: v }),

      restoreSession: async () => {
        if (typeof window === 'undefined') return false

        const accessToken = getAccessToken()
        const refreshToken = getRefreshToken()
        const storedUser = normalizeAdminUser(get().user) ?? normalizeAdminUser(getAdminUser())

        if (!accessToken && !refreshToken) {
          clearTokens()
          set({ user: null, isAuthenticated: false, isLoading: false })
          return false
        }

        if (accessToken && !isTokenExpired(accessToken, 30_000) && storedUser && hasAdminRole(storedUser)) {
          saveAdminUser(storedUser)
          set({ user: storedUser, isAuthenticated: true, isLoading: false })
          return true
        }

        set({ isLoading: true })
        try {
          const response = await apiClient.get('/auth/me')
          const user = normalizeAdminUser(
            (response.data as { data?: unknown })?.data ?? response.data,
          )

          if (!user || !hasAdminRole(user)) {
            clearTokens()
            set({ user: null, isAuthenticated: false, isLoading: false })
            return false
          }

          saveAdminUser(user)
          set({ user, isAuthenticated: true, isLoading: false })
          return true
        } catch {
          clearTokens()
          set({ user: null, isAuthenticated: false, isLoading: false })
          return false
        }
      },
    }),
    {
      name: 'ttr-admin-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
