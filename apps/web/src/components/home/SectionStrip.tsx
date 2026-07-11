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
            <i className={`${icon} text-[#00f5ff]`} />
            <span className="gradient-text">{title}</span>
          </h2>
          <Link
            href={`/section/${sectionKey}`}
            className="flex items-center gap-1 text-sm text-[#00f5ff] transition-colors hover:text-white"
          >
            همه
            <i className="fas fa-chevron-left text-xs" />
          </Link>
        </div>

        {/* Horizontal scroll */}
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x snap-mandatory">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-64 dark-card rounded-[18px] h-52 skeleton snap-start" />
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
                    <article className="dark-card h-full overflow-hidden rounded-[18px] transition-all group-hover:-translate-y-1 group-hover:border-[#00f5ff]/50">
                      <div className="relative h-36 overflow-hidden">
                        <Image
                          src={coverImage}
                          alt={game.title}
                          fill
                          unoptimized={unoptimized}
                          className="object-cover transition duration-500 group-hover:scale-110"
                          sizes="256px"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#05070a] via-black/30 to-transparent" />
                        <div className="absolute top-2 right-2">
                          <FearMeter level={game.fearLevel} size="sm" />
                        </div>
                      </div>
                      <div className="p-3">
                        <h3 className="font-bold text-white text-sm mb-1 line-clamp-1">{game.title}</h3>
                        <div className="flex items-center justify-between">
                          <StarRating rating={game.rating} size="sm" />
                          <span className="price-tag text-xs">
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
