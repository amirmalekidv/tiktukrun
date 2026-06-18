'use client';

import { useState } from 'react';
import { SectionHeader, StatusBadge } from '@/components/ui';
import { FiTag, FiDownload, FiFilter, FiTrendingUp } from 'react-icons/fi';

interface DiscountUsage {
  id: string;
  code: string;
  userId: string;
  userName: string;
  bookingId: string;
  gameName: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  usedAt: string;
  status: 'applied' | 'reversed';
}

const MOCK_USAGES: DiscountUsage[] = [
  { id: '1', code: 'NOWRUZ1403', userId: 'u1', userName: 'علی محمدی', bookingId: 'B-1001', gameName: 'قلعه اشباح', discountType: 'percent', discountValue: 20, originalAmount: 350000, discountAmount: 70000, finalAmount: 280000, usedAt: '۱۴۰۳/۰۴/۱۵ ۱۴:۳۰', status: 'applied' },
  { id: '2', code: 'VIP50', userId: 'u2', userName: 'مریم احمدی', bookingId: 'B-1002', gameName: 'گنج دزد دریایی', discountType: 'percent', discountValue: 50, originalAmount: 300000, discountAmount: 150000, finalAmount: 150000, usedAt: '۱۴۰۳/۰۴/۱۵ ۱۳:۱۵', status: 'applied' },
  { id: '3', code: 'WELCOME100', userId: 'u3', userName: 'رضا کریمی', bookingId: 'B-1003', gameName: 'آزمایشگاه مخفی', discountType: 'fixed', discountValue: 100000, originalAmount: 280000, discountAmount: 100000, finalAmount: 180000, usedAt: '۱۴۰۳/۰۴/۱۵ ۱۱:۰۰', status: 'applied' },
  { id: '4', code: 'BIRTHDAY25', userId: 'u4', userName: 'فاطمه حسینی', bookingId: 'B-1004', gameName: 'عملیات فرار', discountType: 'percent', discountValue: 25, originalAmount: 250000, discountAmount: 62500, finalAmount: 187500, usedAt: '۱۴۰۳/۰۴/۱۴ ۱۶:۴۵', status: 'applied' },
  { id: '5', code: 'NOWRUZ1403', userId: 'u5', userName: 'محمد رضایی', bookingId: 'B-1005', gameName: 'قلعه اشباح', discountType: 'percent', discountValue: 20, originalAmount: 350000, discountAmount: 70000, finalAmount: 280000, usedAt: '۱۴۰۳/۰۴/۱۴ ۱۰:۳۰', status: 'reversed' },
  { id: '6', code: 'VIP50', userId: 'u6', userName: 'زهرا نوری', bookingId: 'B-1006', gameName: 'گنج دزد دریایی', discountType: 'percent', discountValue: 50, originalAmount: 300000, discountAmount: 150000, finalAmount: 150000, usedAt: '۱۴۰۳/۰۴/۱۳ ۱۸:۰۰', status: 'applied' },
];

const CODE_SUMMARY: Record<string, { uses: number; totalDiscount: number; uniqueUsers: number }> = {};
MOCK_USAGES.forEach(u => {
  if (!CODE_SUMMARY[u.code]) CODE_SUMMARY[u.code] = { uses: 0, totalDiscount: 0, uniqueUsers: 0 };
  CODE_SUMMARY[u.code].uses++;
  CODE_SUMMARY[u.code].totalDiscount += u.discountAmount;
});

