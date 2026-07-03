'use client'

import { useEffect, useRef } from 'react'
import { getCurrentUser } from '@/lib/api'
import { normalizeAuthUser } from '@/lib/auth-user'
import { clearAuthTokens, getAccessToken, refreshAccessToken } from '@/lib/auth'
import { useAuthStore } from '@/store/auth.store'

export default function AuthBootstrap() {
  const hasHydrated = useAuthStore((state) => state.hasHydrated)
  const setUser = useAuthStore((state) => state.setUser)
  const setAccessToken = useAuthStore((state) => state.setAccessToken)
  const setLoading = useAuthStore((state) => state.setLoading)
  const bootstrappedRef = useRef(false)

  useEffect(() => {
    if (!hasHydrated || bootstrappedRef.current) return

    bootstrappedRef.current = true
    let cancelled = false

    const bootstrapAuth = async () => {
      setLoading(true)

      try {
        let accessToken = getAccessToken()

        if (!accessToken) {
          accessToken = await refreshAccessToken()
        }

        if (!accessToken) {
          clearAuthTokens()
          if (!cancelled) {
            setAccessToken(null)
            setUser(null)
          }
          return
        }

        const currentUser = await getCurrentUser()

        if (cancelled) return

        setAccessToken(accessToken)
        setUser(normalizeAuthUser(currentUser))
      } catch {
        clearAuthTokens()
        if (!cancelled) {
          setAccessToken(null)
          setUser(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void bootstrapAuth()

    return () => {
      cancelled = true
    }
  }, [hasHydrated, setAccessToken, setLoading, setUser])

  return null
}
