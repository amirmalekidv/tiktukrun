import { formatToman, toPersianNum, timeAgo } from '@/lib/utils'
import type { Customer } from '@/types'

interface Props { customer: Customer }

export function KpiBoxes({ customer }: Props) {
  const kpis = [
    {
      label: 'ارزش طول عمر (LTV)',
      value: formatToman(customer.ltv),
      icon: 'fa-sack-dollar',
      color: 'text-emerald-400 bg-emerald-400/10',
    },
    {
      label: 'کل رزروها',
      value: toPersianNum(customer.totalBookings),
      icon: 'fa-calendar-check',
      color: 'text-sky-400 bg-sky-400/10',
    },
    {
      label: 'میانگین امتیاز',
      value: `${toPersianNum(customer.avgRating.toFixed(1))} ⭐`,
      icon: 'fa-star',
      color: 'text-amber-400 bg-amber-400/10',
    },
    {
      label: 'آخرین فعالیت',
      value: timeAgo(customer.lastActiveAt),
      icon: 'fa-clock',
      color: 'text-slate-400 bg-slate-400/10',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {kpis.map(k => (
        <div key={k.label} className="admin-card p-4">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${k.color}`}>
            <i className={`fas ${k.icon} text-sm`} />
          </div>
          <p className="text-lg font-bold text-slate-100">{k.value}</p>
          <p className="text-xs text-slate-500 mt-0.5">{k.label}</p>
        </div>
      ))}
    </div>
  )
}
