'use client'

import Link from 'next/link'
import Image from 'next/image'
import type { Game } from '@/types'
import { DIFFICULTY_FA, CATEGORY_FA } from '@/types'
import { formatToman, toPersianDigits } from '@/lib/utils'
import FearMeter from '@/components/ui/FearMeter'
import StarRating from '@/components/ui/StarRating'
import TierBadge from '@/components/games/TierBadge'
import { GAME_COVER_PLACEHOLDER, shouldBypassImageOptimization } from '@/lib/games'

interface GameCardProps {
  game: Game
  variant?: 'default' | 'horizontal'
}

export default function GameCard({ game, variant = 'default' }: GameCardProps) {
  const coverImage = game.coverImage || game.images[0]?.url || GAME_COVER_PLACEHOLDER
  const unoptimized = shouldBypassImageOptimization(coverImage)

  if (variant === 'horizontal') {
    return (
      <Link href={`/games/${game.slug}`}>
        <article className="dark-card group flex cursor-pointer gap-0 overflow-hidden rounded-[18px] transition-all hover:-translate-y-1 hover:border-[#00f5ff]/50">
          <div className="relative w-40 flex-shrink-0 overflow-hidden">
            <Image
              src={coverImage}
              alt={game.title}
              fill
              unoptimized={unoptimized}
              className="object-cover transition duration-500 group-hover:scale-105"
              sizes="160px"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#05070a]/40" />
          </div>
          <div className="flex-1 p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-bold text-white text-base leading-snug">{game.title}</h3>
              <span className="rounded-lg border border-[#ffd700]/40 bg-black/60 px-2 py-1 text-xs font-bold text-[#ffd700]">
                ★ {game.rating?.toFixed?.(1) ?? game.rating}
              </span>
            </div>
            <p className="text-gray-400 text-xs line-clamp-2 mb-3">{game.description}</p>
            <div className="flex items-center justify-between">
              <FearMeter level={game.fearLevel} size="sm" />
              <span className="price-tag text-sm">
                <span>{formatToman(game.basePrice)}</span>
                <span className="text-[#00f5ff]/70 text-xs mr-1">ت</span>
              </span>
            </div>
          </div>
        </article>
      </Link>
    )
  }

  return (
    <Link href={`/games/${game.slug}`}>
      <article className="dark-card group flex h-full cursor-pointer flex-col overflow-hidden rounded-[18px] transition-all hover:-translate-y-2 hover:border-[#00f5ff]/50 hover:shadow-[0_14px_40px_rgba(0,245,255,0.18)]">
        {/* Image container */}
        <div className="relative h-[190px] flex-shrink-0 overflow-hidden">
          <Image
            src={coverImage}
            alt={game.title}
            fill
            unoptimized={unoptimized}
            className="object-cover transition duration-500 group-hover:scale-110"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#05070a]/95 via-black/30 to-transparent" />

          {/* Rating */}
          <div className="absolute top-3 right-3 z-10 rounded-lg border border-[#ffd700]/40 bg-black/60 px-2.5 py-1 text-xs font-bold text-[#ffd700] backdrop-blur">
            ★ {game.rating?.toFixed?.(1) ?? game.rating}
          </div>

          {/* Difficulty + Tier badges */}
          <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
            <div className="rounded-lg bg-[#b026ff]/85 px-2.5 py-1 text-xs font-bold text-white backdrop-blur">
              {DIFFICULTY_FA[game.difficulty]}
            </div>
            {game.tier && <TierBadge tier={game.tier} size="sm" />}
          </div>

          {/* Category badge */}
          {game.hasAgeLimit && game.ageLimit && (
            <div className="absolute bottom-12 left-3 rounded-lg border border-[#ffd700]/40 bg-black/70 px-2 py-1 text-xs font-bold text-[#ffd700] backdrop-blur">
              +{toPersianDigits(game.ageLimit)} سال
            </div>
          )}

          {/* Title overlay */}
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="font-cinzel text-xl font-bold text-white drop-shadow-lg line-clamp-1">{game.title}</h3>
            {game.subtitle && (
              <p className="mt-0.5 line-clamp-1 text-xs text-[#00f5ff]">{game.subtitle}</p>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-5">
          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            <span className="badge-blood text-[10px]">{CATEGORY_FA[game.category]}</span>
            {game.tags?.slice(0, 2).map((tag) => (
              <span key={tag} className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] text-gray-400">
                {tag}
              </span>
            ))}
          </div>

          {/* Description */}
          <p className="text-gray-400 text-sm line-clamp-2 mb-4 flex-1">{game.description}</p>

          {/* Stats row */}
          <div className="mb-4 flex items-center gap-3 border-t border-white/10 pt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <i className="fas fa-users text-[#00f5ff]" />
              {toPersianDigits(game.minPlayers)}-{toPersianDigits(game.maxPlayers)} نفر
            </span>
            <span className="flex items-center gap-1">
              <i className="fas fa-clock text-[#00f5ff]" />
              {toPersianDigits(game.duration)} دقیقه
            </span>
            {(game.likesCount ?? 0) > 0 && (
              <span className="flex items-center gap-1">
                <i className="fas fa-heart text-[#ff00e5]" />
                {toPersianDigits(game.likesCount ?? 0)}
              </span>
            )}
            <StarRating rating={game.rating} size="sm" />
          </div>

          {/* Price + CTA */}
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-[10px] text-gray-500 mb-0.5">از</div>
              <div className="price-tag text-base">
                <span>{formatToman(game.basePrice)}</span>
                <span className="text-[#00f5ff]/70 text-xs mr-1">تومان</span>
              </div>
            </div>
            <button className="btn-blood flex-shrink-0 px-4 py-2 text-sm">
              <i className="fas fa-calendar-plus ml-1 text-xs" />
              رزرو
            </button>
          </div>
        </div>
      </article>
    </Link>
  )
}
