'use client';
import { useState } from 'react';
import { Download, Search, TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react';
import { SectionHeader, StatsCard, FilterBar, Avatar, Pagination } from '@/components/ui';
import { formatToman, persianNum, toJalaliDateTime, TRANSACTION_TYPE_LABELS, CURRENCY_LABELS } from '@/lib/utils/format';
import { transactionsApi } from '@/lib/api';
import toast from 'react-hot-toast';

const MOCK_TRANSACTIONS = Array(20).fill(0).map((_, i) => ({
  id: `tr${i + 1}`,
  userId: `u${i % 5 + 1}`,
  user: { id: `u${i % 5 + 1}`, name: ['علی احمدی', 'سارا محمدی', 'رضا کریمی', 'نیلوفر', 'امیر'][i % 5], mobile: `0912${String(1000000 + i)}`, roles: [], isActive: true, isVip: false, level: 1, tier: 'BRONZE' as const, xp: 0, coins: 0, diamonds: 0, createdAt: '' },
  type: ['DEPOSIT', 'BOOKING_PAYMENT', 'WHEEL_SPIN', 'REWARD', 'BOOKING_REFUND'][i % 5],
  currency: ['toman', 'toman', 'coins', 'xp', 'toman'][i % 5] as 'toman',
  amount: String((i % 3 === 2 ? -1 : 1) * (i + 1) * 50000),
  description: ['واریز کیف پول', 'پرداخت رزرو اتاق فرار', 'چرخش گردونه شانس', 'پاداش دعوت دوست', 'بازگشت وجه رزرو'][i % 5],
  createdAt: new Date(Date.now() - i * 3600000).toISOString(),
}));

export default function TransactionsPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState('');
  const [page, setPage] = useState(1);

  const handleExport = async () => {
    try {
      toast.success('در حال آماده‌سازی فایل Excel...');
      // Real: await transactionsApi.exportExcel()
    } catch { toast.error('خطا'); }
  };

  const stats = [
    { label: 'کل ورودی', value: formatToman('12500000'), color: 'green' as const, icon: <TrendingUp className="w-5 h-5" /> },
    { label: 'کل خروجی', value: formatToman('3200000'), color: 'red' as const, icon: <TrendingDown className="w-5 h-5" /> },
    { label: 'خالص', value: formatToman('9300000'), color: 'blue' as const, icon: <ArrowRightLeft className="w-5 h-5" /> },
    { label: 'بازگشت وجه', value: formatToman('750000'), color: 'yellow' as const, icon: <TrendingDown className="w-5 h-5" /> },
  ];

  return (
    <div className="fade-in">
      <SectionHeader
        title="تراکنش‌ها"
        subtitle="همه تراکنش‌های کیف پول، سکه، الماس و XP"
        breadcrumb={[{ label: 'مالی' }, { label: 'تراکنش‌ها' }]}
        actions={
          <button onClick={handleExport} className="btn-secondary">
            <Download className="w-4 h-4" />
            خروجی Excel
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => <StatsCard key={i} {...s} />)}
      </div>

      <FilterBar onReset={() => { setSearch(''); setTypeFilter(''); setCurrencyFilter(''); }}>
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" placeholder="جستجو (کاربر، توضیحات)..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pr-10" />
        </div>
        <select value={currencyFilter} onChange={e => setCurrencyFilter(e.target.value)} className="select-field w-36">
          <option value="">همه ارزها</option>
          <option value="toman">تومان</option>
          <option value="coins">سکه</option>
          <option value="diamonds">الماس</option>
          <option value="xp">XP</option>
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="select-field w-44">
          <option value="">همه انواع</option>
          <option value="DEPOSIT">واریز</option>
          <option value="BOOKING_PAYMENT">پرداخت رزرو</option>
          <option value="WHEEL_SPIN">گردونه شانس</option>
          <option value="REWARD">پاداش</option>
          <option value="BOOKING_REFUND">بازگشت وجه</option>
        </select>
      </FilterBar>

      <div className="admin-card">
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
              {MOCK_TRANSACTIONS.map(tr => {
                const amount = Number(tr.amount);
                const isPositive = amount > 0;
                return (
                  <tr key={tr.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <Avatar name={tr.user.name} size="sm" />
                        <div>
                          <p className="text-white text-sm">{tr.user.name}</p>
                          <p className="text-slate-500 text-xs font-mono">{tr.user.mobile}</p>
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
                        {isPositive ? '+' : ''}{tr.currency === 'toman' ? formatToman(Math.abs(amount)) : persianNum(Math.abs(amount))}
                      </span>
                    </td>
                    <td>
                      <p className="text-slate-400 text-sm">{tr.description}</p>
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
        <Pagination currentPage={page} totalPages={10} onPageChange={setPage} total={200} />
      </div>
    </div>
  );
}
