'use client';
import { useState } from 'react';
import { SectionHeader, StatsCard, FilterBar, Avatar, Pagination } from '@/components/ui';
import { toJalaliDateTime, persianNum } from '@/lib/utils/format';
import { Gift } from 'lucide-react';

const MOCK_SPINS = Array(20).fill(0).map((_, i) => ({
  id: `sp${i + 1}`,
  user: { name: ['علی احمدی', 'سارا محمدی', 'رضا کریمی'][i % 3] },
  prize: { name: ['۵۰ سکه', 'هیچی', '۵ الماس', '۵۰۰ XP', '۲۰٪ تخفیف'][i % 5], color: ['#f59e0b', '#475569', '#3b82f6', '#8b5cf6', '#22c55e'][i % 5] },
  paidWith: i % 2 === 0 ? 'coins' : 'diamonds',
  paidAmount: i % 2 === 0 ? 100 : 5,
  createdAt: new Date(Date.now() - i * 3600000).toISOString(),
}));

export default function WheelSpinsPage() {
  const [page, setPage] = useState(1);

  const stats = [
    { label: 'کل چرخش‌ها', value: persianNum(1842), color: 'blue' as const, icon: <Gift className="w-5 h-5" /> },
    { label: 'سکه مصرف شده', value: persianNum(184200), color: 'yellow' as const, icon: <Gift className="w-5 h-5" /> },
    { label: 'الماس مصرف شده', value: persianNum(9210), color: 'purple' as const, icon: <Gift className="w-5 h-5" /> },
    { label: 'پربرنده‌ترین', value: '۵۰ سکه', color: 'green' as const, icon: <Gift className="w-5 h-5" /> },
  ];

  return (
    <div className="fade-in">
      <SectionHeader
        title="تاریخچه چرخش گردونه"
        breadcrumb={[{ label: 'گردونه شانس' }, { label: 'تاریخچه' }]}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => <StatsCard key={i} {...s} />)}
      </div>

      <div className="admin-card">
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
              {MOCK_SPINS.map(spin => (
                <tr key={spin.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <Avatar name={spin.user.name} size="sm" />
                      <span className="text-white">{spin.user.name}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: spin.prize.color }} />
                      <span className="text-slate-300">{spin.prize.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${spin.paidWith === 'coins' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {spin.paidWith === 'coins' ? 'سکه' : 'الماس'}
                    </span>
                  </td>
                  <td className="text-slate-300">{persianNum(spin.paidAmount)}</td>
                  <td className="text-slate-400 text-sm">{toJalaliDateTime(spin.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={page} totalPages={10} onPageChange={setPage} total={200} />
      </div>
    </div>
  );
}
