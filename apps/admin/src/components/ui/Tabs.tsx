'use client'
import { cn } from '@/lib/utils'

interface Tab {
  id: string
  label: string
  icon?: string
  count?: number
}

interface Props {
  tabs: Tab[]
  activeTab: string
  onChange: (id: string) => void
  className?: string
}

export function Tabs({ tabs, activeTab, onChange, className }: Props) {
  return (
    <div className={cn('flex border-b border-slate-700/30 overflow-x-auto', className)}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap',
            activeTab === tab.id
              ? 'border-red-500 text-red-400'
              : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-500'
          )}
        >
          {tab.icon && <i className={`fas ${tab.icon} text-xs`} />}
          {tab.label}
          {tab.count != null && (
            <span className={cn(
              'text-xs rounded-full px-1.5 py-0.5',
              activeTab === tab.id ? 'bg-red-600/20 text-red-400' : 'bg-slate-700/50 text-slate-500'
            )}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
