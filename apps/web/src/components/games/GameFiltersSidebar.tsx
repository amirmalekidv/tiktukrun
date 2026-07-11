'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import useSWR from 'swr'
import { getCities } from '@/lib/api'
import type { GameCategory, Genre } from '@/types'
import { CATEGORY_FA, GENRE_FA } from '@/types'

interface FiltersState {
  cityId: string
  category: string
  genre: string
  fearMin: number
  fearMax: number
  q: string
  sortBy: string
}

const CATEGORIES: GameCategory[] = ['CINEMA_HORROR', 'BOARD_GAME', 'MAFIA', 'LASER_TAG', 'ESCAPE_ROOM', 'VR', 'PAINTBALL']
const GENRES: Genre[] = ['HORROR', 'ADVENTURE', 'MYSTERY', 'ACTION', 'SCI_FI', 'FANTASY']

export default function GameFiltersSidebar({
  onClose,
  isMobile = false,
}: {
  onClose?: () => void
  isMobile?: boolean
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: cities = [] } = useSWR('cities', getCities)

  const [filters, setFilters] = useState<FiltersState>({
    cityId: searchParams.get('cityId') || '',
    category: searchParams.get('category') || '',
    genre: searchParams.get('genre') || '',
    fearMin: Number(searchParams.get('fearMin') || 0),
    fearMax: Number(searchParams.get('fearMax') || 5),
    q: searchParams.get('q') || '',
    sortBy: searchParams.get('sortBy') || 'rating',
  })

  const applyFilters = () => {
    const params = new URLSearchParams()
    if (filters.cityId) params.set('cityId', filters.cityId)
    if (filters.category) params.set('category', filters.category)
    if (filters.genre) params.set('genre', filters.genre)
    if (filters.fearMin > 0) params.set('fearMin', String(filters.fearMin))
    if (filters.fearMax < 5) params.set('fearMax', String(filters.fearMax))
    if (filters.q) params.set('q', filters.q)
    if (filters.sortBy) params.set('sortBy', filters.sortBy)
    router.push(`/games?${params.toString()}`)
    onClose?.()
  }

  const resetFilters = () => {
    setFilters({ cityId: '', category: '', genre: '', fearMin: 0, fearMax: 5, q: '', sortBy: 'rating' })
    router.push('/games')
    onClose?.()
  }

  return (
    <div className="dark-card overflow-hidden rounded-[18px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 p-4">
        <h3 className="font-cinzel font-bold text-white flex items-center gap-2">
          <i className="fas fa-sliders-h text-[#00f5ff]" />
          فیلترها
        </h3>
        <button onClick={resetFilters} className="text-[#00f5ff] hover:text-white text-xs transition-colors">
          پاک کردن همه
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* Search */}
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            <i className="fas fa-search text-[#00f5ff] ml-1" />
            جستجو
          </label>
          <input
            type="text"
            value={filters.q}
            onChange={(e) => setFilters({ ...filters, q: e.target.value })}
            placeholder="نام بازی..."
            className="input-gothic text-sm"
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
          />
        </div>

        {/* City */}
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            <i className="fas fa-map-marker-alt text-[#00f5ff] ml-1" />
            شهر
          </label>
          <select
            value={filters.cityId}
            onChange={(e) => setFilters({ ...filters, cityId: e.target.value })}
            className="input-gothic text-sm appearance-none"
          >
            <option value="">همه شهرها</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>{city.name}</option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            <i className="fas fa-th-large text-[#00f5ff] ml-1" />
            دسته‌بندی
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="category"
                value=""
                checked={filters.category === ''}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="accent-[#00f5ff]"
              />
              <span className="text-gray-300 text-sm group-hover:text-white transition-colors">همه</span>
            </label>
            {CATEGORIES.map((cat) => (
              <label key={cat} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name="category"
                  value={cat}
                  checked={filters.category === cat}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="accent-[#00f5ff]"
                />
                <span className="text-gray-300 text-sm group-hover:text-white transition-colors">
                  {CATEGORY_FA[cat]}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Genre */}
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            <i className="fas fa-theater-masks text-[#00f5ff] ml-1" />
            ژانر
          </label>
          <div className="grid grid-cols-2 gap-2">
            {GENRES.map((genre) => (
              <button
                key={genre}
                onClick={() => setFilters({ ...filters, genre: filters.genre === genre ? '' : genre })}
                className={`text-xs py-2 px-3 rounded-lg border transition-all ${
                  filters.genre === genre
                    ? 'border-[#00f5ff] bg-[#00f5ff]/10 text-[#00f5ff]'
                    : 'border-white/10 bg-transparent text-gray-400 hover:border-[#b026ff]/50'
                }`}
              >
                {GENRE_FA[genre]}
              </button>
            ))}
          </div>
        </div>

        {/* Fear level slider */}
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            <span className="text-base">💀</span> سطح ترس: {filters.fearMin} تا {filters.fearMax}
          </label>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>حداقل</span>
                <span>{filters.fearMin}</span>
              </div>
              <input
                type="range"
                min={0}
                max={5}
                value={filters.fearMin}
                onChange={(e) => setFilters({ ...filters, fearMin: Number(e.target.value) })}
                className="w-full accent-[#00f5ff]"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>حداکثر</span>
                <span>{filters.fearMax}</span>
              </div>
              <input
                type="range"
                min={0}
                max={5}
                value={filters.fearMax}
                onChange={(e) => setFilters({ ...filters, fearMax: Number(e.target.value) })}
                className="w-full accent-[#00f5ff]"
              />
            </div>
          </div>
          <div className="flex justify-between mt-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <span key={i} className={`text-lg ${i <= filters.fearMax && i >= filters.fearMin ? 'opacity-100' : 'opacity-20'}`}>
                💀
              </span>
            ))}
          </div>
        </div>

        {/* Sort */}
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            <i className="fas fa-sort text-[#00f5ff] ml-1" />
            مرتب‌سازی
          </label>
          <select
            value={filters.sortBy}
            onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
            className="input-gothic text-sm appearance-none"
          >
            <option value="rating">بیشترین امتیاز</option>
            <option value="price">کمترین قیمت</option>
            <option value="newest">جدیدترین</option>
            <option value="popularity">محبوب‌ترین</option>
          </select>
        </div>

        {/* Apply button */}
        <button onClick={applyFilters} className="btn-blood w-full py-3 text-sm">
          <i className="fas fa-check ml-2" />
          اعمال فیلتر
        </button>
      </div>
    </div>
  )
}
