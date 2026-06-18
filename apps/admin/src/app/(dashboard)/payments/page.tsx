'use client';
import { useState, useEffect, useCallback } from 'react';
import { Search, CreditCard, CheckCircle, XCircle, RotateCcw, RefreshCw, Clock } from 'lucide-react';
import { SectionHeader, StatsCard, FilterBar, Pagination, EmptyState } from '@/components/ui';
import { formatToman, persianNum, toJalaliDateTime } from '@/lib/utils/format';
import { paymentsApi } from '@/lib/api';
import toast from 'react-hot-toast';

// مدل واقعی بک‌اند: Payment { id, userId, bookingId, amount, method, status, gateway, gatewayRefId, paidAt, createdAt, booking }
type PaymentStatusT = 'SUCCESS' | 'PENDING' | 'FAILED' | 'REFUND';
type PaymentMethodT = 'WALLET' | 'ZARINPAL' | 'IDPAY' | 'BANK_TRANSFER' | 'CASH';

interface AdminPayment {
  id: string;
  userId: string;
  bookingId: string | null;
  amount: number;
  method: PaymentMethodT;
  status: PaymentStatusT;
  gateway: string | null;
  gatewayRefId: string | null;
  paidAt: string | null;
  createdAt: string;
  booking?: { id: string; code?: string } | null;
}

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  SUCCESS: 'bg-green-500/20 text-green-400',
  PENDING: 'bg-yellow-500/20 text-yellow-400',
  FAILED: 'bg-red-500/20 text-red-400',
  REFUND: 'bg-purple-500/20 text-purple-400',
};
const PAYMENT_STATUS_LABELS: Record<string, string> = {
  SUCCESS: 'موفق', PENDING: 'در انتظار', FAILED: 'ناموفق', REFUND: 'بازگشت وجه',
};
const PAYMENT_METHOD_LABELS: Record<string, string> = {
  WALLET: 'کیف پول', ZARINPAL: 'زرین‌پال', IDPAY: 'آی‌دی‌پی', BANK_TRANSFER: 'کارت‌به‌کارت', CASH: 'نقدی',
};

// خواندن داده از پاسخ بک‌اند (ResponseInterceptor → { success, data: {...} })
function unwrap<T = any>(res: any): T {
  const d = res?.data;
  if (d && typeof d === 'object' && 'data' in d) return d.data as T;
  return d as T;
}

export default function PaymentsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit };
      if (statusFilter) params.status = statusFilter;
      const res = await paymentsApi.getAll(params);
      const payload = unwrap<{ data: AdminPayment[]; total: number }>(res);
      setPayments(payload?.data ?? []);
      setTotal(payload?.total ?? 0);
    } catch {
      toast.error('خطا در بارگذاری پرداخت‌ها');
      setPayments([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFilter]);

  useEffect(() => { loadPayments(); }, [loadPayments]);

  // جستجوی کلاینتی روی صفحه‌ی جاری
  const filtered = payments.filter(p =>
    !search ||
    p.gatewayRefId?.includes(search) ||
    p.bookingId?.includes(search) ||
    p.userId?.includes(search)
  );

  const successAmount = payments.filter(p => p.status === 'SUCCESS').reduce((s, p) => s + (p.amount || 0), 0);
  const stats = [
    { label: 'موفق (این صفحه)', value: persianNum(payments.filter(p => p.status === 'SUCCESS').length), color: 'green' as const, icon: <CheckCircle className="w-5 h-5" /> },
    { label: 'در انتظار (این صفحه)', value: persianNum(payments.filter(p => p.status === 'PENDING').length), color: 'yellow' as const, icon: <Clock className="w-5 h-5" /> },
    { label: 'ناموفق (این صفحه)', value: persianNum(payments.filter(p => p.status === 'FAILED').length), color: 'red' as const, icon: <XCircle className="w-5 h-5" /> },
    { label: 'جمع موفق (این صفحه)', value: formatToman(String(successAmount)), color: 'blue' as const, icon: <CreditCard className="w-5 h-5" /> },
  ];

  return (
    <div className="fade-in">
      <SectionHeader
        title="پرداخت‌ها"
        subtitle="مدیریت و پیگیری پرداخت‌های درگاه"
        breadcrumb={[{ label: 'مالی' }, { label: 'پرداخت‌ها' }]}
        actions={
          <button onClick={loadPayments} className="btn-secondary" title="بارگذاری مجدد">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => <StatsCard key={i} {...s} />)}
      </div>

      <FilterBar onReset={() => { setSearch(''); setStatusFilter(''); setPage(1); }}>
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" placeholder="جستجو (refId، کد رزرو، شناسه کاربر)..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pr-10" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="select-field w-40">
          <option value="">همه وضعیت‌ها</option>
          <option value="SUCCESS">موفق</option>
          <option value="PENDING">در انتظار</option>
          <option value="FAILED">ناموفق</option>
          <option value="REFUND">بازگشت وجه</option>
        </select>
      </FilterBar>

      <div className="admin-card">
        {loading ? (
          <div className="text-center py-16 text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3" />
            در حال بارگذاری...
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState title="پرداختی یافت نشد" description="هیچ پرداختی با این فیلتر وجود ندارد." />
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>شناسه کاربر</th>
                  <th>کد رزرو</th>
                  <th>مبلغ</th>
                  <th>روش / درگاه</th>
                  <th>کد پیگیری</th>
                  <th>وضعیت</th>
                  <th>تاریخ</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(pay => (
                  <tr key={pay.id}>
                    <td>
                      <span className="text-slate-300 font-mono text-xs">{pay.userId?.slice(-8) || '—'}</span>
                    </td>
                    <td>
                      <span className="text-red-400 font-mono text-sm">{pay.booking?.code || (pay.bookingId ? `#${pay.bookingId.slice(-6)}` : '—')}</span>
                    </td>
                    <td>
                      <span className="text-white font-bold">{formatToman(String(pay.amount))}</span>
                    </td>
                    <td>
                      <div>
                        <span className="badge bg-blue-500/20 text-blue-400 text-xs">{PAYMENT_METHOD_LABELS[pay.method] || pay.method}</span>
                        {pay.gateway && <p className="text-slate-500 text-xs mt-1">{pay.gateway}</p>}
                      </div>
                    </td>
                    <td>
                      <p className="text-slate-300 font-mono text-xs">{pay.gatewayRefId || '—'}</p>
                    </td>
                    <td>
                      <span className={`badge ${PAYMENT_STATUS_COLORS[pay.status]}`}>
                        {PAYMENT_STATUS_LABELS[pay.status]}
                      </span>
                    </td>
                    <td>
                      <span className="text-slate-400 text-sm">{toJalaliDateTime(pay.paidAt || pay.createdAt)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && total > limit && (
          <Pagination currentPage={page} totalPages={Math.ceil(total / limit)} onPageChange={setPage} total={total} />
        )}
      </div>
    </div>
  );
}
