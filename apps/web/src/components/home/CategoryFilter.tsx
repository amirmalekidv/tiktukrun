'use client'

import { useRouter } from 'next/navigation'
import type { GameCategory } from '@/types'
import { CATEGORY_FA, CATEGORY_ICON } from '@/types'

const categories: { key: GameCategory; color: string }[] = [
  { key: 'ESCAPE_ROOM', color: 'from-red-900 to-red-950 border-red-700/40 hover:border-red-500' },
  { key: 'CINEMA_HORROR', color: 'from-purple-900 to-purple-950 border-purple-700/40 hover:border-purple-500' },
  { key: 'BOARD_GAME', color: 'from-blue-900 to-blue-950 border-blue-700/40 hover:border-blue-500' },
  { key: 'LASER_TAG', color: 'from-green-900 to-green-950 border-green-700/40 hover:border-green-500' },
  { key: 'VR', color: 'from-cyan-900 to-cyan-950 border-cyan-700/40 hover:border-cyan-500' },
  { key: 'PAINTBALL', color: 'from-yellow-900 to-yellow-950 border-yellow-700/40 hover:border-yellow-500' },
]

export default function CategoryFilter() {
  const router = useRouter()

  const handleClick = (category: GameCategory) => {
    router.push(`/games?category=${category}`)
  }

  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      {/* Section header */}
      <div className="section-header mb-8">
        <h2 className="font-cinzel font-bold text-2xl text-white text-center">
          <span className="blood-text">دسته‌بندی</span> سرگرمی‌ها
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {categories.map(({ key, color }) => (
          <button
            key={key}
            onClick={() => handleClick(key)}
            className={`bg-gradient-to-b ${color} border rounded-2xl p-5 flex flex-col items-center gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-red-950/50 cursor-pointer group`}
          >
            <span className="text-4xl group-hover:scale-110 transition-transform duration-300">
              {CATEGORY_ICON[key]}
            </span>
            <span className="text-white font-medium text-sm text-center leading-tight">
              {CATEGORY_FA[key]}
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}
