'use client';
import { useState, useEffect, useCallback } from 'react';
import { Search, ArrowRightLeft, RefreshCw } from 'lucide-react';
import { SectionHeader, FilterBar, Avatar, Pagination, EmptyState } from '@/components/ui';
import { formatToman, persianNum, toJalaliDateTime, TRANSACTION_TYPE_LABELS, CURRENCY_LABELS } from '@/lib/utils/format';
import { transactionsApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface AdminTransaction {
  id: string;
  type: string;
  currency: string;
  amount: number;
  balanceAfter?: number;
  description?: string | null;
  createdAt: string;
  wallet?: {
    user?: { id: string; mobile: string; fullName?: string | null } | null;
  } | null;
}

const PAGE_SIZE = 20;

function readList(res: any): { items: AdminTransaction[]; total: number } {
  // ResponseInterceptor wraps as { success, data: { data, total, page, limit } }
  const body = res?.data;
  const payload = body && typeof body === 'object' && 'data' in body ? body.data : body;
  if (Array.isArray(payload)) return { items: payload, total: payload.length };
  return { items: payload?.data ?? [], total: payload?.total ?? 0 };
}

export default function TransactionsPage() {
  const [items, setItems] = useState<AdminTransaction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await transactionsApi.getAll({
        page,
        limit: PAGE_SIZE,
        ...(typeFilter ? { type: typeFilter } : {}),
        ...(currencyFilter ? { currency: currencyFilter } : {}),
      });
      const { items, total } = readList(res);
      setItems(items);
      setTotal(total);
    } catch {
      toast.error('خطا در بارگذاری تراکنش‌ها');
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, currencyFilter]);

  useEffect(() => { load(); }, [load]);

  // فیلتر متنی سمت کلاینت روی نتایج صفحه جاری
  const filtered = items.filter(tr => {
    const q = search.trim();
    if (!q) return true;
    const u = tr.wallet?.user;
    return (u?.fullName?.includes(q) || u?.mobile?.includes(q) || tr.description?.includes(q));
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="fade-in">
      <SectionHeader
        title="تراکنش‌ها"
        subtitle="همه تراکنش‌های کیف پول، سکه، الماس و XP"
        breadcrumb={[{ label: 'مالی' }, { label: 'تراکنش‌ها' }]}
        actions={
          <button onClick={load} className="btn-secondary" title="بارگذاری مجدد">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 mb-6">
        <div className="admin-card flex items-center gap-3">
          <span className="p-2 rounded-lg bg-blue-500/20 text-blue-400"><ArrowRightLeft className="w-5 h-5" /></span>
          <div>
            <p className="text-slate-400 text-sm">کل تراکنش‌ها</p>
            <p className="text-white font-bold text-xl">{persianNum(total)}</p>
          </div>
        </div>
      </div>

      <FilterBar onReset={() => { setSearch(''); setTypeFilter(''); setCurrencyFilter(''); setPage(1); }}>
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" placeholder="جستجو (کاربر، توضیحات)..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pr-10" />
        </div>
        <select value={currencyFilter} onChange={e => { setCurrencyFilter(e.target.value); setPage(1); }} className="select-field w-36">
          <option value="">همه ارزها</option>
          <option value="TOMAN">تومان</option>
          <option value="COINS">سکه</option>
          <option value="DIAMONDS">الماس</option>
          <option value="XP">XP</option>
        </select>
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }} className="select-field w-44">
          <option value="">همه انواع</option>
          {Object.entries(TRANSACTION_TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </FilterBar>

      <div className="admin-card">
        {loading ? (
          <div className="text-center py-12 text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" /> در حال بارگذاری...
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState title="تراکنشی یافت نشد" description="با فیلترهای فعلی نتیجه‌ای وجود ندارد." />
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>کاربر</th>
                  <th>نوع</th>
                  <th>ارز</th>
                  <th>مبلغ</th>
                  <th>توضیحات</th>
                  <th>تاریخ</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(tr => {
                  const amount = Number(tr.amount);
                  const isPositive = amount > 0;
                  const u = tr.wallet?.user;
                  const name = u?.fullName || 'کاربر';
                  const isToman = tr.currency === 'TOMAN' || tr.currency === 'toman';
                  return (
                    <tr key={tr.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <Avatar name={name} size="sm" />
                          <div>
                            <p className="text-white text-sm">{name}</p>
                            <p className="text-slate-500 text-xs font-mono">{u?.mobile ?? '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-slate-700 text-slate-300 text-xs">
                          {TRANSACTION_TYPE_LABELS[tr.type] || tr.type}
                        </span>
                      </td>
                      <td>
                        <span className="text-slate-400 text-sm">{CURRENCY_LABELS[tr.currency] || tr.currency}</span>
                      </td>
                      <td>
                        <span className={`font-bold text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                          {isPositive ? '+' : ''}{isToman ? formatToman(Math.abs(amount)) : persianNum(Math.abs(amount))}
                        </span>
                      </td>
                      <td>
                        <p className="text-slate-400 text-sm">{tr.description || '—'}</p>
                      </td>
                      <td>
                        <span className="text-slate-400 text-sm">{toJalaliDateTime(tr.createdAt)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} total={total} />
        )}
      </div>
    </div>
  );
}
