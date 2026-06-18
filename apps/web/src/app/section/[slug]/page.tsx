'use client'

import useSWR from 'swr'
import { getGamesBySection } from '@/lib/api'
import GameCard from '@/components/home/GameCard'
import { GameCardSkeleton } from '@/components/ui/LoadingSkeleton'
import { toPersianDigits } from '@/lib/utils'

const SECTION_META: Record<string, { title: string; desc: string; icon: string }> = {
  'weekly-discount': { title: 'تخفیف‌های هفتگی', desc: 'بهترین تخفیف‌های این هفته', icon: 'fas fa-bolt' },
  'cinema-horror': { title: 'سینمای ترس', desc: 'تجربه سینمایی ترسناک', icon: 'fas fa-film' },
  'board-games': { title: 'بردگیم', desc: 'بهترین بازی‌های رومیزی و فکری', icon: 'fas fa-chess' },
  'board-game': { title: 'بردگیم', desc: 'بهترین بازی‌های رومیزی و فکری', icon: 'fas fa-chess' },
  mafia: { title: 'مافیا', desc: 'شب‌های هیجان‌انگیز مافیا با گردانندهٔ حرفه‌ای', icon: 'fas fa-user-secret' },
  lasertag: { title: 'لیزرتگ', desc: 'نبرد الکترونیکی هیجان‌انگیز', icon: 'fas fa-crosshairs' },
  'laser-tag': { title: 'لیزرتگ', desc: 'نبرد الکترونیکی هیجان‌انگیز', icon: 'fas fa-crosshairs' },
  vr: { title: 'واقعیت مجازی', desc: 'دنیایی متفاوت', icon: 'fas fa-vr-cardboard' },
  paintball: { title: 'پینت‌بال', desc: 'رزم با رنگ', icon: 'fas fa-paint-roller' },
  tehran: { title: 'در تهران', desc: 'بهترین سرگرمی‌های تهران', icon: 'fas fa-city' },
  karaj: { title: 'در کرج', desc: 'سرگرمی‌های کرج', icon: 'fas fa-map-marker-alt' },
  featured: { title: 'برترین‌ها', desc: 'بهترین تجربه‌های قلمرو', icon: 'fas fa-star' },
  stories: { title: 'داستان‌ها', desc: 'داستان شجاعان قلمرو', icon: 'fas fa-book' },
  leaderboard: { title: 'جدول شجاعان', desc: 'قهرمانان قلمرو', icon: 'fas fa-trophy' },
}

export default function SectionPage({ params }: { params: { slug: string } }) {
  const { slug } = params
  const meta = SECTION_META[slug] || { title: slug, desc: 'بازی‌ها', icon: 'fas fa-gamepad' }

  const { data: games = [], isLoading } = useSWR(`section-page-${slug}`, () => getGamesBySection(slug))

  return (
    <div className="min-h-screen pt-24">
      {/* Banner */}
      <div className="relative py-16 mb-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 to-bg-dark" />
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(rgba(220,38,38,0.5) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(220,38,38,0.5) 1px, transparent 1px)`,
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
          <p className="text-gray-300 text-lg">{meta.desc}</p>
        </div>
      </div>

      {/* Games grid */}
      <div className="max-w-7xl mx-auto px-4 pb-20">
        {/* Count */}
        <p className="text-gray-400 mb-6">
          {isLoading ? '...' : `${toPersianDigits(games.length)} بازی`}
        </p>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <GameCardSkeleton key={i} />)}
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎮</div>
            <h3 className="font-cinzel text-xl text-white mb-2">بازی‌ای در این دسته موجود نیست</h3>
            <a href="/games" className="btn-blood mt-4 inline-block">همه بازی‌ها</a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
