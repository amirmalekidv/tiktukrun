import { KpiCard } from '@/components/ui/KpiCard'
import { SkeletonCard } from '@/components/ui/Skeleton'
import type { OverviewData } from '@/types'

interface Props {
  kpis?: OverviewData['kpis']
  isLoading?: boolean
}

export function KpiRow({ kpis, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
      </div>
    )
  }

  if (!kpis) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <KpiCard data={kpis.monthlyRevenue} />
      <KpiCard data={kpis.newCustomers} />
      <KpiCard data={kpis.activeBookings} />
      <KpiCard data={kpis.conversionRate} />
    </div>
  )
}
