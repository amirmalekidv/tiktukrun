'use client'

import useSWR from 'swr'
import Link from 'next/link'
import Image from 'next/image'
import { getGamesBySection } from '@/lib/api'
import { GAME_COVER_PLACEHOLDER, shouldBypassImageOptimization } from '@/lib/games'
import { formatToman } from '@/lib/utils'
import FearMeter from '@/components/ui/FearMeter'

export default function WeeklyDiscountSection() {
  const { data: games = [], isLoading } = useSWR('weekly-discount', () => getGamesBySection('weekly-discount'))

  if (!isLoading && games.length === 0) return null

  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <div className="section-header mb-8">
        <h2 className="font-cinzel font-bold text-2xl text-white text-center">
          <i className="fas fa-bolt text-yellow-400 ml-2" />
          <span className="gradient-blood">تخفیف‌های هفتگی</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="dark-card rounded-xl h-48 skeleton" />
            ))
            : games.map((game, idx) => {
              // Use deterministic discount based on game index to avoid hydration mismatch
              const DISCOUNTS = [15, 20, 25, 10, 30, 18, 22, 12, 28]
              const discount = DISCOUNTS[idx % DISCOUNTS.length]
              const originalPrice = Number(game.basePrice) || 0
              const discountedPrice = Math.round(originalPrice * (1 - discount / 100))
              const coverImage = game.coverImage || game.images[0]?.url || GAME_COVER_PLACEHOLDER
              const unoptimized = shouldBypassImageOptimization(coverImage)

              return (
                <Link key={game.id} href={`/games/${game.slug}`}>
                  <article className="dark-card rounded-xl overflow-hidden group relative">
                    {/* Discount badge */}
                    <div className="absolute top-3 right-3 z-20 bg-yellow-500 text-black font-black text-sm px-3 py-1 rounded-full shadow-lg">
                      {discount}٪ تخفیف
                    </div>

                    <div className="relative h-32 overflow-hidden">
                      <Image
                        src={coverImage}
                        alt={game.title}
                        fill
                        unoptimized={unoptimized}
                        className="object-cover group-hover:scale-110 transition duration-500"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
                    </div>

                    <div className="p-4">
                      <h3 className="font-bold text-white text-base mb-1">{game.title}</h3>
                      <div className="flex items-center justify-between">
                        <FearMeter level={game.fearLevel} size="sm" />
                        <div className="text-left">
                          <div className="text-gray-500 text-xs line-through">{formatToman(originalPrice)} ت</div>
                          <div className="text-yellow-400 font-bold text-sm">{formatToman(discountedPrice)} ت</div>
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              )
            })}
      </div>

      <div className="text-center mt-6">
        <Link href="/section/weekly-discount" className="btn-ghost text-sm py-2 px-6">
          مشاهده همه تخفیف‌ها
          <i className="fas fa-arrow-left mr-2 text-xs" />
        </Link>
      </div>
    </section>
  )
}
