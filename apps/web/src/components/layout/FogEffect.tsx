'use client'

import { useEffect, useState } from 'react'

const STAR_COUNT = 24

export default function FogEffect() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) return

    let cancelled = false
    const enable = () => {
      if (!cancelled) setEnabled(true)
    }

    let idleId: number | undefined
    let timeoutId: number | undefined

    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(enable, { timeout: 800 })
    } else {
      timeoutId = window.setTimeout(enable, 200)
    }

    return () => {
      cancelled = true
      if (idleId !== undefined && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId)
      }
      if (timeoutId !== undefined) clearTimeout(timeoutId)
    }
  }, [])

  if (!enabled) return null

  const stars = Array.from({ length: STAR_COUNT }, (_, i) => ({
    top: `${(i * 37) % 100}%`,
    left: `${(i * 61) % 100}%`,
    delay: `${(i % 11) * 0.35}s`,
    scale: 0.55 + (i % 5) * 0.28,
  }))

  return (
    <div className="stars" aria-hidden="true">
      {stars.map((star, i) => (
        <span
          key={i}
          className="star"
          style={{
            top: star.top,
            left: star.left,
            animationDelay: star.delay,
            transform: `scale(${star.scale})`,
          }}
        />
      ))}
    </div>
  )
}
