'use client'
import { useRouter } from 'next/navigation'

const actions = [
  { icon: 'fa-megaphone', label: 'کمپین جدید', href: '/campaigns/new', color: 'from-red-600 to-red-800' },
  { icon: 'fa-message-sms', label: 'پیامک گروهی', href: '/messages', color: 'from-sky-600 to-sky-800' },
  { icon: 'fa-handshake', label: 'Deal جدید', href: '/pipeline', color: 'from-purple-600 to-purple-800' },
  { icon: 'fa-user-plus', label: 'مشتری جدید', href: '/customers/new', color: 'from-emerald-600 to-emerald-800' },
  { icon: 'fa-calendar-plus', label: 'رزرو جدید', href: '/bookings/new', color: 'from-amber-600 to-amber-800' },
  { icon: 'fa-chart-bar', label: 'گزارش‌گیری', href: '/reports', color: 'from-indigo-600 to-indigo-800' },
]

export function QuickActions() {
  const router = useRouter()
  
  return (
    <div className="admin-card p-5">
      <h3 className="text-sm font-semibold text-slate-200 mb-4">دسترسی سریع</h3>
      <div className="grid grid-cols-3 gap-2">
        {actions.map(action => (
          <button
            key={action.href}
            onClick={() => router.push(action.href)}
            className="flex flex-col items-center gap-2 p-3 rounded-xl border border-slate-700/30 hover:border-slate-600/50 hover:bg-slate-800/30 transition-all group"
          >
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <i className={`fas ${action.icon} text-white text-xs`} />
            </div>
            <span className="text-xs text-slate-400 group-hover:text-slate-200 text-center leading-tight">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
