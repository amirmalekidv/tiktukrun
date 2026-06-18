import Link from 'next/link'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatToman, toPersianNum, getAvatarUrl, timeAgo } from '@/lib/utils'
import type { Customer } from '@/types'

interface Props { customers: Customer[] }

export function TopCustomersTable({ customers }: Props) {
  return (
    <div className="admin-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-200">برترین مشتریان</h3>
        <Link href="/customers" className="text-xs text-red-400 hover:text-red-300 transition-colors">
          مشاهده همه <i className="fas fa-arrow-left mr-1" />
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full admin-table">
          <thead>
            <tr>
              <th className="text-right">مشتری</th>
              <th className="text-right">وضعیت</th>
              <th className="text-right">رزروها</th>
              <th className="text-right">LTV</th>
              <th className="text-right">آخرین فعالیت</th>
            </tr>
          </thead>
          <tbody>
            {customers.slice(0, 8).map((c, i) => (
              <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                <td>
                  <div className="flex items-center gap-2.5">
                    <div className="relative flex-shrink-0">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600/50 to-purple-600/50 flex items-center justify-center text-white text-xs font-bold">
                        {c.name?.slice(0, 2)}
                      </div>
                      {i < 3 && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center text-[8px] font-bold text-white">
                          {i + 1}
                        </div>
                      )}
                    </div>
                    <div>
                      <Link href={`/customers/${c.id}`} className="text-sm font-medium text-slate-200 hover:text-red-400 transition-colors">
                        {c.name}
                      </Link>
                      <p className="text-xs text-slate-500" dir="ltr">{c.mobile}</p>
                    </div>
                  </div>
                </td>
                <td><StatusBadge type={c.tier} showIcon /></td>
                <td className="text-sm text-slate-300">{toPersianNum(c.totalBookings)}</td>
                <td className="text-sm text-slate-300">{formatToman(c.ltv)}</td>
                <td className="text-xs text-slate-500">{timeAgo(c.lastActiveAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
