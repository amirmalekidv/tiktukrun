'use client'

import { TIER_STYLE, type GameTier } from '@/types'

export default function TierBadge({
  tier,
  size = 'md',
}: {
  tier?: GameTier | null
  size?: 'sm' | 'md' | 'lg'
}) {
  if (!tier) return null
  const style = TIER_STYLE[tier]
  if (!style) return null

  const sizing =
    size === 'sm'
      ? 'text-xs px-2 py-0.5 gap-1'
      : size === 'lg'
      ? 'text-sm px-4 py-1.5 gap-2'
      : 'text-xs px-3 py-1 gap-1.5'

  return (
    <span
      className={`inline-flex items-center rounded-full font-bold border ${sizing}`}
      style={{ color: style.color, background: style.bg, borderColor: style.color + '55' }}
      title={`سطح بازی: ${style.label}`}
    >
      <span>{style.icon}</span>
      <span>{style.label}</span>
    </span>
  )
}
