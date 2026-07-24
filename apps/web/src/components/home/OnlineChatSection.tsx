'use client'

import LiveChatPanel from '@/components/community/LiveChatPanel'

export default function OnlineChatSection() {
  return (
    <section className="py-8">
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
