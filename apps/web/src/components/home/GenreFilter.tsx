'use client'

import { useRouter } from 'next/navigation'

const genres = [
  { key: 'HORROR', label: 'ترسناک', icon: '👻', color: 'border-red-700/50 hover:border-red-500 bg-red-950/20' },
  { key: 'ADVENTURE', label: 'ماجراجویی', icon: '🗺️', color: 'border-green-700/50 hover:border-green-500 bg-green-950/20' },
  { key: 'MYSTERY', label: 'معمایی', icon: '🔍', color: 'border-blue-700/50 hover:border-blue-500 bg-blue-950/20' },
  { key: 'ACTION', label: 'اکشن', icon: '⚡', color: 'border-yellow-700/50 hover:border-yellow-500 bg-yellow-950/20' },
  { key: 'SCI_FI', label: 'علمی‌تخیلی', icon: '🚀', color: 'border-cyan-700/50 hover:border-cyan-500 bg-cyan-950/20' },
  { key: 'FANTASY', label: 'فانتزی', icon: '✨', color: 'border-purple-700/50 hover:border-purple-500 bg-purple-950/20' },
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
            className={`${genre.color} border rounded-full px-5 py-2 text-sm text-gray-200 hover:text-white transition-all duration-300 flex items-center gap-2`}
          >
            <span>{genre.icon}</span>
            {genre.label}
          </button>
        ))}
      </div>
    </section>
  )
}
