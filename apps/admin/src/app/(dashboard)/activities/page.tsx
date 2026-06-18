'use client'
import { useState } from 'react'
import { useLiveActivities } from '@/hooks/useLiveActivities'
import { timeAgo, cn } from '@/lib/utils'
import type { ActivityItem } from '@/types'

const colorMap: Record<string, string> = {
  emerald: 'text-emerald-400 bg-emerald-400/10',
  sky: 'text-sky-400 bg-sky-400/10',
  amber: 'text-amber-400 bg-amber-400/10',
  purple: 'text-purple-400 bg-purple-400/10',
  red: 'text-red-400 bg-red-400/10',
  orange: 'text-orange-400 bg-orange-400/10',
  indigo: 'text-indigo-400 bg-indigo-400/10',
  slate: 'text-slate-400 bg-slate-400/10',
}

const typeFilters = [
  { value: '', label: 'همه' },
  { value: 'BOOKING', label: 'رزروها' },
  { value: 'PAYMENT', label: 'پرداخت‌ها' },
  { value: 'REVIEW', label: 'نظرات' },
  { value: 'LOGIN', label: 'ورود' },
  { value: 'BADGE', label: 'بج‌ها' },
  { value: 'LEVEL_UP', label: 'ارتقاء سطح' },
]

export default function ActivitiesPage() {
  const { activities, isLoading } = useLiveActivities(50)
  const [typeFilter, setTypeFilter] = useState('')

  const filtered = typeFilter ? activities.filter(a => a.type === typeFilter) : activities

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">تاریخچه فعالیت</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="live-dot" style={{ width: 6, height: 6 }} />
            <p className="text-sm text-emerald-500">پخش زنده</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {typeFilters.map(f => (
          <button
            key={f.value}
            onClick={() => setTypeFilter(f.value)}
            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
              typeFilter === f.value
                ? 'bg-red-600/20 border-red-500/40 text-red-400'
                : 'border-slate-700/30 text-slate-400 hover:border-slate-600/50 hover:text-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Activity Feed */}
      <div className="admin-card overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-10 h-10 bg-slate-800 rounded-xl flex-shrink-0" />
                <div className="flex-1">
                  <div className="h-3.5 bg-slate-800 rounded w-1/2 mb-2" />
                  <div className="h-3 bg-slate-800 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-slate-700/20">
            {filtered.map(item => {
              const color = colorMap[item.color || 'slate'] || colorMap.slate
              return (
                <div key={item.id} className="flex items-start gap-4 p-4 hover:bg-slate-800/20 transition-colors slide-in-top">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', color)}>
                    <i className={`fas ${item.icon || 'fa-circle-dot'} text-sm`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-slate-300">{item.title}</p>
                        <p className="text-sm text-slate-400 mt-0.5">{item.description}</p>
                      </div>
                      <span className="text-xs text-slate-600 flex-shrink-0">{timeAgo(item.createdAt)}</span>
                    </div>
                    {item.customerName && (
                      <span className="inline-flex items-center gap-1 mt-1.5 text-xs text-slate-600 bg-slate-800/50 px-2 py-0.5 rounded-full border border-slate-700/20">
                        <i className="fas fa-user text-[9px]" />
                        {item.customerName}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
