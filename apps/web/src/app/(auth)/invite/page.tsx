'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function InviteRedirect() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const code = searchParams.get('code')

  useEffect(() => {
    if (code) {
      router.replace(`/login?invite=${code}`)
    } else {
      router.replace('/login')
    }
  }, [code, router])

  return (
    <div className="dark-card rounded-2xl p-8 text-center">
      <div className="text-5xl mb-4">🎁</div>
      <h2 className="font-cinzel font-bold text-xl text-white mb-2">کد دعوت شما آماده است!</h2>
      <p className="text-gray-400">در حال انتقال به صفحه ورود...</p>
    </div>
  )
}

export default function InvitePage() {
  return (
    <Suspense fallback={<div className="dark-card rounded-2xl p-8 h-48 skeleton" />}>
      <InviteRedirect />
    </Suspense>
  )
}
