interface FearMeterProps {
  level: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

const FEAR_LABELS = ['', 'کم', 'ملایم', 'متوسط', 'زیاد', 'وحشتناک']

export default function FearMeter({ level, size = 'md', showLabel = false }: FearMeterProps) {
  const maxLevel = 5
  const fontSize = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-base'

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxLevel }).map((_, i) => (
        <span
          key={i}
          className={`fear-skull ${fontSize} ${i < level ? 'active' : 'inactive'}`}
          aria-hidden="true"
        >
          💀
        </span>
      ))}
      {showLabel && level > 0 && (
        <span className="text-red-400 text-xs mr-1 font-medium">{FEAR_LABELS[level]}</span>
      )}
    </div>
  )
}
