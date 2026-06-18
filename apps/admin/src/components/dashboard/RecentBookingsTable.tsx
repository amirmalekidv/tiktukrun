import Link from 'next/link'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatToman, toPersianNum, formatJalali } from '@/lib/utils'
import type { Booking } from '@/types'

interface Props { bookings: Booking[] }

export function RecentBookingsTable({ bookings }: Props) {
  return (
    <div className="admin-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-200">رزروهای اخیر</h3>
        <Link href="/bookings" className="text-xs text-red-400 hover:text-red-300 transition-colors">
          مشاهده همه <i className="fas fa-arrow-left mr-1" />
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full admin-table">
          <thead>
            <tr>
              <th className="text-right">مشتری</th>
              <th className="text-right">بازی</th>
              <th className="text-right">تاریخ</th>
              <th className="text-right">مبلغ</th>
              <th className="text-right">وضعیت</th>
            </tr>
          </thead>
          <tbody>
            {bookings.slice(0, 8).map(b => (
              <tr key={b.id}>
                <td>
                  <p className="text-sm text-slate-200 font-medium">{b.customerName}</p>
                </td>
                <td>
                  <p className="text-sm text-slate-400">{b.gameName}</p>
                </td>
                <td className="text-xs text-slate-500">{formatJalali(b.scheduledAt)}</td>
                <td className="text-sm text-slate-300">{formatToman(b.totalAmount)}</td>
                <td><StatusBadge type={b.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
