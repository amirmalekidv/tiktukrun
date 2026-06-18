'use client'
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
  pink: 'text-pink-400 bg-pink-400/10',
}

function ActivityItemRow({ item }: { item: ActivityItem }) {
  const color = colorMap[item.color || 'slate'] || colorMap.slate
  
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-700/20 last:border-0 slide-in-top">
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm', color)}>
        <i className={`fas ${item.icon || 'fa-circle-dot'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-200 leading-snug">{item.description}</p>
        <p className="text-xs text-slate-500 mt-0.5">{timeAgo(item.createdAt)}</p>
      </div>
    </div>
  )
}

export function LiveActivitiesPanel() {
  const { activities, isLoading } = useLiveActivities(15)

  return (
    <div className="admin-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-200">فعالیت‌های زنده</h3>
          <div className="flex items-center gap-1.5">
            <span className="live-dot" style={{ width: 6, height: 6 }} />
            <span className="text-xs text-emerald-500">زنده</span>
          </div>
        </div>
        <span className="text-xs text-slate-500">{activities.length} رویداد</span>
      </div>
      
      <div className="overflow-y-auto" style={{ maxHeight: 360 }}>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 bg-slate-800 rounded-lg flex-shrink-0" />
                <div className="flex-1">
                  <div className="h-3 bg-slate-800 rounded w-3/4 mb-1.5" />
                  <div className="h-2.5 bg-slate-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          activities.map(item => (
            <ActivityItemRow key={item.id} item={item} />
          ))
        )}
      </div>
    </div>
  )
}
