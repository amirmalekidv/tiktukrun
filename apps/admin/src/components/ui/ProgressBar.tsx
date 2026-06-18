import { cn, toPersianNum } from '@/lib/utils'

interface Props {
  value: number
  max?: number
  color?: string
  size?: 'sm' | 'md'
  showLabel?: boolean
  className?: string
}

export function ProgressBar({ value, max = 100, color = '#dc2626', size = 'sm', showLabel = false, className }: Props) {
  const percent = max > 0 ? Math.min((value / max) * 100, 100) : 0
  
  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>{toPersianNum(value)}</span>
          <span>{toPersianNum(max)}</span>
        </div>
      )}
      <div className={cn('progress-bar', size === 'md' ? 'h-2' : 'h-1')}>
        <div
          className="progress-fill"
          style={{ width: `${percent}%`, background: color }}
        />
      </div>
    </div>
  )
}
