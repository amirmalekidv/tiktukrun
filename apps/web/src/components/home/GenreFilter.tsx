'use client'

import { useRouter } from 'next/navigation'

const genres = [
  { key: 'HORROR', label: 'ترسناک', icon: '👻', color: 'border-[#ff00e5]/40 text-[#ff00e5]' },
  { key: 'ADVENTURE', label: 'ماجراجویی', icon: '🗺️', color: 'border-[#2ee6a0]/40 text-[#2ee6a0]' },
  { key: 'MYSTERY', label: 'معمایی', icon: '🔍', color: 'border-[#00f5ff]/40 text-[#00f5ff]' },
  { key: 'ACTION', label: 'اکشن', icon: '⚡', color: 'border-[#ffd700]/40 text-[#ffd700]' },
  { key: 'SCI_FI', label: 'علمی‌تخیلی', icon: '🚀', color: 'border-[#00f5ff]/40 text-[#00f5ff]' },
  { key: 'FANTASY', label: 'فانتزی', icon: '✨', color: 'border-[#b026ff]/40 text-[#b026ff]' },
]

export default function GenreFilter() {
  const router = useRouter()

  return (
    <section className="max-w-7xl mx-auto px-4 py-4">
      <div className="flex flex-wrap gap-3 justify-center">
        {genres.map((genre) => (
          <button
            key={genre.key}
            onClick={() => router.push(`/games?genre=${genre.key}`)}
            className={`${genre.color} flex items-center gap-2 rounded-full border bg-white/[0.03] px-5 py-2 text-sm font-medium shadow-[inset_0_0_14px_rgba(255,255,255,0.03)] transition-all duration-300 hover:-translate-y-1 hover:text-white`}
          >
            <span>{genre.icon}</span>
            {genre.label}
          </button>
        ))}
      </div>
    </section>
  )
}
