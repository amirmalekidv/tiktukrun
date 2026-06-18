'use client';
import { useState } from 'react';
import { Download, Search, CreditCard, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { SectionHeader, StatsCard, FilterBar, Avatar, StatusBadge, Pagination } from '@/components/ui';
import { formatToman, persianNum, toJalaliDateTime } from '@/lib/utils/format';
import toast from 'react-hot-toast';

const MOCK_PAYMENTS = Array(15).fill(0).map((_, i) => ({
  id: `p${i + 1}`,
  userId: `u${i % 5 + 1}`,
  user: { name: ['علی احمدی', 'سارا محمدی', 'رضا کریمی', 'نیلوفر', 'امیر'][i % 5], mobile: `0912${String(1000000 + i)}` },
  bookingCode: `BK-${String(100000 + i).padStart(6, '0')}`,
  amount: String((i + 1) * 250000),
  gateway: 'ZarinPal',
  refId: `ZP-${String(987654321 - i).padStart(9, '0')}`,
  trackId: `TR${String(123456 + i)}`,
  status: ['SUCCESS', 'PENDING', 'FAILED', 'REFUNDED', 'SUCCESS'][i % 5] as 'SUCCESS',
  createdAt: new Date(Date.now() - i * 3600000).toISOString(),
}));

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  SUCCESS: 'bg-green-500/20 text-green-400',
  PENDING: 'bg-yellow-500/20 text-yellow-400',
  FAILED: 'bg-red-500/20 text-red-400',
  REFUNDED: 'bg-purple-500/20 text-purple-400',
};
const PAYMENT_STATUS_LABELS: Record<string, string> = {
  SUCCESS: 'موفق', PENDING: 'در انتظار', FAILED: 'ناموفق', REFUNDED: 'بازگشت وجه',
};

export default function PaymentsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const stats = [
    { label: 'موفق', value: persianNum(MOCK_PAYMENTS.filter(p => p.status === 'SUCCESS').length), color: 'green' as const, icon: <CheckCircle className="w-5 h-5" /> },
    { label: 'ناموفق', value: persianNum(MOCK_PAYMENTS.filter(p => p.status === 'FAILED').length), color: 'red' as const, icon: <XCircle className="w-5 h-5" /> },
    { label: 'بازگشت وجه', value: persianNum(MOCK_PAYMENTS.filter(p => p.status === 'REFUNDED').length), color: 'yellow' as const, icon: <RotateCcw className="w-5 h-5" /> },
    { label: 'درآمد امروز', value: formatToman('3750000'), color: 'blue' as const, icon: <CreditCard className="w-5 h-5" /> },
  ];

  const filtered = MOCK_PAYMENTS.filter(p =>
    (!statusFilter || p.status === statusFilter) &&
    (!search || p.user.name.includes(search) || p.bookingCode.includes(search) || p.refId?.includes(search) || '')
  );

  return (
    <div className="fade-in">
      <SectionHeader
        title="پرداخت‌ها"
        subtitle="مدیریت پرداخت‌های زرین‌پال"
        breadcrumb={[{ label: 'مالی' }, { label: 'پرداخت‌ها' }]}
        actions={
          <button onClick={() => toast.success('در حال دانلود...')} className="btn-secondary">
            <Download className="w-4 h-4" /> Excel
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => <StatsCard key={i} {...s} />)}
      </div>

      <FilterBar onReset={() => { setSearch(''); setStatusFilter(''); }}>
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" placeholder="جستجو (کاربر، کد رزرو، refId)..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pr-10" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="select-field w-40">
          <option value="">همه وضعیت‌ها</option>
          <option value="SUCCESS">موفق</option>
          <option value="PENDING">در انتظار</option>
          <option value="FAILED">ناموفق</option>
          <option value="REFUNDED">بازگشت وجه</option>
        </select>
      </FilterBar>

      <div className="admin-card">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>کاربر</th>
                <th>کد رزرو</th>
                <th>مبلغ</th>
                <th>درگاه</th>
                <th>کد پیگیری</th>
                <th>وضعیت</th>
                <th>تاریخ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(pay => (
                <tr key={pay.id}>
                  <td>
                    <div>
                      <p className="text-white text-sm">{pay.user.name}</p>
                      <p className="text-slate-500 text-xs font-mono">{pay.user.mobile}</p>
                    </div>
                  </td>
                  <td>
                    <span className="text-red-400 font-mono text-sm">#{pay.bookingCode}</span>
                  </td>
                  <td>
                    <span className="text-white font-bold">{formatToman(pay.amount)}</span>
                  </td>
                  <td>
                    <span className="badge bg-blue-500/20 text-blue-400">{pay.gateway}</span>
                  </td>
                  <td>
                    <div>
                      <p className="text-slate-300 font-mono text-xs">{pay.refId}</p>
                      <p className="text-slate-500 font-mono text-xs">{pay.trackId}</p>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${PAYMENT_STATUS_COLORS[pay.status]}`}>
                      {PAYMENT_STATUS_LABELS[pay.status]}
                    </span>
                  </td>
                  <td>
                    <span className="text-slate-400 text-sm">{toJalaliDateTime(pay.createdAt)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={page} totalPages={5} onPageChange={setPage} total={filtered.length} />
      </div>
    </div>
  );
}
