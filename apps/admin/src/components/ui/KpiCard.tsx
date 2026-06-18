import { cn, toPersianNum } from '@/lib/utils'
import type { KpiData } from '@/types'

interface Props {
  data: KpiData
  className?: string
}

export function KpiCard({ data, className }: Props) {
  const isUp = data.changeType === 'increase'
  const isDown = data.changeType === 'decrease'

  const colorMap: Record<string, string> = {
    emerald: '#10b981',
    sky: '#0ea5e9',
    amber: '#f59e0b',
    purple: '#7c3aed',
    red: '#dc2626',
    pink: '#ec4899',
  }

  const bgColorMap: Record<string, string> = {
    emerald: 'rgba(16,185,129,0.1)',
    sky: 'rgba(14,165,233,0.1)',
    amber: 'rgba(245,158,11,0.1)',
    purple: 'rgba(124,58,237,0.1)',
    red: 'rgba(220,38,38,0.1)',
    pink: 'rgba(236,72,153,0.1)',
  }

  const color = colorMap[data.color] || colorMap.emerald
  const bgColor = bgColorMap[data.color] || bgColorMap.emerald

  return (
    <div className={cn('admin-card p-5 hover:border-slate-600/50 transition-all duration-300 group', className)}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs text-slate-500 mb-1">{data.label}</p>
          <p className="text-2xl font-bold text-slate-100">{data.value}</p>
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform"
          style={{ background: bgColor }}
        >
          <i className={`fas ${data.icon} text-sm`} style={{ color }} />
        </div>
      </div>

      {/* Change indicator */}
      <div className="flex items-center justify-between">
        <div className={cn(
          'flex items-center gap-1 text-xs font-medium',
          isUp ? 'text-emerald-400' : isDown ? 'text-red-400' : 'text-slate-400'
        )}>
          {isUp && <i className="fas fa-arrow-up text-[10px]" />}
          {isDown && <i className="fas fa-arrow-down text-[10px]" />}
          {!isUp && !isDown && <i className="fas fa-minus text-[10px]" />}
          <span>{toPersianNum(Math.abs(data.change).toFixed(1))}٪</span>
          <span className="text-slate-500 font-normal">نسبت به ماه قبل</span>
        </div>
        
        {/* Mini sparkline */}
        {data.trend && data.trend.length > 0 && (
          <div className="flex items-end gap-0.5 h-6">
            {data.trend.map((v, i) => {
              const max = Math.max(...data.trend)
              const h = Math.max(2, Math.round((v / max) * 20))
              return (
                <div
                  key={i}
                  className="w-1 rounded-sm transition-all"
                  style={{
                    height: h,
                    background: i === data.trend.length - 1 ? color : 'rgba(71,85,105,0.5)'
                  }}
                />
              )
            })}
          </div>
        )}
      </div>

      {/* Target progress */}
      {data.targetPercent != null && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-500">هدف ماهانه</span>
            <span className="text-slate-400">{toPersianNum(data.targetPercent.toFixed(0))}٪</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${Math.min(data.targetPercent, 100)}%`, background: color }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
