import { StatusBadge } from '@/components/ui/StatusBadge'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatToman, toPersianNum, formatJalali } from '@/lib/utils'
import { useCustomerBookings } from '@/hooks/useCustomers'
import type { Booking } from '@/types'

interface Props { customerId: string }

export function BookingsTab({ customerId }: Props) {
  const { data: res, isLoading } = useCustomerBookings(customerId)
  const bookings: Booking[] = res?.data || []

  if (isLoading) return <div className="p-4"><SkeletonTable rows={5} /></div>
  if (!bookings.length) return <EmptyState icon="fa-calendar-xmark" title="رزروی وجود ندارد" />

  return (
    <div className="overflow-x-auto">
      <table className="w-full admin-table">
        <thead>
          <tr>
            <th className="text-right">بازی</th>
            <th className="text-right">تاریخ</th>
            <th className="text-right">شرکت‌کنندگان</th>
            <th className="text-right">مبلغ</th>
            <th className="text-right">وضعیت</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b: Booking) => (
            <tr key={b.id}>
              <td>
                <p className="text-sm font-medium text-slate-200">{b.gameName}</p>
                <p className="text-xs text-slate-500">{b.branchName}</p>
              </td>
              <td className="text-sm text-slate-400">{formatJalali(b.scheduledAt, 'datetime')}</td>
              <td className="text-sm text-slate-400 text-center">{toPersianNum(b.participants)} نفر</td>
              <td className="text-sm text-slate-300">{formatToman(b.totalAmount)}</td>
              <td><StatusBadge type={b.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
