'use client'

import useSWR from 'swr'
import { getSiteStats } from '@/lib/api'
import { toPersianDigits } from '@/lib/utils'

const stats = [
  { key: 'totalGames', label: 'بازی فعال', icon: 'fas fa-gamepad', color: 'text-red-400', suffix: '+' },
  { key: 'totalBookings', label: 'بازی انجام شده', icon: 'fas fa-trophy', color: 'text-yellow-400', suffix: '+' },
  { key: 'successRate', label: 'نرخ موفقیت', icon: 'fas fa-percentage', color: 'text-green-400', suffix: '٪' },
  { key: 'citiesCount', label: 'شهر', icon: 'fas fa-map-marker-alt', color: 'text-blue-400', suffix: '' },
]

export default function StatsRow() {
  const { data: siteStats } = useSWR('site-stats', getSiteStats)

  const values: Record<string, string | number> = {
    totalGames: siteStats?.totalGames || 48,
    totalBookings: siteStats ? siteStats.totalBookings.toLocaleString('fa-IR') : '۱۲٬۵۴۷',
    successRate: siteStats?.successRate || 28,
    citiesCount: siteStats?.citiesCount || 5,
  }

  return (
    <section className="relative z-10 -mt-16 max-w-5xl mx-auto px-4">
      <div className="dark-card rounded-2xl p-1">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 divide-x-0 md:divide-x divide-red-950/60 rtl:divide-x-reverse">
          {stats.map((stat) => (
            <div key={stat.key} className="flex flex-col items-center justify-center p-6 text-center">
              <div className={`${stat.color} mb-2`}>
                <i className={`${stat.icon} text-2xl`} />
              </div>
              <div className="font-cinzel font-black text-3xl text-white mb-1">
                {toPersianDigits(values[stat.key])}{stat.suffix}
              </div>
              <div className="text-gray-400 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
