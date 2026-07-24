'use client'

import LiveChatPanel from '@/components/community/LiveChatPanel'
import { useAuthStore } from '@/store/auth.store'

export default function OnlineChatSection() {
  const hasHydrated = useAuthStore((state) => state.hasHydrated)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  // Chat requires auth — never mount for guests (avoids 401 → login redirect).
  if (!hasHydrated || !isAuthenticated) {
    return null
  }

  return (
    <section className="py-8">
      <div className="border-t border-white/10 my-4" />
      <div className="mx-auto max-w-7xl px-4">
        <div className="section-header mb-8">
          <h2 className="text-center font-cinzel text-2xl font-black text-white">
            <span className="gradient-text">چت</span> آنلاین
          </h2>
        </div>

        <div className="mx-auto w-full max-w-3xl">
          <LiveChatPanel roomType="global" title="چت زنده" />
        </div>
      </div>
    </section>
  )
}
