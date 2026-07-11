'use client'

import { useRouter } from 'next/navigation'
import type { GameCategory } from '@/types'
import { CATEGORY_FA, CATEGORY_ICON } from '@/types'

const categories: { key: GameCategory; color: string }[] = [
  { key: 'ESCAPE_ROOM', color: 'border-[#00f5ff]/40 text-[#00f5ff] shadow-[inset_0_0_14px_rgba(0,245,255,0.18)]' },
  { key: 'CINEMA_HORROR', color: 'border-[#ff00e5]/40 text-[#ff00e5] shadow-[inset_0_0_14px_rgba(255,0,229,0.16)]' },
  { key: 'BOARD_GAME', color: 'border-[#b026ff]/40 text-[#b026ff] shadow-[inset_0_0_14px_rgba(176,38,255,0.18)]' },
  { key: 'LASER_TAG', color: 'border-[#00f5ff]/40 text-[#00f5ff] shadow-[inset_0_0_14px_rgba(0,245,255,0.18)]' },
  { key: 'VR', color: 'border-[#b026ff]/40 text-[#b026ff] shadow-[inset_0_0_14px_rgba(176,38,255,0.18)]' },
  { key: 'PAINTBALL', color: 'border-[#ff00e5]/40 text-[#ff00e5] shadow-[inset_0_0_14px_rgba(255,0,229,0.16)]' },
]

export default function CategoryFilter() {
  const router = useRouter()

  const handleClick = (category: GameCategory) => {
    router.push(`/games?category=${category}`)
  }

  return (
    <section className="overflow-hidden border-y border-white/10 bg-white/[0.02] py-5">
      <div className="flex w-max gap-4 [animation:marq_24s_linear_infinite] hover:[animation-play-state:paused]">
        {[...categories, ...categories].map(({ key, color }, index) => (
          <button
            key={`${key}-${index}`}
            onClick={() => handleClick(key)}
            className={`flex shrink-0 items-center gap-3 whitespace-nowrap rounded-full border bg-transparent px-6 py-2.5 font-cinzel text-sm font-bold transition-all hover:-translate-y-1 ${color}`}
          >
            <span className="text-lg">{CATEGORY_ICON[key]}</span>
            <span>{CATEGORY_FA[key]}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
