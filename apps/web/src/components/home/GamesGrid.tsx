'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { getFeaturedGames } from '@/lib/api'
import GameCard from './GameCard'
import CarouselRail, { CarouselNavButtons } from './CarouselRail'
import { GameCardSkeleton } from '@/components/ui/LoadingSkeleton'

export default function GamesGrid() {
  const carouselId = 'featured-games-home'
  const { data: games, isLoading } = useSWR('featured-games', getFeaturedGames)

  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="text-center lg:text-right">
          <span className="font-cinzel text-xs font-bold text-[#f6d06b]">CURATED PICKS</span>
          <div className="mt-3 flex items-center justify-center gap-3 lg:justify-start">
            <h2 className="font-cinzel text-3xl font-black text-white">
              تجربه‌های <span className="gradient-text">تیک تاک ران</span>
            </h2>
            <CarouselNavButtons carouselId={carouselId} />
          </div>
          <p className="mt-3 text-sm text-[#9aa3b2]">
            کارت‌های فشرده‌تر، مرور سریع‌تر و جزئیات کامل فقط در تعامل.
          </p>
        </div>

        <div className="flex justify-center lg:justify-start">
          <Link
            href="/games"
            className="rounded-full border border-[#f6c453]/35 bg-[#0c111a]/80 px-5 py-2.5 text-sm font-bold text-[#f6d06b] transition-all hover:-translate-y-0.5 hover:border-[#f6c453]/70 hover:bg-[#111827]"
          >
            مشاهده همه بازی‌ها
            <i className="fas fa-chevron-left mr-2 text-xs" />
          </Link>
        </div>
      </div>

      {isLoading ? (
        <CarouselRail carouselId={carouselId} navigationPlacement="external">
          {Array.from({ length: 6 }).map((_, i) => (
            <GameCardSkeleton key={i} />
          ))}
        </CarouselRail>
      ) : (
        <CarouselRail carouselId={carouselId} navigationPlacement="external">
          {games?.slice(0, 9).map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </CarouselRail>
      )}

      <div className="mt-8 text-center">
        <Link href="/games" className="btn-blood px-10 py-3 text-base">
          <i className="fas fa-th-large ml-2" />
          مشاهده همه بازی‌ها
        </Link>
      </div>
    </section>
  )
}
