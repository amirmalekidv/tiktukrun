'use client'

import { useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { getLeaderboard } from '@/lib/api'
import { toPersianDigits } from '@/lib/utils'

type Period = 'WEEKLY' | 'MONTHLY' | 'ALL_TIME'

const periodLabels: Record<Period, string> = {
  WEEKLY: 'این هفته',
  MONTHLY: 'این ماه',
  ALL_TIME: 'همیشه',
}

const rankColors = ['text-yellow-400', 'text-gray-300', 'text-amber-600']
const rankIcons = ['👑', '🥈', '🥉']

export default function TopPlayersSection() {
  const [period, setPeriod] = useState<Period>('ALL_TIME')
  const { data: leaderboard = [], isLoading } = useSWR(`leaderboard-${period}`, () => getLeaderboard(period))

  return (
    <section className="py-8">
      <div className="section-header mb-8">
        <h2 className="font-cinzel font-bold text-2xl text-white text-center">
          <span className="blood-text">شجاعان</span> قلمرو
        </h2>
      </div>

      <div className="dark-card rounded-2xl overflow-hidden">
        {/* Period tabs */}
        <div className="flex border-b border-red-950/60">
          {(Object.keys(periodLabels) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-3 text-sm font-medium transition-all ${
                period === p
                  ? 'tab-active-dark text-white'
                  : 'text-gray-400 hover:text-white hover:bg-red-950/20'
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>

        {/* Leaderboard list */}
        <div className="p-4 space-y-3">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3">
                  <div className="w-8 h-8 skeleton rounded-full" />
                  <div className="w-10 h-10 skeleton rounded-full" />
                  <div className="flex-1">
                    <div className="skeleton h-4 w-32 mb-1 rounded" />
                    <div className="skeleton h-3 w-20 rounded" />
                  </div>
                  <div className="skeleton h-5 w-16 rounded" />
                </div>
              ))
            : (leaderboard as any[]).slice(0, 5).map((entry: any, i: number) => {
                const u = entry?.user || {}
                const name: string = u.fullName || u.name || u.nickname || ''
                const avatar: string | null = u.avatar || u.avatarUrl || null
                const score: number = Number(entry?.score ?? entry?.xp ?? 0) || 0
                const gamesPlayed: number = Number(entry?.gamesPlayed ?? 0) || 0
                const rank: number = Number(entry?.rank ?? i + 1) || i + 1
                return (
                  <div
                    key={u.id ?? `row-${i}`}
                    className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
                      i === 0 ? 'bg-yellow-950/30 border border-yellow-700/20' : 'hover:bg-red-950/20'
                    }`}
                  >
                    {/* Rank */}
                    <div className={`w-8 text-center font-cinzel font-black text-lg ${rankColors[i] || 'text-gray-500'}`}>
                      {i < 3 ? rankIcons[i] : toPersianDigits(rank)}
                    </div>
                    {/* Avatar */}
                    {avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatar}
                        alt={name || 'بازیکن'}
                        className={`w-10 h-10 rounded-full object-cover ${i === 0 ? 'ring-2 ring-yellow-400' : ''}`}
                      />
                    ) : (
                      <div className={`w-10 h-10 rounded-full bg-red-900 flex items-center justify-center text-white font-bold ${i === 0 ? 'ring-2 ring-yellow-400' : ''}`}>
                        {(name || 'ک').charAt(0)}
                      </div>
                    )}
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white text-sm truncate">
                        {name || `بازیکن ${toPersianDigits(rank)}`}
                      </div>
                      <div className="text-gray-500 text-xs">
                        {toPersianDigits(gamesPlayed)} بازی
                      </div>
                    </div>
                    {/* XP */}
                    <div className={`text-sm font-bold font-cinzel ${i === 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {score.toLocaleString('fa-IR')} XP
                    </div>
                  </div>
                )
              })}
        </div>

        {/* Footer */}
        <div className="border-t border-red-950/40 p-4 text-center">
          <Link href="/leaderboard" className="text-red-400 hover:text-red-300 text-sm transition-colors">
            مشاهده جدول کامل
            <i className="fas fa-chevron-left mr-2 text-xs" />
          </Link>
        </div>
      </div>
    </section>
  )
}
