'use client'
import { useOverview } from '@/hooks/useAnalytics'
import { KpiRow } from '@/components/dashboard/KpiRow'
import { RevenueChart } from '@/components/dashboard/RevenueChart'
import { CategoryPieChart } from '@/components/dashboard/CategoryPieChart'
import { LiveActivitiesPanel } from '@/components/dashboard/LiveActivitiesPanel'
import { TopCustomersTable } from '@/components/dashboard/TopCustomersTable'
import { RecentBookingsTable } from '@/components/dashboard/RecentBookingsTable'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { FinancialKpisBox } from '@/components/dashboard/FinancialKpisBox'
import { Skeleton } from '@/components/ui/Skeleton'

export default function DashboardPage() {
  const { data: res, isLoading, error } = useOverview()
  const overview = res?.data

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">نمای کلی</h1>
          <p className="text-sm text-slate-500 mt-0.5">آمار و اطلاعات لحظه‌ای پلتفرم</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-700/30">
          <span className="live-dot" style={{ width: 6, height: 6 }} />
          <span>بروزرسانی خودکار هر ۶۰ ثانیه</span>
        </div>
      </div>

      {/* KPI Row */}
      <KpiRow kpis={overview?.kpis} isLoading={isLoading} />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="admin-card p-5">
              <Skeleton className="h-5 w-40 mb-4" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : overview?.revenueChart ? (
            <RevenueChart data={overview.revenueChart} />
          ) : null}
        </div>
        <div>
          {isLoading ? (
            <div className="admin-card p-5">
              <Skeleton className="h-5 w-32 mb-4" />
              <Skeleton className="h-36 w-full" />
            </div>
          ) : overview?.categoryStats ? (
            <CategoryPieChart data={overview.categoryStats} />
          ) : null}
        </div>
      </div>

      {/* Top Customers + Live Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          {overview?.topCustomers ? (
            <TopCustomersTable customers={overview.topCustomers} />
          ) : isLoading ? (
            <div className="admin-card p-5">
              <Skeleton className="h-5 w-40 mb-4" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : null}
        </div>
        <div>
          <LiveActivitiesPanel />
        </div>
      </div>

      {/* Recent Bookings + Quick Actions + Financial KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          {overview?.recentBookings ? (
            <RecentBookingsTable bookings={overview.recentBookings} />
          ) : isLoading ? (
            <div className="admin-card p-5">
              <Skeleton className="h-5 w-40 mb-4" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : null}
        </div>
        <div className="space-y-4">
          <QuickActions />
          {overview?.financialKpis && (
            <FinancialKpisBox {...overview.financialKpis} />
          )}
        </div>
      </div>

      {error && (
        <div className="admin-card p-4 border-red-500/30 bg-red-500/5">
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <i className="fas fa-circle-xmark" />
            <span>خطا در بارگذاری داده‌ها. لطفاً صفحه را رفرش کنید.</span>
          </div>
        </div>
      )}
    </div>
  )
}
