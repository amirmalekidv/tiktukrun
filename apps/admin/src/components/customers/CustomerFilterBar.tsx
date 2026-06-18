'use client'
import { cn } from '@/lib/utils'

const tiers = [
  { value: '', label: 'همه' },
  { value: 'VIP', label: 'VIP' },
  { value: 'PLATINUM', label: 'پلاتینیوم' },
  { value: 'GOLD', label: 'طلایی' },
  { value: 'SILVER', label: 'نقره‌ای' },
  { value: 'BRONZE', label: 'برنزی' },
  { value: 'AT_RISK', label: 'در خطر' },
  { value: 'NEWCOMER', label: 'تازه‌وارد' },
]

const statuses = [
  { value: '', label: 'همه' },
  { value: 'ACTIVE', label: 'فعال' },
  { value: 'INACTIVE', label: 'غیرفعال' },
  { value: 'BANNED', label: 'مسدود' },
]

interface Filters {
  search: string
  tier: string
  status: string
  city: string
}

interface Props {
  filters: Filters
  onChange: (f: Partial<Filters>) => void
  selectedCount: number
  onBulkAction: (action: string) => void
}

export function CustomerFilterBar({ filters, onChange, selectedCount, onBulkAction }: Props) {
  return (
    <div className="admin-card p-4 space-y-3">
      {/* Main filters row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <i className="fas fa-search absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm" />
          <input
            type="text"
            value={filters.search}
            onChange={e => onChange({ search: e.target.value })}
            placeholder="جستجو در نام، موبایل، ایمیل..."
            className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg pr-9 pl-4 py-2 text-sm text-slate-200 placeholder:text-slate-600"
          />
        </div>

        {/* Tier filter */}
        <select
          value={filters.tier}
          onChange={e => onChange({ tier: e.target.value })}
          className="bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-300 appearance-none min-w-[130px]"
        >
          {tiers.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>

        {/* Status filter */}
        <select
          value={filters.status}
          onChange={e => onChange({ status: e.target.value })}
          className="bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-300 appearance-none min-w-[120px]"
        >
          {statuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        {/* City filter */}
        <input
          type="text"
          value={filters.city}
          onChange={e => onChange({ city: e.target.value })}
          placeholder="شهر..."
          className="bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-300 placeholder:text-slate-600 min-w-[100px]"
        />

        {/* Clear filters */}
        {(filters.search || filters.tier || filters.status || filters.city) && (
          <button
            onClick={() => onChange({ search: '', tier: '', status: '', city: '' })}
            className="text-xs text-red-400 hover:text-red-300 px-2 py-1.5 rounded-lg hover:bg-red-400/10 transition-colors"
          >
            <i className="fas fa-xmark ml-1" />
            پاک کردن
          </button>
        )}
      </div>

      {/* Bulk actions */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-3 pt-2 border-t border-slate-700/30">
          <span className="text-xs text-slate-400">{selectedCount} مورد انتخاب شده</span>
          <div className="flex items-center gap-2">
            {[
              { label: 'خروجی Excel', icon: 'fa-file-excel', action: 'export' },
              { label: 'ارسال SMS', icon: 'fa-message-sms', action: 'sms' },
              { label: 'افزودن به سگمنت', icon: 'fa-layer-group', action: 'segment' },
            ].map(a => (
              <button
                key={a.action}
                onClick={() => onBulkAction(a.action)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg border border-slate-700/30 transition-colors"
              >
                <i className={`fas ${a.icon}`} />
                {a.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
