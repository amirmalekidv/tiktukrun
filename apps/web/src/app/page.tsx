import dynamic from 'next/dynamic'
import HeroSection from '@/components/home/HeroSection'
import BannerCarousel from '@/components/home/BannerCarousel'
import StatsRow from '@/components/home/StatsRow'
import CategoryFilter from '@/components/home/CategoryFilter'

const LandingSections = dynamic(() => import('@/components/home/LandingSections'), {
  loading: () => (
    <div className="border-t border-white/10 my-4">
      {Array.from({ length: 2 }).map((_, i) => (
        <section key={i} className="py-10">
          <div className="max-w-7xl mx-auto px-4">
            <div className="h-8 w-48 skeleton rounded mb-6" />
            <div className="flex gap-4 overflow-hidden">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="h-64 w-56 flex-shrink-0 skeleton rounded-[18px]" />
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  ),
})

const TopPlayersSection = dynamic(() => import('@/components/home/TopPlayersSection'), {
  loading: () => <div className="h-80 skeleton rounded-[18px]" />,
})

const StoriesSection = dynamic(() => import('@/components/home/StoriesSection'), {
  loading: () => (
    <div className="grid grid-cols-1 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-48 skeleton rounded-[20px]" />
      ))}
    </div>
  ),
})

const OnlineChatSection = dynamic(() => import('@/components/home/OnlineChatSection'), {
  loading: () => <div className="mx-auto max-w-7xl px-4 py-10"><div className="h-64 skeleton rounded-[18px]" /></div>,
})

const PlatformIntroSection = dynamic(() => import('@/components/home/PlatformIntroSection'), {
  loading: () => (
    <section className="relative z-10 mx-auto max-w-7xl px-4 py-10 md:py-14">
      <div className="aspect-video w-full rounded-2xl skeleton" />
    </section>
  ),
})

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <HeroSection />

      {/* Stats */}
      <StatsRow />

      {/* Auto-scrolling landing banner */}
      <BannerCarousel />

      {/* Categories */}
      <CategoryFilter />

      {/* Divider */}
      <div className="h-px w-full max-w-7xl mx-auto bg-gradient-to-r from-transparent via-[#00f5ff]/40 to-transparent my-4" />

      {/* Landing page sections (carousel rails) */}
      <LandingSections />

      {/* Top players */}
      <div className="border-t border-white/10 my-4" />
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <TopPlayersSection />
          <StoriesSection />
        </div>
      </div>

      {/* Online chat — only rendered when authenticated (see OnlineChatSection) */}
      <OnlineChatSection />

      {/* Bottom CTA */}
      <section className="relative py-20 mt-10 overflow-hidden">
        <div className="relative z-10 max-w-3xl mx-auto px-4">
          <div className="dark-card rounded-[18px] p-8 text-center md:p-12">
          <h2 className="font-cinzel font-black text-4xl text-white mb-4">
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
        </div>
      </section>

      {/* Platform intro: video + FAQ — last section before footer */}
      <PlatformIntroSection />
    </div>
  )
}
