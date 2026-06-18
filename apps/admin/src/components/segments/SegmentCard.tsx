import { toPersianNum } from '@/lib/utils'
import type { Segment } from '@/types'

interface Props { segment: Segment; onClick: () => void }

export function SegmentCard({ segment, onClick }: Props) {
  const isGrowthPositive = segment.growthPercent >= 0

  return (
    <button
      onClick={onClick}
      className="admin-card p-4 text-right w-full hover:border-slate-600/60 transition-all hover:scale-[1.02] group"
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
          style={{ background: segment.color + '20' }}
        >
          <i className={`fas ${segment.icon} text-sm`} style={{ color: segment.color }} />
        </div>
        <span className={`text-xs font-medium flex items-center gap-1 ${isGrowthPositive ? 'text-emerald-400' : 'text-red-400'}`}>
          <i className={`fas ${isGrowthPositive ? 'fa-arrow-up' : 'fa-arrow-down'} text-[10px]`} />
          {toPersianNum(Math.abs(segment.growthPercent).toFixed(1))}٪
        </span>
      </div>
      <p className="text-sm font-semibold text-slate-200 mb-0.5">{segment.name}</p>
      <p className="text-2xl font-bold text-slate-100">{toPersianNum(segment.count)}</p>
      <p className="text-xs text-slate-500 mt-0.5">عضو</p>
      {segment.description && (
        <p className="text-xs text-slate-600 mt-2 truncate">{segment.description}</p>
      )}
    </button>
  )
}
