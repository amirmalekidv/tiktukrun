'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { getFeaturedGames } from '@/lib/api'
import GameCard from './GameCard'
import { GameCardSkeleton } from '@/components/ui/LoadingSkeleton'

export default function GamesGrid() {
  const { data: games, isLoading } = useSWR('featured-games', getFeaturedGames)

  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="section-header flex-1">
          <h2 className="font-cinzel font-bold text-2xl text-white">
            <span className="blood-text">برترین</span> تجربه‌ها
          </h2>
        </div>
        <Link
          href="/games"
          className="btn-ghost text-sm py-2 px-4 flex-shrink-0 mr-4"
        >
          همه بازی‌ها
          <i className="fas fa-chevron-left mr-1 text-xs" />
        </Link>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => <GameCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games?.slice(0, 9).map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      )}

      {/* CTA */}
      <div className="text-center mt-10">
        <Link href="/games" className="btn-blood text-base px-10 py-3">
          <i className="fas fa-th-large ml-2" />
          مشاهده همه بازی‌ها
        </Link>
      </div>
    </section>
  )
}
