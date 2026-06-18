import HeroSection from '@/components/home/HeroSection'
import StatsRow from '@/components/home/StatsRow'
import CategoryFilter from '@/components/home/CategoryFilter'
import CityFilter from '@/components/home/CityFilter'
import GenreFilter from '@/components/home/GenreFilter'
import GamesGrid from '@/components/home/GamesGrid'
import WeeklyDiscountSection from '@/components/home/WeeklyDiscountSection'
import SectionStrip from '@/components/home/SectionStrip'
import TopPlayersSection from '@/components/home/TopPlayersSection'
import StoriesSection from '@/components/home/StoriesSection'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <HeroSection />

      {/* Stats */}
      <StatsRow />

      {/* Categories */}
      <CategoryFilter />

      {/* City + Genre filters */}
      <CityFilter />
      <GenreFilter />

      {/* Divider */}
      <div className="h-px w-full max-w-7xl mx-auto bg-gradient-to-r from-transparent via-red-900/50 to-transparent my-4" />

      {/* Weekly discounts */}
      <WeeklyDiscountSection />

      {/* Featured games grid */}
      <GamesGrid />

      {/* Section strips */}
      <div className="border-t border-red-950/40 my-4" />
      <SectionStrip sectionKey="cinema-horror" title="سینمای ترس" icon="fas fa-film" />
      <SectionStrip sectionKey="board-games" title="بردگیم" icon="fas fa-chess" />
      <SectionStrip sectionKey="mafia" title="مافیا" icon="fas fa-user-secret" />
      <SectionStrip sectionKey="lasertag" title="لیزرتگ" icon="fas fa-crosshairs" />
      <SectionStrip sectionKey="vr" title="واقعیت مجازی" icon="fas fa-vr-cardboard" />
      <SectionStrip sectionKey="paintball" title="پینت‌بال" icon="fas fa-paint-roller" />
      <SectionStrip sectionKey="tehran" title="در تهران" icon="fas fa-city" />
      <SectionStrip sectionKey="karaj" title="در کرج" icon="fas fa-map-marker-alt" />

      {/* Top players */}
      <div className="border-t border-red-950/40 my-4" />
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <TopPlayersSection />
          <StoriesSection />
        </div>
      </div>

      {/* Bottom CTA */}
      <section className="relative py-20 mt-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-red-950/30 via-black to-red-950/30" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-cinzel font-black text-4xl text-white mb-4 flicker">
            آماده‌ای؟
          </h2>
          <p className="text-gray-300 text-lg mb-8">
            اولین قدم را بردار. رزرو کن، بازی کن، فراموش‌نشدنی باش.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/games" className="btn-blood text-lg px-10 py-4 rounded-xl">
              <i className="fas fa-play ml-2" />
              شروع کن
            </a>
            <a href="/login" className="btn-ghost text-lg px-10 py-4 rounded-xl">
              <i className="fas fa-user-plus ml-2" />
              ثبت‌نام رایگان
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
