'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { branchManagersApi, type BranchManagerUser } from '@/lib/api'
import { EmptyState } from '@/components/ui/EmptyState'
import { toPersianNum } from '@/lib/utils'
import { can } from '@/lib/permissions'
import { useAuthStore } from '@/stores/authStore'

const PAGE_SIZE = 20

function readList(res: { data?: unknown } | null | undefined): { items: BranchManagerUser[]; total: number } {
  const body = (res as { data?: unknown } | null | undefined)?.data
  if (body && typeof body === 'object' && 'data' in (body as Record<string, unknown>)) {
    const inner = body as { data: BranchManagerUser[]; meta?: { total?: number }; total?: number }
    const items = Array.isArray(inner.data) ? inner.data : []
    return { items, total: inner.meta?.total ?? inner.total ?? items.length }
  }
  const arr = Array.isArray(body) ? (body as BranchManagerUser[]) : []
  return { items: arr, total: arr.length }
}

export default function BranchManagersPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const canCreate = can(user, 'users.write')

  const [items, setItems] = useState<BranchManagerUser[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = { page, limit: PAGE_SIZE }
      if (search.trim()) params.q = search.trim()
      const res = await branchManagersApi.getAll(params)
      const { items: rows, total: t } = readList(res)
      setItems(rows)
      setTotal(t)
    } catch {
      toast.error('خطا در بارگذاری مدیران شعبه')
      setItems([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    load()
  }, [load])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-100">مدیران شعبه</h1>
          <p className="text-sm text-slate-500">
            {loading ? 'در حال بارگذاری...' : `${toPersianNum(total)} مدیر شعبه`}
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => router.push('/branch-managers/new')}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <i className="fas fa-plus" />
            مدیر شعبه جدید
          </button>
        )}
      </div>

      <div className="admin-card p-4">
        <div className="relative">
          <i className="fas fa-search absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="جستجو در نام، موبایل، ایمیل..."
            className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg pr-9 pl-4 py-2 text-sm text-slate-200 placeholder:text-slate-600"
          />
        </div>
      </div>

      <div className="admin-card overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-slate-500 text-sm">در حال بارگذاری...</div>
        ) : items.length === 0 ? (
          <EmptyState
            icon="fa-user-tie"
            title="مدیر شعبه‌ای یافت نشد"
            description="یک مدیر شعبه جدید بسازید تا بتواند با موبایل و رمز وارد پنل شود"
            action={canCreate ? { label: 'ایجاد مدیر شعبه', onClick: () => router.push('/branch-managers/new') } : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full admin-table">
              <thead>
                <tr>
                  <th className="text-right">مدیر</th>
                  <th className="text-right">موبایل</th>
                  <th className="text-right">ایمیل</th>
                  <th className="text-right">شعبه‌ها</th>
                  <th className="text-right">وضعیت</th>
                </tr>
              </thead>
              <tbody>
                {items.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600/50 to-amber-600/40 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {(m.fullName || m.mobile || '?').slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-200">{m.fullName || 'بدون نام'}</p>
                          <p className="text-xs text-slate-600">#{String(m.id).slice(-6)}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-sm text-slate-400 font-mono" dir="ltr">{m.mobile || '—'}</span>
                    </td>
                    <td>
                      <span className="text-sm text-slate-400" dir="ltr">{m.email || '—'}</span>
                    </td>
                    <td>
                      {(m.managedBranches ?? []).length === 0 ? (
                        <span className="text-xs text-amber-400">بدون شعبه</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {(m.managedBranches ?? []).map((b) => (
                            <span key={b.id} className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700/50">
                              {b.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`text-xs px-2 py-1 rounded-md ${m.isBanned ? 'bg-red-500/15 text-red-300' : m.isActive === false ? 'bg-slate-700 text-slate-400' : 'bg-emerald-500/15 text-emerald-300'}`}>
                        {m.isBanned ? 'مسدود' : m.isActive === false ? 'غیرفعال' : 'فعال'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">
            صفحه {toPersianNum(page)} از {toPersianNum(totalPages)}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 disabled:opacity-30"
            >
              <i className="fas fa-chevron-right text-xs" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 disabled:opacity-30"
            >
              <i className="fas fa-chevron-left text-xs" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
