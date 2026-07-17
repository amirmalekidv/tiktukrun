'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import useSWR from 'swr'
import { getGames } from '@/lib/api'
import type { GamesFilter } from '@/types'
import GameCard from '@/components/home/GameCard'
import GameFiltersSidebar from '@/components/games/GameFiltersSidebar'
import { GameCardSkeleton } from '@/components/ui/LoadingSkeleton'
import { toPersianDigits } from '@/lib/utils'

const gamesGridClassName =
  'grid grid-cols-[repeat(auto-fill,minmax(220px,248px))] justify-center gap-x-5 gap-y-9 sm:grid-cols-[repeat(auto-fill,minmax(236px,248px))] lg:justify-start'

function GamesContent() {
  const searchParams = useSearchParams()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)

  const filter: GamesFilter = {
    cityId: searchParams.get('cityId') || undefined,
    category: (searchParams.get('category') as any) || undefined,
    genre: (searchParams.get('genre') as any) || undefined,
    fearMin: searchParams.get('fearMin') ? Number(searchParams.get('fearMin')) : undefined,
    fearMax: searchParams.get('fearMax') ? Number(searchParams.get('fearMax')) : undefined,
    q: searchParams.get('q') || undefined,
    sortBy: (searchParams.get('sortBy') as any) || 'rating',
    sections: searchParams.get('sections') || undefined,
    limit: 100,
  }

  const cacheKey = JSON.stringify(filter)
  const { data, isLoading } = useSWR(['games', cacheKey], () => getGames(filter))

  const games = data?.data || []
  const total = data?.total || 0

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page header */}
        <div className="mb-8 text-center lg:text-right">
          <span className="font-cinzel text-xs font-bold text-[#00f5ff] glow-teal">EXPLORE</span>
          <h1 className="mt-3 font-cinzel font-black text-3xl md:text-4xl text-white mb-2">
            <span className="gradient-text">قلمرو</span> بازی‌ها
          </h1>
          <p className="text-gray-400">
            {isLoading ? '...' : `${toPersianDigits(total)} بازی یافت شد`}
          </p>
        </div>

        <div className="flex gap-6">
          {/* Sidebar - Desktop */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-24">
              <GameFiltersSidebar />
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Top toolbar */}
            <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
              {/* Mobile filter toggle */}
              <button
                className="lg:hidden flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-gray-300 transition-all hover:border-[#00f5ff]/50"
                onClick={() => setMobileFilterOpen(true)}
              >
                <i className="fas fa-sliders-h text-[#00f5ff]" />
                فیلتر
              </button>

              {/* Results count */}
              <span className="text-gray-400 text-sm hidden lg:block">
                {toPersianDigits(total)} نتیجه
              </span>

              {/* View mode */}
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'tab-active-dark' : 'text-gray-400 hover:text-white'}`}
                >
                  <i className="fas fa-th-large text-sm" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'tab-active-dark' : 'text-gray-400 hover:text-white'}`}
                >
                  <i className="fas fa-list text-sm" />
                </button>
              </div>
            </div>

            {/* Games grid/list */}
            {isLoading ? (
              viewMode === 'grid' ? (
                <div className={gamesGridClassName}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <GameCardSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <GameCardSkeleton key={i} variant="horizontal" />
                  ))}
                </div>
              )
            ) : games.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">😢</div>
                <h3 className="font-cinzel text-xl text-white mb-2">بازی‌ای یافت نشد</h3>
                <p className="text-gray-400 mb-6">فیلترها را تغییر دهید یا جستجوی جدیدی انجام دهید</p>
                <a href="/games" className="btn-blood">همه بازی‌ها</a>
              </div>
            ) : (
              viewMode === 'grid' ? (
                <div className={gamesGridClassName}>
                  {games.map((game) => (
                    <GameCard key={game.id} game={game} />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {games.map((game) => (
                    <GameCard
                      key={game.id}
                      game={game}
                      variant="horizontal"
                    />
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter overlay */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setMobileFilterOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-[#05070a]/95 overflow-y-auto backdrop-blur-xl">
            <div className="p-4 flex items-center justify-between border-b border-white/10">
              <h3 className="font-cinzel font-bold text-white">فیلترها</h3>
              <button onClick={() => setMobileFilterOpen(false)} className="text-gray-400 hover:text-white">
                <i className="fas fa-times text-xl" />
              </button>
            </div>
            <div className="p-4">
              <GameFiltersSidebar onClose={() => setMobileFilterOpen(false)} isMobile />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function GamesPage() {
  return (
    <div className="min-h-screen pt-24 pb-20">
      <Suspense fallback={
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className={gamesGridClassName}>
            {Array.from({ length: 6 }).map((_, i) => (
              <GameCardSkeleton key={i} />
            ))}
          </div>
        </div>
      }>
        <GamesContent />
      </Suspense>
    </div>
  )
}
