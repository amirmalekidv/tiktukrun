'use client'

import type { CSSProperties } from 'react'
import { TIER_STYLE, type GameTier } from '@/types'

export default function TierBadge({
  tier,
  size = 'md',
}: {
  tier?: GameTier | null
  size?: 'sm' | 'md' | 'lg'
}) {
  if (!tier) return null
  const tierKey = tier.toUpperCase() as GameTier
  const style = TIER_STYLE[tierKey]
  if (!style) return null

  const sizing =
    size === 'sm'
      ? 'text-xs px-2 py-0.5 gap-1'
      : size === 'lg'
      ? 'text-sm px-4 py-1.5 gap-2'
      : 'text-xs px-3 py-1 gap-1.5'
  const toneStyle: CSSProperties = {
    color: style.color,
    textShadow: style.shine ? `0 0 8px ${style.color}55` : undefined,
  }

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border font-bold ${sizing}`}
      style={{ background: style.bg, borderColor: style.color + '55' }}
      title={`سطح بازی: ${style.label}`}
    >
      <i className={`fas ${style.icon}`} style={toneStyle} aria-hidden="true" />
      <span style={toneStyle}>{style.label}</span>
    </span>
  )
}
