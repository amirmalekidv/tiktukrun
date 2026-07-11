'use client'

import LeaderboardView from '@/components/leaderboard/LeaderboardView'

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen pt-24">
      <div className="relative py-16 mb-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 to-bg-dark" />
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(rgba(0,245,255,0.5) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(0,245,255,0.5) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <div className="text-5xl mb-4">
            <i className="fas fa-trophy text-red-500" />
          </div>
          <h1 className="font-cinzel font-black text-4xl md:text-5xl text-white mb-3 flicker">
            جدول شجاعان
          </h1>
          <p className="text-gray-300 text-lg">قهرمانان قلمرو</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-20">
        <LeaderboardView />
      </div>
    </div>
  )
}
