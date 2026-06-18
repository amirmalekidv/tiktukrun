'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function InviteCodePage({ params }: { params: { code: string } }) {
  const { code } = params
  const router = useRouter()

  useEffect(() => {
    router.replace(`/login?invite=${code}`)
  }, [code, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4 heartbeat inline-block">🎁</div>
        <h2 className="font-cinzel font-bold text-xl text-white mb-2">کد دعوت: <span className="blood-text">{code}</span></h2>
        <p className="text-gray-400">در حال انتقال...</p>
      </div>
    </div>
  )
}
