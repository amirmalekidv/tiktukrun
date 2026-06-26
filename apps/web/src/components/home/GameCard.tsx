'use client'

import Link from 'next/link'
import Image from 'next/image'
import type { Game } from '@/types'
import { DIFFICULTY_FA, CATEGORY_FA } from '@/types'
import { formatToman, toPersianDigits } from '@/lib/utils'
import FearMeter from '@/components/ui/FearMeter'
import StarRating from '@/components/ui/StarRating'
import TierBadge from '@/components/games/TierBadge'
import { GAME_COVER_PLACEHOLDER } from '@/lib/games'

interface GameCardProps {
  game: Game
  variant?: 'default' | 'horizontal'
}

export default function GameCard({ game, variant = 'default' }: GameCardProps) {
  const coverImage = game.coverImage || game.images[0]?.url || GAME_COVER_PLACEHOLDER

  if (variant === 'horizontal') {
    return (
      <Link href={`/games/${game.slug}`}>
        <article className="dark-card rounded-xl overflow-hidden flex gap-0 group cursor-pointer hover:border-red-600/50 transition-all">
          <div className="relative w-40 flex-shrink-0">
            <Image
              src={coverImage}
              alt={game.title}
              fill
              className="object-cover group-hover:scale-105 transition duration-500"
              sizes="160px"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-bg-dark/20" />
          </div>
          <div className="p-4 flex-1">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-bold text-white text-base leading-snug">{game.title}</h3>
              <FearMeter level={game.fearLevel} size="sm" />
            </div>
            <p className="text-gray-400 text-xs line-clamp-2 mb-3">{game.description}</p>
            <div className="flex items-center justify-between">
              <StarRating rating={game.rating} size="sm" />
              <span className="price-tag text-sm">
                <span className="text-yellow-400">{formatToman(game.basePrice)}</span>
                <span className="text-yellow-600 text-xs mr-1">ت</span>
              </span>
            </div>
          </div>
        </article>
      </Link>
    )
  }

  return (
    <Link href={`/games/${game.slug}`}>
      <article className="dark-card rounded-2xl overflow-hidden group cursor-pointer h-full flex flex-col">
        {/* Image container */}
        <div className="aspect-video relative overflow-hidden flex-shrink-0">
          <Image
            src={coverImage}
            alt={game.title}
            fill
            className="object-cover group-hover:scale-110 transition duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

          {/* Fear level badge */}
          <div className="absolute top-3 right-3 bg-black/80 backdrop-blur rounded-lg px-2 py-1 text-xs border border-red-700/50">
            <FearMeter level={game.fearLevel} size="sm" />
          </div>

          {/* Difficulty + Tier badges */}
          <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
            <div className="bg-red-800/80 backdrop-blur rounded-lg px-2 py-1 text-xs font-bold text-white">
              {DIFFICULTY_FA[game.difficulty]}
            </div>
            {game.tier && <TierBadge tier={game.tier} size="sm" />}
          </div>

          {/* Category badge */}
          {game.hasAgeLimit && game.ageLimit && (
            <div className="absolute bottom-12 left-3 bg-yellow-900/80 backdrop-blur rounded-lg px-2 py-1 text-xs font-bold text-yellow-300 border border-yellow-700/40">
              +{toPersianDigits(game.ageLimit)} سال
            </div>
          )}

          {/* Title overlay */}
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="font-cinzel font-bold text-xl text-white drop-shadow-lg line-clamp-1">{game.title}</h3>
            {game.subtitle && (
              <p className="text-xs text-red-300 mt-0.5 line-clamp-1">{game.subtitle}</p>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col">
          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            <span className="badge-blood text-[10px]">{CATEGORY_FA[game.category]}</span>
            {game.tags?.slice(0, 2).map((tag) => (
              <span key={tag} className="text-[10px] bg-red-950/30 text-gray-400 border border-red-900/20 px-2 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>

          {/* Description */}
          <p className="text-gray-400 text-sm line-clamp-2 mb-4 flex-1">{game.description}</p>

          {/* Stats row */}
          <div className="flex items-center gap-3 text-xs text-gray-500 mb-4 border-t border-red-950/40 pt-3">
            <span className="flex items-center gap-1">
              <i className="fas fa-users text-red-600" />
              {toPersianDigits(game.minPlayers)}-{toPersianDigits(game.maxPlayers)} نفر
            </span>
            <span className="flex items-center gap-1">
              <i className="fas fa-clock text-red-600" />
              {toPersianDigits(game.duration)} دقیقه
            </span>
            {(game.likesCount ?? 0) > 0 && (
              <span className="flex items-center gap-1">
                <i className="fas fa-heart text-red-600" />
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
                <span className="text-yellow-400">{formatToman(game.basePrice)}</span>
                <span className="text-yellow-600 text-xs mr-1">تومان</span>
              </div>
            </div>
            <button className="btn-blood text-sm py-2 px-4 flex-shrink-0">
              <i className="fas fa-calendar-plus ml-1 text-xs" />
              رزرو
            </button>
          </div>
        </div>
      </article>
    </Link>
  )
}
