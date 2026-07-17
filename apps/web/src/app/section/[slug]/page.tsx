'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { getLandingSection } from '@/lib/api'
import CarouselRail from '@/components/home/CarouselRail'
import GameCard from '@/components/home/GameCard'
import { GameCardSkeleton } from '@/components/ui/LoadingSkeleton'
import { toPersianDigits } from '@/lib/utils'

const VERTICAL_LIST_SECTIONS = new Set(['popular-this-week'])

const SECTION_REDIRECTS: Record<string, string> = {
  stories: '/stories',
  leaderboard: '/leaderboard',
  wheel: '/wheel',
}

const POPULAR_GAMES_GRID_CLASSNAME =
  'grid grid-cols-[repeat(auto-fill,minmax(220px,248px))] justify-center gap-x-5 gap-y-9 sm:grid-cols-[repeat(auto-fill,minmax(236px,248px))] lg:justify-start'

export default function SectionPage({ params }: { params: { slug: string } }) {
  const { slug } = params
  const router = useRouter()
  const redirectTo = SECTION_REDIRECTS[slug]

  useEffect(() => {
    if (redirectTo) router.replace(redirectTo)
  }, [redirectTo, router])

  const { data: section, isLoading } = useSWR(
    redirectTo ? null : `landing-section-${slug}`,
    () => getLandingSection(slug)
  )

  if (redirectTo) return null

  const meta = section ?? { title: slug, description: 'بازی‌ها', icon: 'fas fa-gamepad' }
  const games = section?.games ?? []
  const isVerticalList = VERTICAL_LIST_SECTIONS.has(slug)

  return (
    <div className="min-h-screen pt-24">
      {/* Banner */}
      <div className="relative py-16 mb-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 to-bg-dark" />
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(rgba(0,245,255,0.5) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(0,245,255,0.5) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <div className="text-5xl mb-4">
            <i className={`${meta.icon} text-red-500`} />
          </div>
          <h1 className="font-cinzel font-black text-4xl md:text-5xl text-white mb-3 flicker">
            {meta.title}
          </h1>
          {meta.description && (
            <p className="text-gray-300 text-lg">{meta.description}</p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-20">
        <p className="mb-6 text-gray-400">
          {isLoading ? '...' : `${toPersianDigits(games.length)} بازی`}
        </p>

        {isLoading ? (
          isVerticalList ? (
            <div className={POPULAR_GAMES_GRID_CLASSNAME}>
              {Array.from({ length: 6 }).map((_, i) => (
                <GameCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <CarouselRail>
              {Array.from({ length: 6 }).map((_, i) => (
                <GameCardSkeleton key={i} />
              ))}
            </CarouselRail>
          )
        ) : games.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎮</div>
            <h3 className="font-cinzel text-xl text-white mb-2">بازی‌ای در این دسته موجود نیست</h3>
            <a href="/games" className="btn-blood mt-4 inline-block">همه بازی‌ها</a>
          </div>
        ) : isVerticalList ? (
          <div className={POPULAR_GAMES_GRID_CLASSNAME}>
            {games.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        ) : (
          <CarouselRail>
            {games.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </CarouselRail>
        )}
      </div>
    </div>
  )
}
