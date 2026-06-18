import { StatusBadge } from '@/components/ui/StatusBadge'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatToman, toPersianNum, formatJalali } from '@/lib/utils'
import { useCustomerTransactions } from '@/hooks/useCustomers'
import type { Transaction } from '@/types'

interface Props { customerId: string }

const typeLabels: Record<string, { label: string; color: string }> = {
  CHARGE: { label: 'شارژ کیف پول', color: 'text-emerald-400' },
  DEBIT: { label: 'پرداخت', color: 'text-red-400' },
  REFUND: { label: 'برگشت وجه', color: 'text-sky-400' },
  REWARD: { label: 'پاداش', color: 'text-amber-400' },
  GIFT: { label: 'هدیه', color: 'text-purple-400' },
}

export function TransactionsTab({ customerId }: Props) {
  const { data: res, isLoading } = useCustomerTransactions(customerId)
  const transactions: Transaction[] = res?.data || []

  if (isLoading) return <div className="p-4"><SkeletonTable rows={5} /></div>
  if (!transactions.length) return <EmptyState icon="fa-credit-card" title="تراکنشی وجود ندارد" />

  return (
    <div className="overflow-x-auto">
      <table className="w-full admin-table">
        <thead>
          <tr>
            <th className="text-right">نوع</th>
            <th className="text-right">توضیحات</th>
            <th className="text-right">مبلغ / واحد</th>
            <th className="text-right">تاریخ</th>
            <th className="text-right">وضعیت</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t: Transaction) => {
            const typeInfo = typeLabels[t.type] || { label: t.type, color: 'text-slate-400' }
            return (
              <tr key={t.id}>
                <td>
                  <span className={`text-sm font-medium ${typeInfo.color}`}>{typeInfo.label}</span>
                </td>
                <td className="text-sm text-slate-400">{t.description}</td>
                <td>
                  <p className={`text-sm font-medium ${t.type === 'DEBIT' ? 'text-red-400' : 'text-emerald-400'}`}>
                    {t.type === 'DEBIT' ? '-' : '+'}{t.currency === 'TOMAN' ? formatToman(t.amount) : `${toPersianNum(t.amount)} ${t.currency === 'COINS' ? 'سکه' : 'XP'}`}
                  </p>
                </td>
                <td className="text-xs text-slate-500">{formatJalali(t.createdAt, 'datetime')}</td>
                <td><StatusBadge type={t.status} /></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
