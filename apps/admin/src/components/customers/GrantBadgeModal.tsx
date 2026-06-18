'use client'
import { useState } from 'react'

const badges = [
  { id: 'gold_star', label: 'ستاره طلایی', icon: 'fa-star', color: '#f59e0b' },
  { id: 'champion', label: 'قهرمان', icon: 'fa-trophy', color: '#dc2626' },
  { id: 'explorer', label: 'کاشف', icon: 'fa-compass', color: '#0ea5e9' },
  { id: 'veteran', label: 'باتجربه', icon: 'fa-shield', color: '#7c3aed' },
  { id: 'speed', label: 'سریع', icon: 'fa-bolt', color: '#f59e0b' },
  { id: 'team', label: 'بازیکن تیمی', icon: 'fa-users', color: '#059669' },
]

interface Props {
  onConfirm: (badge: string) => void
  onClose: () => void
}

export function GrantBadgeModal({ onConfirm, onClose }: Props) {
  const [selected, setSelected] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative admin-card p-6 w-full max-w-sm animate-fade-in">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">اعطای بج</h3>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {badges.map(b => (
            <button
              key={b.id}
              onClick={() => setSelected(b.id)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                selected === b.id ? 'border-red-500/50 bg-red-500/10' : 'border-slate-700/30 hover:border-slate-600/50'
              }`}
            >
              <i className={`fas ${b.icon} text-xl`} style={{ color: b.color }} />
              <span className="text-xs text-slate-400">{b.label}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-slate-700/50 text-slate-400 text-sm">انصراف</button>
          <button
            onClick={() => onConfirm(selected)}
            disabled={!selected}
            className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            اعطا کن
          </button>
        </div>
      </div>
    </div>
  )
}
