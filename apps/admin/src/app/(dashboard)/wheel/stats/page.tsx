'use client';

import { SectionHeader } from '@/components/ui';
import { FiRotateCw, FiGift, FiUsers, FiTrendingUp, FiDollarSign } from 'react-icons/fi';

const PRIZE_PERFORMANCE = [
  { prize: 'رزرو رایگان', given: 23, cost: 5750000, probability: 5, claimed: 21 },
  { prize: '۵۰٪ تخفیف', given: 67, cost: 8375000, probability: 15, claimed: 65 },
  { prize: '۲۰٪ تخفیف', given: 134, cost: 6700000, probability: 25, claimed: 130 },
  { prize: '۵۰۰ XP', given: 189, cost: 0, probability: 30, claimed: 189 },
  { prize: '۲۰۰ XP', given: 234, cost: 0, probability: 20, claimed: 234 },
  { prize: 'شانس دوباره', given: 54, cost: 0, probability: 5, claimed: 54 },
];

const MONTHLY_SPINS = [
  { month: 'فروردین', spins: 1234, uniqueUsers: 876, prizesGiven: 1198 },
  { month: 'اردیبهشت', spins: 1456, uniqueUsers: 1023, prizesGiven: 1412 },
  { month: 'خرداد', spins: 1678, uniqueUsers: 1145, prizesGiven: 1632 },
  { month: 'تیر', spins: 1890, uniqueUsers: 1289, prizesGiven: 1836 },
];

const TOP_WINNERS = [
  { name: 'علی محمدی', spins: 8, prizes: 6, bestPrize: 'رزرو رایگان', totalValue: 380000 },
  { name: 'مریم احمدی', spins: 7, prizes: 5, bestPrize: '۵۰٪ تخفیف', totalValue: 250000 },
  { name: 'رضا کریمی', spins: 6, prizes: 4, bestPrize: '۵۰٪ تخفیف', totalValue: 175000 },
  { name: 'فاطمه حسینی', spins: 5, prizes: 5, bestPrize: '۲۰٪ تخفیف', totalValue: 120000 },
  { name: 'محمد رضایی', spins: 5, prizes: 3, bestPrize: '۲۰٪ تخفیف', totalValue: 80000 },
];

export default function WheelStatsPage() {
  const totalSpins = MONTHLY_SPINS.reduce((a, m) => a + m.spins, 0);
  const totalPrizes = PRIZE_PERFORMANCE.reduce((a, p) => a + p.given, 0);
  const totalCost = PRIZE_PERFORMANCE.reduce((a, p) => a + p.cost, 0);
  const claimRate = ((PRIZE_PERFORMANCE.reduce((a, p) => a + p.claimed, 0) / totalPrizes) * 100).toFixed(1);
  const maxSpins = Math.max(...MONTHLY_SPINS.map(m => m.spins));

  return (
    <div className="space-y-6">
      <SectionHeader
        title="آمار چرخ شانس"
        subtitle="تحلیل عملکرد قرعه‌کشی و جوایز اعطا شده"
        icon={<FiRotateCw />}
      />

      {/* Overview */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'کل چرخش‌ها', value: totalSpins.toLocaleString('fa-IR'), icon: FiRotateCw, color: 'text-blue-400' },
          { label: 'جوایز اعطا شده', value: totalPrizes.toLocaleString('fa-IR'), icon: FiGift, color: 'text-purple-400' },
          { label: 'نرخ دریافت جایزه', value: `${claimRate}%`, icon: FiTrendingUp, color: 'text-green-400' },
          { label: 'ارزش جوایز', value: `${(totalCost / 1000000).toFixed(1)}M`, icon: FiDollarSign, color: 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <s.icon className={`w-6 h-6 ${s.color} mb-3`} />
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-slate-400 text-sm mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Monthly Trend */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-white font-semibold mb-5">روند ماهانه</h3>
        <div className="flex items-end gap-6 h-36 mb-4">
          {MONTHLY_SPINS.map(m => (
            <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-slate-400 text-xs mb-1">{m.spins.toLocaleString('fa-IR')}</span>
              <div
                className="w-full bg-gradient-to-t from-red-700 to-red-500 rounded-t hover:from-red-600 hover:to-red-400 transition-colors"
                style={{ height: `${(m.spins / maxSpins) * 100}%` }}
              />
              <span className="text-slate-400 text-xs">{m.month}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-4 mt-2">
          {MONTHLY_SPINS.map(m => (
            <div key={m.month} className="text-center">
              <p className="text-white text-sm font-medium">{m.month}</p>
              <p className="text-slate-400 text-xs">{m.uniqueUsers.toLocaleString('fa-IR')} کاربر</p>
            </div>
          ))}
        </div>
      </div>

      {/* Prize Performance */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
          <FiGift className="text-red-400" />
          عملکرد جوایز
        </h3>
        <div className="space-y-4">
          {PRIZE_PERFORMANCE.map(p => (
            <div key={p.prize} className="bg-slate-750 rounded-xl p-4 border border-slate-600">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-white font-medium">{p.prize}</p>
                  <p className="text-slate-400 text-xs">احتمال: {p.probability}%</p>
                </div>
                <div className="text-right">
                  <p className="text-purple-400 font-bold text-lg">{p.given}</p>
                  <p className="text-slate-500 text-xs">بار اعطا شده</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-slate-400 text-xs">دریافت شده</p>
                  <p className="text-green-400 font-medium">{p.claimed} ({((p.claimed / p.given) * 100).toFixed(0)}%)</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">هزینه کل</p>
                  <p className="text-amber-400 font-medium">{p.cost > 0 ? `${(p.cost / 1000000).toFixed(1)}M ت` : 'رایگان'}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">نرخ دریافت</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className="flex-1 h-1.5 bg-slate-600 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${(p.claimed / p.given) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Winners */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-5 border-b border-slate-700">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <FiUsers className="w-5 h-5 text-red-400" />
            برترین برندگان
          </h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-right text-slate-400 text-sm font-medium p-4">رتبه</th>
              <th className="text-right text-slate-400 text-sm font-medium p-4">کاربر</th>
              <th className="text-right text-slate-400 text-sm font-medium p-4">چرخش‌ها</th>
              <th className="text-right text-slate-400 text-sm font-medium p-4">جوایز</th>
              <th className="text-right text-slate-400 text-sm font-medium p-4">بهترین جایزه</th>
              <th className="text-right text-slate-400 text-sm font-medium p-4">ارزش کل</th>
            </tr>
          </thead>
          <tbody>
            {TOP_WINNERS.map((w, i) => (
              <tr key={w.name} className="border-b border-slate-700/50 hover:bg-slate-750 transition-colors">
                <td className="p-4">
                  <span className="text-lg">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {w.name[0]}
                    </div>
                    <span className="text-white text-sm">{w.name}</span>
                  </div>
                </td>
                <td className="p-4 text-white font-medium">{w.spins}</td>
                <td className="p-4 text-purple-400 font-medium">{w.prizes}</td>
                <td className="p-4 text-slate-300 text-sm">{w.bestPrize}</td>
                <td className="p-4 text-amber-400 font-medium">{w.totalValue.toLocaleString('fa-IR')} ت</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
