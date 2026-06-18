import Link from 'next/link'
import { useSegmentMembers } from '@/hooks/useSegments'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { formatToman, toPersianNum, timeAgo } from '@/lib/utils'
import type { Customer } from '@/types'

interface Props { segmentId: string }

export function SegmentMembersTable({ segmentId }: Props) {
  const { data: res, isLoading } = useSegmentMembers(segmentId)
  const members = res?.data || []

  if (isLoading) return <div className="p-4"><SkeletonTable rows={5} /></div>

  return (
    <div className="overflow-x-auto">
      <table className="w-full admin-table">
        <thead>
          <tr>
            <th className="text-right">مشتری</th>
            <th className="text-right">وضعیت</th>
            <th className="text-right">LTV</th>
            <th className="text-right">آخرین فعالیت</th>
          </tr>
        </thead>
        <tbody>
          {(members as Customer[]).map((c) => (
            <tr key={c.id}>
              <td>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-600/50 to-purple-600/50 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {c.name?.slice(0, 2)}
                  </div>
                  <div>
                    <Link href={`/customers/${c.id}`} className="text-sm text-slate-200 hover:text-red-400 transition-colors">{c.name}</Link>
                    <p className="text-xs text-slate-600" dir="ltr">{c.mobile}</p>
                  </div>
                </div>
              </td>
              <td><StatusBadge type={c.tier} showIcon /></td>
              <td className="text-sm text-slate-300">{formatToman(c.ltv)}</td>
              <td className="text-xs text-slate-500">{timeAgo(c.lastActiveAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
