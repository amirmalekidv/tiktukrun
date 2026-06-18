'use client';
import { useState, useEffect, useCallback } from 'react';
import { SectionHeader, StatsCard, Avatar, Pagination, EmptyState } from '@/components/ui';
import { toJalaliDateTime, persianNum } from '@/lib/utils/format';
import { Gift, RefreshCw } from 'lucide-react';
import { wheelApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface AdminSpin {
  id: string;
  paidWith: string;
  costPaid: number;
  awardedAt: string;
  user?: { id: string; fullName?: string | null; mobile?: string } | null;
  prize?: { id: string; name: string; color?: string } | null;
}

interface WheelStats {
  totalSpins: number;
  totalCoinsSpent: number;
  totalDiamondsSpent: number;
}

const PAGE_SIZE = 20;

// admin-wheel endpoints return { success, data, meta } directly (not double-wrapped)
function readSpins(res: any): { items: AdminSpin[]; total: number } {
  const body = res?.data;
  const items = body?.data ?? [];
  const total = body?.meta?.total ?? items.length;
  return { items, total };
}
function readStats(res: any): WheelStats | null {
  const body = res?.data;
  return body?.data ?? null;
}

export default function WheelSpinsPage() {
  const [items, setItems] = useState<AdminSpin[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<WheelStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [spinsRes, statsRes] = await Promise.all([
        wheelApi.getSpins({ page, limit: PAGE_SIZE }),
        wheelApi.getStats(),
      ]);
      const { items, total } = readSpins(spinsRes);
      setItems(items);
      setTotal(total);
      setStats(readStats(statsRes));
    } catch {
      toast.error('خطا در بارگذاری تاریخچه چرخش‌ها');
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const statCards = [
    { label: 'کل چرخش‌ها', value: persianNum(stats?.totalSpins ?? 0), color: 'blue' as const, icon: <Gift className="w-5 h-5" /> },
    { label: 'سکه مصرف شده', value: persianNum(stats?.totalCoinsSpent ?? 0), color: 'yellow' as const, icon: <Gift className="w-5 h-5" /> },
    { label: 'الماس مصرف شده', value: persianNum(stats?.totalDiamondsSpent ?? 0), color: 'purple' as const, icon: <Gift className="w-5 h-5" /> },
    { label: 'تعداد صفحه جاری', value: persianNum(items.length), color: 'green' as const, icon: <Gift className="w-5 h-5" /> },
  ];

  return (
    <div className="fade-in">
      <SectionHeader
        title="تاریخچه چرخش گردونه"
        breadcrumb={[{ label: 'گردونه شانس' }, { label: 'تاریخچه' }]}
        actions={
          <button onClick={load} className="btn-secondary" title="بارگذاری مجدد">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((s, i) => <StatsCard key={i} {...s} />)}
      </div>

      <div className="admin-card">
        {loading ? (
          <div className="text-center py-12 text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" /> در حال بارگذاری...
          </div>
        ) : items.length === 0 ? (
          <EmptyState title="چرخشی ثبت نشده" description="هنوز هیچ کاربری گردونه را نچرخانده است." />
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>کاربر</th>
                  <th>جایزه</th>
                  <th>پرداخت با</th>
                  <th>مقدار پرداخت</th>
                  <th>تاریخ</th>
                </tr>
              </thead>
              <tbody>
                {items.map(spin => {
                  const name = spin.user?.fullName || 'کاربر';
                  const isCoins = spin.paidWith === 'COINS';
                  return (
                    <tr key={spin.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <Avatar name={name} size="sm" />
                          <span className="text-white">{name}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: spin.prize?.color || '#475569' }} />
                          <span className="text-slate-300">{spin.prize?.name ?? '—'}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${isCoins ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'}`}>
                          {isCoins ? 'سکه' : 'الماس'}
                        </span>
                      </td>
                      <td className="text-slate-300">{persianNum(spin.costPaid)}</td>
                      <td className="text-slate-400 text-sm">{toJalaliDateTime(spin.awardedAt)}</td>
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
