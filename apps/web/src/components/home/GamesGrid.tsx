'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { getFeaturedGames } from '@/lib/api'
import GameCard from './GameCard'
import { GameCardSkeleton } from '@/components/ui/LoadingSkeleton'

export default function GamesGrid() {
  const { data: games, isLoading } = useSWR('featured-games', getFeaturedGames)

  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      {/* Header */}
      <div className="mb-10 text-center">
        <span className="font-cinzel text-xs font-bold text-[#00f5ff] glow-teal">EXPLORE</span>
        <div className="section-header mt-3">
          <h2 className="font-cinzel text-3xl font-black text-white">
            تجربه‌های <span className="gradient-text">تیک تاک ران</span>
          </h2>
        </div>
        <p className="mt-3 text-sm text-[#9aa3b2]">از میان تجربه‌های هیجان‌انگیز، ماجراجویی بعدی خود را انتخاب کن</p>
        <Link
          href="/games"
          className="btn-ghost mt-6 px-5 py-2 text-sm"
        >
          همه بازی‌ها
          <i className="fas fa-chevron-left mr-1 text-xs" />
        </Link>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <GameCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {games?.slice(0, 9).map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      )}

      {/* CTA */}
      <div className="text-center mt-10">
        <Link href="/games" className="btn-blood px-10 py-3 text-base">
          <i className="fas fa-th-large ml-2" />
          مشاهده همه بازی‌ها
        </Link>
      </div>
    </section>
  )
}
