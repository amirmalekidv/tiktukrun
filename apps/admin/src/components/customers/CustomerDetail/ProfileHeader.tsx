import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatToman, toPersianNum, timeAgo } from '@/lib/utils'
import type { Customer } from '@/types'

interface Props {
  customer: Customer
  onAction: (action: string) => void
}

export function ProfileHeader({ customer, onAction }: Props) {
  return (
    <div className="admin-card p-6">
      <div className="flex flex-col sm:flex-row items-start gap-5">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-600 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
            {customer.name?.slice(0, 2)}
          </div>
          <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-slate-900 ${
            customer.status === 'ACTIVE' ? 'bg-emerald-500' :
            customer.status === 'BANNED' ? 'bg-red-500' : 'bg-slate-500'
          }`} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-slate-100">{customer.name}</h1>
            <StatusBadge type={customer.tier} showIcon size="md" />
            <StatusBadge type={customer.status} size="sm" />
          </div>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 mb-3">
            <span dir="ltr" className="flex items-center gap-1">
              <i className="fas fa-mobile-screen text-xs text-slate-600" />
              {customer.mobile}
            </span>
            {customer.email && (
              <span className="flex items-center gap-1">
                <i className="fas fa-envelope text-xs text-slate-600" />
                {customer.email}
              </span>
            )}
            {customer.city && (
              <span className="flex items-center gap-1">
                <i className="fas fa-location-dot text-xs text-slate-600" />
                {customer.city}
              </span>
            )}
            <span className="flex items-center gap-1">
              <i className="fas fa-clock text-xs text-slate-600" />
              آخرین فعالیت {timeAgo(customer.lastActiveAt)}
            </span>
          </div>

          {/* Tags */}
          {customer.tags && customer.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {customer.tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-slate-800/80 text-slate-400 border border-slate-700/30">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'ارسال پیامک', icon: 'fa-message-sms', action: 'sms', color: 'bg-sky-600 hover:bg-sky-700' },
              { label: 'ایجاد Deal', icon: 'fa-handshake', action: 'deal', color: 'bg-purple-600 hover:bg-purple-700' },
              { label: 'اعطای بج', icon: 'fa-medal', action: 'badge', color: 'bg-amber-600 hover:bg-amber-700' },
              { label: 'تنظیم XP', icon: 'fa-star', action: 'xp', color: 'bg-indigo-600 hover:bg-indigo-700' },
              { label: 'کیف پول', icon: 'fa-wallet', action: 'wallet', color: 'bg-emerald-600 hover:bg-emerald-700' },
              { label: customer.status === 'BANNED' ? 'رفع مسدودی' : 'مسدود کردن', icon: customer.status === 'BANNED' ? 'fa-check' : 'fa-ban', action: customer.status === 'BANNED' ? 'unban' : 'ban', color: 'bg-red-600/80 hover:bg-red-700' },
            ].map(a => (
              <button
                key={a.action}
                onClick={() => onAction(a.action)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-medium transition-colors ${a.color}`}
              >
                <i className={`fas ${a.icon}`} />
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* Level Badge */}
        <div className="flex-shrink-0 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl border-2 border-red-500/50"
            style={{ background: 'rgba(220,38,38,0.1)' }}>
            <span className="text-red-400">{toPersianNum(customer.level)}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">سطح</p>
        </div>
      </div>
    </div>
  )
}
