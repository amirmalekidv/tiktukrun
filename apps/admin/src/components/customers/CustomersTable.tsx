'use client'
import Link from 'next/link'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { formatToman, toPersianNum, timeAgo } from '@/lib/utils'
import type { Customer } from '@/types'

interface Props {
  customers: Customer[]
  selectedIds: string[]
  onSelectAll: (checked: boolean) => void
  onSelect: (id: string, checked: boolean) => void
  onAction: (action: string, customer: Customer) => void
}

export function CustomersTable({ customers, selectedIds, onSelectAll, onSelect, onAction }: Props) {
  const allSelected = customers.length > 0 && customers.every(c => selectedIds.includes(c.id))

  return (
    <div className="overflow-x-auto">
      <table className="w-full admin-table">
        <thead>
          <tr>
            <th className="w-10">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={e => onSelectAll(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 accent-red-600"
              />
            </th>
            <th className="text-right min-w-[180px]">مشتری</th>
            <th className="text-right">موبایل</th>
            <th className="text-right">وضعیت</th>
            <th className="text-right min-w-[120px]">سطح</th>
            <th className="text-right">LTV</th>
            <th className="text-right">رزروها</th>
            <th className="text-right">آخرین فعالیت</th>
            <th className="text-right w-20">عملیات</th>
          </tr>
        </thead>
        <tbody>
          {customers.map(c => (
            <tr key={c.id} className="hover:bg-slate-800/30 transition-colors group">
              <td>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(c.id)}
                  onChange={e => onSelect(c.id, e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 accent-red-600"
                />
              </td>
              <td>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600/50 to-purple-600/50 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {c.name?.slice(0, 2)}
                  </div>
                  <div>
                    <Link href={`/customers/${c.id}`} className="text-sm font-medium text-slate-200 hover:text-red-400 transition-colors block">
                      {c.name}
                    </Link>
                    <p className="text-xs text-slate-600">#{c.id.slice(-6)}</p>
                  </div>
                </div>
              </td>
              <td>
                <span className="text-sm text-slate-400 font-mono" dir="ltr">{c.mobile}</span>
              </td>
              <td>
                <div className="flex flex-col gap-1">
                  <StatusBadge type={c.tier} showIcon />
                  <StatusBadge type={c.status} size="sm" />
                </div>
              </td>
              <td>
                <div className="min-w-[110px]">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400">سطح {toPersianNum(c.level)}</span>
                  </div>
                  <ProgressBar value={c.xp} max={c.xp + c.xpForNextLevel} color="#dc2626" />
                </div>
              </td>
              <td className="text-sm text-slate-300 font-medium">{formatToman(c.ltv)}</td>
              <td className="text-sm text-slate-400 text-center">{toPersianNum(c.totalBookings)}</td>
              <td className="text-xs text-slate-500">{timeAgo(c.lastActiveAt)}</td>
              <td>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link href={`/customers/${c.id}`} className="p-1.5 text-slate-500 hover:text-sky-400 hover:bg-sky-400/10 rounded-lg transition-colors" title="مشاهده">
                    <i className="fas fa-eye text-xs" />
                  </Link>
                  <button onClick={() => onAction('ban', c)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="مسدود کردن">
                    <i className="fas fa-ban text-xs" />
                  </button>
                  <button onClick={() => onAction('more', c)} className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 rounded-lg transition-colors" title="بیشتر">
                    <i className="fas fa-ellipsis-vertical text-xs" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