export default function DiscountUsagesPage() {
  const [search, setSearch] = useState('');
  const [filterCode, setFilterCode] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const filtered = MOCK_USAGES.filter(u => {
    const matchSearch = u.userName.includes(search) || u.bookingId.includes(search) || u.code.includes(search);
    const matchCode = !filterCode || u.code === filterCode;
    const matchStatus = !filterStatus || u.status === filterStatus;
    return matchSearch && matchCode && matchStatus;
  });

  const totalDiscount = filtered.reduce((a, u) => a + u.discountAmount, 0);
  const totalOriginal = filtered.reduce((a, u) => a + u.originalAmount, 0);
  const uniqueCodes = Array.from(new Set(MOCK_USAGES.map(u => u.code)));

  return (
    <div className="space-y-6">
      <SectionHeader
        title="سابقه استفاده کدها"
        subtitle="تاریخچه کامل استفاده از کدهای تخفیف"
        icon={<FiTag />}
        action={
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors text-sm">
            <FiDownload className="w-4 h-4" />
            خروجی Excel
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <p className="text-2xl font-bold text-white">{MOCK_USAGES.length}</p>
          <p className="text-slate-400 text-sm mt-1">کل استفاده‌ها</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <p className="text-2xl font-bold text-red-400">{(totalDiscount / 1000000).toFixed(2)}M</p>
          <p className="text-slate-400 text-sm mt-1">کل تخفیف اعمال شده</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <p className="text-2xl font-bold text-purple-400">{uniqueCodes.length}</p>
          <p className="text-slate-400 text-sm mt-1">کدهای فعال</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <FiTrendingUp className="w-5 h-5 text-green-400 mb-1" />
          <p className="text-2xl font-bold text-green-400">{totalOriginal > 0 ? ((totalDiscount / totalOriginal) * 100).toFixed(1) : 0}%</p>
          <p className="text-slate-400 text-sm mt-0">میانگین تخفیف</p>
        </div>
      </div>

      {/* Code Summary */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-white font-semibold mb-4">خلاصه کدها</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Object.entries(CODE_SUMMARY).map(([code, data]) => (
            <div key={code} className="bg-slate-750 rounded-xl p-4 border border-slate-600 flex items-center justify-between">
              <div>
                <p className="text-red-400 font-mono font-bold">{code}</p>
                <p className="text-slate-400 text-xs">{data.uses} بار استفاده</p>
              </div>
              <div className="text-right">
                <p className="text-amber-400 font-medium">{(data.totalDiscount / 1000).toFixed(0)}K</p>
                <p className="text-slate-500 text-xs">تخفیف</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex flex-wrap gap-3 items-center">
        <FiFilter className="text-slate-400 w-4 h-4" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="جستجو کاربر، کد، شناسه رزرو..."
          className="input-field flex-1 min-w-48"
        />
        <select value={filterCode} onChange={e => setFilterCode(e.target.value)} className="input-field">
          <option value="">همه کدها</option>
          {uniqueCodes.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field">
          <option value="">همه وضعیت‌ها</option>
          <option value="applied">اعمال شده</option>
          <option value="reversed">برگشت خورده</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-right text-slate-400 text-sm font-medium p-4">کد</th>
              <th className="text-right text-slate-400 text-sm font-medium p-4">کاربر</th>
              <th className="text-right text-slate-400 text-sm font-medium p-4">رزرو / بازی</th>
              <th className="text-right text-slate-400 text-sm font-medium p-4">تخفیف</th>
              <th className="text-right text-slate-400 text-sm font-medium p-4">مبلغ اصلی</th>
              <th className="text-right text-slate-400 text-sm font-medium p-4">مبلغ نهایی</th>
              <th className="text-right text-slate-400 text-sm font-medium p-4">تاریخ</th>
              <th className="text-right text-slate-400 text-sm font-medium p-4">وضعیت</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} className="border-b border-slate-700/50 hover:bg-slate-750 transition-colors">
                <td className="p-4">
                  <span className="font-mono text-red-400 bg-red-500/10 px-2 py-0.5 rounded text-sm">{u.code}</span>
                </td>
                <td className="p-4">
                  <div>
                    <p className="text-white text-sm">{u.userName}</p>
                    <p className="text-slate-500 text-xs">{u.userId}</p>
                  </div>
                </td>
                <td className="p-4">
                  <div>
                    <p className="text-slate-300 text-sm">{u.bookingId}</p>
                    <p className="text-slate-500 text-xs">{u.gameName}</p>
                  </div>
                </td>
                <td className="p-4">
                  <span className="text-red-400 font-medium">
                    {u.discountType === 'percent' ? `${u.discountValue}%` : `${u.discountValue.toLocaleString('fa-IR')} ت`}
                  </span>
                  <p className="text-slate-500 text-xs">{u.discountAmount.toLocaleString('fa-IR')} ت</p>
                </td>
                <td className="p-4">
                  <span className="text-slate-300 line-through text-sm">{u.originalAmount.toLocaleString('fa-IR')}</span>
                </td>
                <td className="p-4">
                  <span className="text-green-400 font-medium">{u.finalAmount.toLocaleString('fa-IR')} ت</span>
                </td>
                <td className="p-4">
                  <span className="text-slate-400 text-sm">{u.usedAt}</span>
                </td>
                <td className="p-4">
                  <StatusBadge
                    status={u.status === 'applied' ? 'success' : 'danger'}
                    label={u.status === 'applied' ? 'اعمال شده' : 'برگشت خورده'}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <FiTag className="w-10 h-10 mx-auto mb-3 text-slate-600" />
            <p>رکوردی یافت نشد</p>
          </div>
        )}
      </div>
      <p className="text-slate-500 text-sm text-center">نمایش {filtered.length} از {MOCK_USAGES.length} رکورد</p>
    </div>
  );
}
