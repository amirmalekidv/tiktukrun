'use client';

import { useState, useEffect, useCallback } from 'react';
import { SectionHeader, EmptyState, Pagination } from '@/components/ui';
import { FiTag, FiFilter } from 'react-icons/fi';
import { RefreshCw } from 'lucide-react';
import { discountsApi } from '@/lib/api';
import { toJalaliDateTime, formatToman, persianNum } from '@/lib/utils/format';
import toast from 'react-hot-toast';

interface DiscountCodeLite {
  id: string;
  code: string;
  usedCount?: number;
}

interface DiscountUsage {
  id: string;
  codeId: string;
  userId: string;
  bookingId: string;
  savedAmount: number;
  createdAt: string;
  booking?: { id: string; code?: string | null; status?: string | null; totalPrice?: number | null } | null;
}

const PAGE_SIZE = 20;

function unwrap<T = unknown>(res: { data?: unknown } | null | undefined): T | null {
  const d = (res as { data?: unknown } | null | undefined)?.data;
  if (d && typeof d === 'object' && 'data' in (d as Record<string, unknown>)) {
    return (d as { data: T }).data;
  }
  return (d as T) ?? null;
}

function unwrapPaginated<T>(res: { data?: unknown } | null | undefined): { items: T[]; total: number } {
  const d = (res as { data?: unknown } | null | undefined)?.data;
  if (d && typeof d === 'object' && 'data' in (d as Record<string, unknown>)) {
    const inner = d as { data: T[]; total?: number };
    return { items: Array.isArray(inner.data) ? inner.data : [], total: inner.total ?? inner.data?.length ?? 0 };
  }
  const arr = Array.isArray(d) ? (d as T[]) : [];
  return { items: arr, total: arr.length };
}

export default function DiscountUsagesPage() {
  const [codes, setCodes] = useState<DiscountCodeLite[]>([]);
  const [selectedCode, setSelectedCode] = useState<string>('');
  const [usages, setUsages] = useState<DiscountUsage[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loadingCodes, setLoadingCodes] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadCodes = useCallback(async () => {
    setLoadingCodes(true);
    try {
      const res = await discountsApi.getCodes({ limit: 200 });
      const { items } = unwrapPaginated<DiscountCodeLite>(res);
      setCodes(items);
      if (items.length && !selectedCode) setSelectedCode(items[0].id);
    } catch {
      toast.error('خطا در بارگذاری کدها');
      setCodes([]);
    } finally {
      setLoadingCodes(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUsages = useCallback(async () => {
    if (!selectedCode) return;
    setLoading(true);
    try {
      const res = await discountsApi.getUsages(selectedCode, { page, limit: PAGE_SIZE });
      const { items, total: t } = unwrapPaginated<DiscountUsage>(res);
      setUsages(items);
      setTotal(t);
    } catch {
      toast.error('خطا در بارگذاری سابقه استفاده');
      setUsages([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [selectedCode, page]);

  useEffect(() => {
    loadCodes();
  }, [loadCodes]);

  useEffect(() => {
    loadUsages();
  }, [loadUsages]);

  const totalSaved = usages.reduce((a, u) => a + (u.savedAmount ?? 0), 0);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentCode = codes.find((c) => c.id === selectedCode);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="سابقه استفاده کدها"
        subtitle="تاریخچه استفاده از هر کد تخفیف"
        icon={<FiTag />}
      />

      {/* Code selector */}
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex flex-wrap gap-3 items-center">
        <FiFilter className="text-slate-400 w-4 h-4" />
        <select
          value={selectedCode}
          onChange={(e) => { setSelectedCode(e.target.value); setPage(1); }}
          className="input-field min-w-56"
          disabled={loadingCodes}
        >
          {codes.length === 0 && <option value="">کدی موجود نیست</option>}
          {codes.map((c) => (
            <option key={c.id} value={c.id}>{c.code}</option>
          ))}
        </select>
        {currentCode && (
          <span className="text-slate-400 text-sm">
            تعداد استفاده ثبت‌شده: {persianNum(total)}
          </span>
        )}
      </div>

      {/* Stats */}
      {selectedCode && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <p className="text-2xl font-bold text-white">{persianNum(total)}</p>
            <p className="text-slate-400 text-sm mt-1">کل استفاده‌ها (این کد)</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <p className="text-2xl font-bold text-red-400">{formatToman(totalSaved)}</p>
            <p className="text-slate-400 text-sm mt-1">تخفیف اعمال‌شده (این صفحه)</p>
          </div>
        </div>
      )}

      {loadingCodes || loading ? (
        <div className="flex items-center justify-center py-24">
          <RefreshCw className="w-8 h-8 text-red-400 animate-spin" />
        </div>
      ) : usages.length === 0 ? (
        <EmptyState title="رکوردی یافت نشد" description="برای این کد استفاده‌ای ثبت نشده است." />
      ) : (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-right text-slate-400 text-sm font-medium p-4">رزرو</th>
                <th className="text-right text-slate-400 text-sm font-medium p-4">کاربر</th>
                <th className="text-right text-slate-400 text-sm font-medium p-4">تخفیف اعمال‌شده</th>
                <th className="text-right text-slate-400 text-sm font-medium p-4">وضعیت رزرو</th>
                <th className="text-right text-slate-400 text-sm font-medium p-4">تاریخ</th>
              </tr>
            </thead>
            <tbody>
              {usages.map((u) => (
                <tr key={u.id} className="border-b border-slate-700/50 hover:bg-slate-750 transition-colors">
                  <td className="p-4">
                    <span className="text-slate-300 text-sm font-mono">{u.booking?.code ?? u.bookingId}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-slate-400 text-xs font-mono">{u.userId}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-red-400 font-medium">{formatToman(u.savedAmount)}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-slate-300 text-sm">{u.booking?.status ?? '-'}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-slate-400 text-sm">{toJalaliDateTime(u.createdAt)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} total={total} />
        </div>
      )}
    </div>
  );
}
