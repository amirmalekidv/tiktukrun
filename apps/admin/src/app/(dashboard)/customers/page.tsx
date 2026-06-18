'use client'
import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useCustomers } from '@/hooks/useCustomers'
import { CustomersTable } from '@/components/customers/CustomersTable'
import { CustomerFilterBar } from '@/components/customers/CustomerFilterBar'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { BanUserModal } from '@/components/customers/BanUserModal'
import { toPersianNum } from '@/lib/utils'
import { customersApi } from '@/lib/api/customers'
import toast from 'react-hot-toast'
import type { Customer } from '@/types'

export default function CustomersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    tier: '',
    status: '',
    city: '',
  })
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [banTarget, setBanTarget] = useState<Customer | null>(null)

  const { data: res, isLoading, mutate } = useCustomers({ ...filters, page, limit: 20 })
  const customers = res?.data || []
  const meta = res?.meta

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? customers.map(c => c.id) : [])
  }

  const handleSelect = (id: string, checked: boolean) => {
    setSelectedIds(prev => checked ? [...prev, id] : prev.filter(x => x !== id))
  }

  const handleAction = (action: string, customer: Customer) => {
    if (action === 'ban') setBanTarget(customer)
    else if (action === 'more') router.push(`/customers/${customer.id}`)
  }

  const handleBulkAction = (action: string) => {
    if (action === 'export') toast.success('در حال آماده‌سازی فایل Excel...')
    else if (action === 'sms') toast.success(`ارسال SMS به ${toPersianNum(selectedIds.length)} مشتری`)
    else if (action === 'segment') toast.success('در حال افزودن به سگمنت...')
  }

  const handleBan = async (reason: string) => {
    if (!banTarget) return
    try {
      await customersApi.ban(banTarget.id, reason)
      toast.success(`${banTarget.name} مسدود شد`)
      setBanTarget(null)
      mutate()
    } catch {
      toast.error('خطا در مسدود کردن کاربر')
    }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">مشتریان</h1>
          <p className="text-sm text-slate-500">
            {meta ? `${toPersianNum(meta.total ?? 0)} مشتری` : 'در حال بارگذاری...'}
          </p>
        </div>
        <button
          onClick={() => router.push('/customers/new')}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <i className="fas fa-plus" />
          مشتری جدید
        </button>
      </div>

      {/* Filters */}
      <CustomerFilterBar
        filters={filters}
        onChange={(f) => { setFilters(prev => ({ ...prev, ...f })); setPage(1) }}
        selectedCount={selectedIds.length}
        onBulkAction={handleBulkAction}
      />

      {/* Table */}
      <div className="admin-card overflow-hidden">
        {isLoading ? (
          <div className="p-5">
            <SkeletonTable rows={8} />
          </div>
        ) : customers.length === 0 ? (
          <EmptyState
            icon="fa-users-slash"
            title="مشتری یافت نشد"
            description="فیلترها را تغییر دهید یا مشتری جدید ایجاد کنید"
            action={{ label: 'ایجاد مشتری', onClick: () => router.push('/customers/new') }}
          />
        ) : (
          <CustomersTable
            customers={customers}
            selectedIds={selectedIds}
            onSelectAll={handleSelectAll}
            onSelect={handleSelect}
            onAction={handleAction}
          />
        )}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">
            صفحه {toPersianNum(page)} از {toPersianNum(meta.totalPages)}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <i className="fas fa-chevron-right text-xs" />
            </button>
            {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, meta.totalPages - 4)) + i
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm transition-colors ${
                    p === page ? 'bg-red-600 text-white' : 'text-slate-400 hover:bg-slate-800/50'
                  }`}
                >
                  {toPersianNum(p)}
                </button>
              )
            })}
            <button
              onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
              disabled={page === meta.totalPages}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <i className="fas fa-chevron-left text-xs" />
            </button>
          </div>
        </div>
      )}

      {/* Ban Modal */}
      {banTarget && (
        <BanUserModal
          customer={banTarget}
          onConfirm={handleBan}
          onClose={() => setBanTarget(null)}
        />
      )}
    </div>
  )
}
