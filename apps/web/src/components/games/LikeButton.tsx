'use client'

import { useState, useEffect } from 'react'
import { toggleGameLike, getGameLikeStatus } from '@/lib/api'
import { AUTH_TOKEN_KEY } from '@/lib/http'
import { toPersianDigits } from '@/lib/utils'

export default function LikeButton({
  gameId,
  initialCount = 0,
  initialLiked = false,
  size = 'md',
}: {
  gameId: string
  initialCount?: number
  initialLiked?: boolean
  size?: 'sm' | 'md' | 'lg'
}) {
  const [count, setCount] = useState(initialCount)
  const [liked, setLiked] = useState(initialLiked)
  const [busy, setBusy] = useState(false)
  const [bump, setBump] = useState(false)

  // Sync the like status from the server on mount (likedByMe needs auth)
  useEffect(() => {
    let active = true
    getGameLikeStatus(gameId)
      .then((s) => {
        if (!active) return
        setCount(s.likesCount ?? initialCount)
        setLiked(Boolean(s.likedByMe))
      })
      .catch(() => {})
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId])

  const handleClick = async () => {
    if (busy) return
    const isLoggedIn =
      typeof localStorage !== 'undefined' && !!localStorage.getItem(AUTH_TOKEN_KEY)
    if (!isLoggedIn) {
      if (typeof window !== 'undefined') window.location.href = '/login'
      return
    }
    setBusy(true)
    // Optimistic update
    const prevLiked = liked
    const prevCount = count
    setLiked(!prevLiked)
    setCount(prevCount + (prevLiked ? -1 : 1))
    setBump(true)
    setTimeout(() => setBump(false), 300)
    try {
      const res = await toggleGameLike(gameId)
      setLiked(Boolean(res.likedByMe))
      setCount(res.likesCount ?? prevCount)
    } catch {
      // revert on failure
      setLiked(prevLiked)
      setCount(prevCount)
    } finally {
      setBusy(false)
    }
  }

  const sizing =
    size === 'sm'
      ? 'text-xs px-3 py-1.5 gap-1.5'
      : size === 'lg'
      ? 'text-base px-6 py-3 gap-2'
      : 'text-sm px-4 py-2 gap-2'

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      aria-pressed={liked}
      className={`inline-flex items-center rounded-full font-bold border transition-all ${sizing} ${
        liked
          ? 'bg-[#ff00e5]/15 border-[#ff00e5]/50 text-[#ff00e5]'
          : 'bg-white/[0.04] border-white/10 text-gray-300 hover:border-[#00f5ff]/50 hover:text-[#00f5ff]'
      } ${busy ? 'opacity-70 cursor-wait' : ''}`}
      title={liked ? 'لغو پسند' : 'پسندیدن این بازی'}
    >
      <i
        className={`${liked ? 'fas' : 'far'} fa-heart transition-transform ${
          bump ? 'scale-150' : 'scale-100'
        } ${liked ? 'text-[#ff00e5]' : ''}`}
      />
      <span>{toPersianDigits(count)}</span>
    </button>
  )
}
