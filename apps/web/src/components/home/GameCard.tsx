'use client'

import Link from 'next/link'
import Image from 'next/image'
import type { Game } from '@/types'
import { DIFFICULTY_FA, CATEGORY_FA } from '@/types'
import { cn, formatFearPercentage, formatToman, toPersianDigits } from '@/lib/utils'
import StarRating from '@/components/ui/StarRating'
import TierBadge from '@/components/games/TierBadge'
import { GAME_COVER_PLACEHOLDER, shouldBypassImageOptimization } from '@/lib/games'

interface GameCardProps {
  game: Game
  variant?: 'default' | 'horizontal'
  href?: string
  className?: string
}

export default function GameCard({ game, variant = 'default', href, className }: GameCardProps) {
  const coverImage = game.coverImage || game.images[0]?.url || GAME_COVER_PLACEHOLDER
  const unoptimized = shouldBypassImageOptimization(coverImage)
  const targetHref = href || `/games/${game.slug || game.id}`
  const safeRating = Number.isFinite(Number(game.rating)) ? Number(game.rating) : 0
  const branchName = game.branch?.name || 'شعبه نامشخص'
  const cityName = game.branch?.city?.name || 'شهر نامشخص'
  const compactLocation = `${cityName}، ${branchName}`
  const addressLabel = game.branch?.address?.trim() || compactLocation
  const fearPercentage = formatFearPercentage(game.fearLevel)
  const posterBadge = game.hasAgeLimit && game.ageLimit
    ? `+${toPersianDigits(game.ageLimit)}`
    : `${toPersianDigits(game.minPlayers)}-${toPersianDigits(game.maxPlayers)}`
  const gameTier = game.tier ?? 'STANDARD'
  const parsedAvailableSlots = Number(game.availableSlots)
  const availableSlots = game.availableSlots == null || !Number.isFinite(parsedAvailableSlots)
    ? null
    : Math.max(0, parsedAvailableSlots)
  const availableSlotsLabel = availableSlots === null
    ? null
    : `${toPersianDigits(availableSlots)} سانس آزاد`
  const hoverStats = [
    {
      label: 'بازیکن',
      value: `${toPersianDigits(game.minPlayers)} تا ${toPersianDigits(game.maxPlayers)} نفر`,
      icon: 'fas fa-users',
      valueClassName: 'text-[#e5ebf4]',
    },
    {
      label: 'زمان',
      value: `${toPersianDigits(game.duration)} دقیقه`,
      icon: 'fas fa-clock',
      valueClassName: 'text-[#e5ebf4]',
    },
    {
      label: 'سختی',
      value: DIFFICULTY_FA[game.difficulty],
      icon: 'fas fa-bolt',
      valueClassName: 'text-[#e5ebf4]',
    },
    {
      label: 'ترس',
      value: fearPercentage,
      icon: 'fas fa-skull',
      valueClassName: 'text-sm font-black text-[#ff8aa7]',
    },
  ]

  if (variant === 'horizontal') {
    return (
      <Link
        href={targetHref}
        draggable={false}
        className={cn('game-card-link group block h-full min-w-0 focus-visible:outline-none', className)}
      >
        <article className="game-card-surface dark-card relative flex h-full min-h-[224px] overflow-hidden rounded-[24px] border border-[#f6c453]/30 bg-[radial-gradient(circle_at_top,rgba(246,196,83,0.12),transparent_45%),linear-gradient(180deg,rgba(16,21,33,0.96),rgba(9,12,20,0.98))] transition-all duration-500 hover:-translate-y-1 hover:border-[#f6c453]/65 hover:shadow-[0_18px_40px_rgba(246,196,83,0.16)] group-focus-within:-translate-y-1 group-focus-within:border-[#f6c453]/65">
          <div className="relative min-h-[224px] w-full flex-shrink-0 overflow-hidden sm:w-52 lg:w-60">
            <Image
              src={coverImage}
              alt={game.title}
              fill
              draggable={false}
              unoptimized={unoptimized}
              className="object-cover transition duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, 240px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#070a12] via-[#070a12]/25 to-transparent sm:bg-gradient-to-l sm:from-[#070a12] sm:via-[#070a12]/20 sm:to-transparent" />
            <div className="absolute right-3 top-3 rounded-full border border-[#f6c453]/45 bg-[#090c13]/78 px-3 py-1 text-[11px] font-bold text-[#f6d06b] backdrop-blur">
              {CATEGORY_FA[game.category]}
            </div>
            {game.hasAgeLimit && game.ageLimit ? (
              <div className="absolute bottom-3 right-3 rounded-full border border-white/10 bg-black/55 px-2.5 py-1 text-[11px] font-bold text-white/90 backdrop-blur">
                +{toPersianDigits(game.ageLimit)} سال
              </div>
            ) : null}
          </div>
          <div className="flex flex-1 flex-col p-5">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="line-clamp-1 text-lg font-black text-white">{game.title}</h3>
                <p className="mt-1 line-clamp-1 text-sm text-[#cbd5e1]/70">
                  {branchName}، {cityName}
                </p>
              </div>
              <div className="rounded-full border border-[#f6c453]/35 bg-[#090c13]/75 px-3 py-1 text-[11px] font-bold text-[#f6d06b] backdrop-blur">
                ★ {toPersianDigits(safeRating.toFixed(1))}
              </div>
            </div>

            <div className="mb-3 flex flex-wrap gap-2">
              <TierBadge tier={gameTier} size="sm" />
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] text-white/80">
                {DIFFICULTY_FA[game.difficulty]}
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] text-white/80">
                {toPersianDigits(game.duration)} دقیقه
              </span>
              {availableSlotsLabel ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#8fc9ff]/25 bg-[#8fc9ff]/10 px-3 py-1 text-[11px] font-bold text-[#8fc9ff]">
                  <i className="fas fa-calendar-check text-[10px]" />
                  {availableSlotsLabel}
                </span>
              ) : null}
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] text-white/80">
                {toPersianDigits(game.minPlayers)} تا {toPersianDigits(game.maxPlayers)} نفر
              </span>
            </div>

            <p className="mb-4 line-clamp-2 flex-1 text-sm leading-6 text-[#d7deea]/72">{game.description}</p>

            <div className="mt-auto flex items-end justify-between gap-4 border-t border-white/10 pt-4">
              <div className="[text-align:right]">
                <div className="mb-1 text-[10px] text-[#8b95a7]">شروع از</div>
                <div className="price-tag text-base">
                  {formatToman(game.basePrice)}
                  <span className="mr-1 text-[11px] text-[#f6d06b]/80">تومان</span>
                </div>
              </div>

              <div className="text-left">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-[#ff6b8f]/35 bg-[#ff6b8f]/10 px-3 py-1 text-[11px] font-black text-[#ff8aa7]">
                  <span className="text-white/70">ترس</span>
                  <span>{fearPercentage}</span>
                </div>
                <div className="mt-2">
                  <StarRating rating={game.rating} totalReviews={game.totalReviews} size="sm" showCount />
                </div>
              </div>
            </div>
          </div>
        </article>
      </Link>
    )
  }

  return (
    <Link
      href={targetHref}
      draggable={false}
      className={cn(
        'game-card-link group block h-full w-[220px] flex-shrink-0 snap-start min-w-0 sm:w-[236px] lg:w-[248px] focus-visible:outline-none',
        className
      )}
    >
      <div className="flex h-full flex-col">
        <article className="game-card-surface dark-card relative isolate aspect-[3/4] overflow-hidden rounded-[24px] border border-[#f6c453]/45 bg-[linear-gradient(180deg,rgba(11,15,24,0.98),rgba(7,10,16,0.99))] transition-all duration-500 hover:-translate-y-2 hover:border-[#f6c453]/80 hover:shadow-[0_24px_60px_rgba(246,196,83,0.18)] group-focus-within:-translate-y-2 group-focus-within:border-[#f6c453]/80">
          <div className="absolute inset-0">
            <Image
              src={coverImage}
              alt={game.title}
              fill
              draggable={false}
              unoptimized={unoptimized}
              className="object-cover transition duration-700 group-hover:scale-110 group-focus-within:scale-110"
              sizes="(max-width: 640px) 220px, (max-width: 1024px) 236px, 248px"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,8,13,0.08)_0%,rgba(6,8,13,0.14)_26%,rgba(6,8,13,0.38)_70%,rgba(6,8,13,0.9)_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(246,196,83,0.14),transparent_34%),radial-gradient(circle_at_bottom,rgba(0,245,255,0.08),transparent_42%)] opacity-70 transition duration-500 group-hover:opacity-100 group-focus-within:opacity-100" />
          </div>

          <div className="absolute right-3 top-3 z-10 inline-flex max-w-[82%] items-center gap-1.5 rounded-full border border-[#c9bdff]/40 bg-[#755cf4]/92 px-3 py-1.5 text-[11px] font-bold leading-5 text-white shadow-[0_12px_28px_rgba(19,13,44,0.36)] backdrop-blur-md transition-all duration-500 group-hover:-translate-y-2 group-hover:opacity-0 group-focus-within:-translate-y-2 group-focus-within:opacity-0">
            <i className="fas fa-location-dot text-[10px] text-white/88" />
            <span className="min-w-0 truncate">{compactLocation}</span>
          </div>

          <div className="game-card-quick-meta absolute inset-x-3 bottom-3 z-10 flex items-center justify-between gap-2 transition-all duration-500 group-hover:translate-y-3 group-hover:opacity-0 group-focus-within:translate-y-3 group-focus-within:opacity-0">
            <div className="flex items-center gap-2">
              <span className="flex h-9 min-w-9 items-center justify-center rounded-full border border-white/12 bg-[#0b1018]/82 px-2 text-[#8fc9ff] shadow-[0_10px_24px_rgba(0,0,0,0.3)] backdrop-blur-md">
                <i className="fas fa-users text-[13px]" />
              </span>
              <span className="flex h-9 min-w-9 items-center justify-center rounded-full border border-white/12 bg-[#0b1018]/82 px-2 text-[#f6d06b] shadow-[0_10px_24px_rgba(0,0,0,0.3)] backdrop-blur-md">
                <i className="fas fa-clock text-[13px]" />
              </span>
              <span className="flex h-9 min-w-9 items-center justify-center rounded-full border border-white/12 bg-[#0b1018]/82 px-2 text-[11px] font-black text-[#ff6b8f] shadow-[0_10px_24px_rgba(0,0,0,0.3)] backdrop-blur-md">
                {fearPercentage}
              </span>
            </div>

            <span className="rounded-full border border-[#f6c453]/40 bg-[#f0b90b] px-3 py-1.5 text-[11px] font-black text-[#1a1e28] shadow-[0_10px_24px_rgba(240,185,11,0.3)]">
              {posterBadge}
            </span>
          </div>

          <div className="game-card-hover-panel pointer-events-none absolute inset-x-3 bottom-3 top-3 z-20 flex translate-y-4 items-center justify-center rounded-[20px] border border-[#f6c453]/25 bg-[linear-gradient(180deg,rgba(9,12,19,0.9),rgba(11,15,24,0.98))] p-4 opacity-0 shadow-[0_24px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
            <div className="flex w-full flex-col gap-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-2.5 [text-align:right]">
                <div className="mb-1 flex items-center gap-1.5 text-[10px] text-[#f6d06b]">
                  <i className="fas fa-location-dot text-[10px]" />
                  <span>آدرس</span>
                </div>
                <div className="line-clamp-2 text-[10px] leading-4 text-[#e5ebf4]/86">{addressLabel}</div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-[#e5ebf4]/86">
                {hoverStats.map((item) => (
                  <div
                    key={item.label}
                    className="flex min-h-[66px] flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-2.5 [text-align:right]"
                  >
                    <div className="flex items-center gap-1.5 text-[#f6d06b]">
                      <i className={`${item.icon} text-[10px]`} />
                      <span>{item.label}</span>
                    </div>
                    <div className={cn('leading-5', item.valueClassName)}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </article>

        <div className="px-2 pb-1 pt-3 [text-align:right]">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <h3 className="line-clamp-2 min-w-0 flex-1 text-[1.05rem] font-black leading-8 text-white">
              {game.title}
            </h3>
            <div className="mt-1 flex-shrink-0">
              <TierBadge tier={gameTier} size="sm" />
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-start gap-x-3 gap-y-1 text-[11px] text-[#aab6c8]/74">
            <span className="flex items-center gap-1">
              <i className="fas fa-clock text-[10px] text-[#f6d06b]" />
              {toPersianDigits(game.duration)} دقیقه
            </span>
            <span className="h-3 w-px bg-white/10" />
            <span className="flex items-center gap-1">
              <i className="fas fa-users text-[10px] text-[#8fc9ff]" />
              {toPersianDigits(game.minPlayers)} تا {toPersianDigits(game.maxPlayers)}
            </span>
            {availableSlotsLabel ? (
              <span className="flex items-center gap-1 text-[#8fc9ff]">
                <i className="fas fa-calendar-check text-[10px]" />
                {availableSlotsLabel}
              </span>
            ) : null}
          </div>

          <div className="mt-3 flex items-end justify-between gap-2">
            <div className="[text-align:right]">
              <div className="mb-1 text-[10px] text-[#8b95a7]">شروع از</div>
              <div className="price-tag text-base leading-none">
                {formatToman(game.basePrice)}
                <span className="mr-1 text-[11px] text-[#f6d06b]/80">تومان</span>
              </div>
            </div>

            <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-bold text-white/86">
              ★ {toPersianDigits(safeRating.toFixed(1))}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
