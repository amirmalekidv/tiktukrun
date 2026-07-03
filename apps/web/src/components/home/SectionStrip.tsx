'use client'

import Link from 'next/link'
import Image from 'next/image'
import useSWR from 'swr'
import { getGamesBySection } from '@/lib/api'
import { GAME_COVER_PLACEHOLDER, shouldBypassImageOptimization } from '@/lib/games'
import { formatToman } from '@/lib/utils'
import FearMeter from '@/components/ui/FearMeter'
import StarRating from '@/components/ui/StarRating'

interface SectionStripProps {
  sectionKey: string
  title: string
  icon?: string
}

export default function SectionStrip({ sectionKey, title, icon = 'fas fa-star' }: SectionStripProps) {
  const { data: games = [], isLoading } = useSWR(
    `section-${sectionKey}`,
    () => getGamesBySection(sectionKey)
  )

  if (!isLoading && games.length === 0) return null

  return (
    <section className="py-10">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-cinzel font-bold text-xl text-white flex items-center gap-2">
            <i className={`${icon} text-red-500`} />
            <span className="blood-text">{title}</span>
          </h2>
          <Link
            href={`/section/${sectionKey}`}
            className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1 transition-colors"
          >
            همه
            <i className="fas fa-chevron-left text-xs" />
          </Link>
        </div>

        {/* Horizontal scroll */}
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x snap-mandatory">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-64 dark-card rounded-xl h-52 skeleton snap-start" />
              ))
            : games.map((game) => {
                const coverImage = game.coverImage || game.images[0]?.url || GAME_COVER_PLACEHOLDER
                const unoptimized = shouldBypassImageOptimization(coverImage)

                return (
                  <Link
                    key={game.id}
                    href={`/games/${game.slug}`}
                    className="flex-shrink-0 w-64 snap-start group"
                  >
                    <article className="dark-card rounded-xl overflow-hidden h-full">
                      <div className="relative h-36 overflow-hidden">
                        <Image
                          src={coverImage}
                          alt={game.title}
                          fill
                          unoptimized={unoptimized}
                          className="object-cover group-hover:scale-110 transition duration-500"
                          sizes="256px"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                        <div className="absolute top-2 right-2">
                          <FearMeter level={game.fearLevel} size="sm" />
                        </div>
                      </div>
                      <div className="p-3">
                        <h3 className="font-bold text-white text-sm mb-1 line-clamp-1">{game.title}</h3>
                        <div className="flex items-center justify-between">
                          <StarRating rating={game.rating} size="sm" />
                          <span className="text-yellow-400 font-bold text-xs">
                            {formatToman(game.basePrice)}ت
                          </span>
                        </div>
                      </div>
                    </article>
                  </Link>
                )
              })}
        </div>
      </div>
    </section>
  )
}
