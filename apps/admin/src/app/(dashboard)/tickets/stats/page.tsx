'use client';

import { SectionHeader } from '@/components/ui';
import { FiHelpCircle, FiClock, FiTrendingUp, FiCheckCircle } from 'react-icons/fi';

const CATEGORY_STATS = [
  { cat: 'مشکل فنی', count: 89, resolved: 82, avgHours: 4.2, color: 'bg-red-500' },
  { cat: 'استرداد وجه', count: 67, resolved: 61, avgHours: 8.5, color: 'bg-amber-500' },
  { cat: 'تغییر رزرو', count: 54, resolved: 54, avgHours: 2.1, color: 'bg-green-500' },
  { cat: 'سوال عمومی', count: 145, resolved: 143, avgHours: 1.3, color: 'bg-blue-500' },
  { cat: 'شکایت', count: 23, resolved: 18, avgHours: 24.0, color: 'bg-purple-500' },
  { cat: 'سایر', count: 34, resolved: 31, avgHours: 3.5, color: 'bg-slate-500' },
];

const WEEKLY_TICKETS = [
  { day: 'شنبه', opened: 58, closed: 54, pending: 4 },
  { day: 'یکشنبه', opened: 72, closed: 68, pending: 4 },
  { day: 'دوشنبه', opened: 45, closed: 43, pending: 2 },
  { day: 'سه‌شنبه', opened: 61, closed: 57, pending: 4 },
  { day: 'چهارشنبه', opened: 53, closed: 50, pending: 3 },
  { day: 'پنجشنبه', opened: 79, closed: 74, pending: 5 },
  { day: 'جمعه', opened: 44, closed: 41, pending: 3 },
];

const PRIORITY_DIST = [
  { priority: 'فوری', count: 28, color: 'text-red-400 bg-red-500/10' },
  { priority: 'بالا', count: 89, color: 'text-amber-400 bg-amber-500/10' },
  { priority: 'متوسط', count: 234, color: 'text-blue-400 bg-blue-500/10' },
  { priority: 'پایین', count: 61, color: 'text-slate-400 bg-slate-500/10' },
];

export default function TicketStatsPage() {
  const totalTickets = CATEGORY_STATS.reduce((a, c) => a + c.count, 0);
  const totalResolved = CATEGORY_STATS.reduce((a, c) => a + c.resolved, 0);
  const resolveRate = ((totalResolved / totalTickets) * 100).toFixed(1);
  const avgResponseHours = (CATEGORY_STATS.reduce((a, c) => a + c.avgHours, 0) / CATEGORY_STATS.length).toFixed(1);
  const maxWeekly = Math.max(...WEEKLY_TICKETS.map(d => d.opened));

  return (
    <div className="space-y-6">
      <SectionHeader
        title="آمار تیکت‌ها"
        subtitle="تحلیل عملکرد سیستم پشتیبانی و تیکت‌ها"
        icon={<FiHelpCircle />}
      />

      {/* Overview */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'کل تیکت‌ها', value: totalTickets, icon: FiHelpCircle, color: 'text-blue-400' },
          { label: 'حل شده', value: totalResolved, icon: FiCheckCircle, color: 'text-green-400' },
          { label: 'نرخ حل', value: `${resolveRate}%`, icon: FiTrendingUp, color: 'text-purple-400' },
          { label: 'میانگین پاسخ', value: `${avgResponseHours}h`, icon: FiClock, color: 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <s.icon className={`w-6 h-6 ${s.color} mb-3`} />
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-slate-400 text-sm mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-semibold mb-5">تیکت‌ها بر اساس دسته‌بندی</h3>
          <div className="space-y-4">
            {CATEGORY_STATS.map(c => (
              <div key={c.cat}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-slate-300">{c.cat}</span>
                  <div className="flex gap-3">
                    <span className="text-green-400 text-xs">✓ {c.resolved}</span>
                    <span className="text-slate-400 text-xs">/{c.count}</span>
                    <span className="text-amber-400 text-xs">{c.avgHours}h</span>
                  </div>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className={`h-full ${c.color} rounded-full`} style={{ width: `${(c.count / totalTickets) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-semibold mb-5">توزیع اولویت</h3>
          <div className="space-y-4">
            {PRIORITY_DIST.map(p => {
              const total = PRIORITY_DIST.reduce((a, pp) => a + pp.count, 0);
              return (
                <div key={p.priority} className={`flex items-center justify-between p-4 rounded-xl ${p.color}`}>
                  <span className="font-medium">{p.priority}</span>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{p.count}</p>
                    <p className="text-xs opacity-70">{((p.count / total) * 100).toFixed(0)}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Weekly Trend */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-white font-semibold mb-5">روند هفتگی</h3>
        <div className="flex items-end gap-4 h-40 mb-4">
          {WEEKLY_TICKETS.map(d => (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex gap-1 items-end" style={{ height: '100%' }}>
                <div className="flex-1 bg-blue-500/60 hover:bg-blue-500 rounded-t transition-colors" style={{ height: `${(d.opened / maxWeekly) * 100}%` }} title={`باز: ${d.opened}`} />
                <div className="flex-1 bg-green-500/60 hover:bg-green-500 rounded-t transition-colors" style={{ height: `${(d.closed / maxWeekly) * 100}%` }} title={`بسته: ${d.closed}`} />
              </div>
              <span className="text-slate-500 text-xs mt-1">{d.day.substring(0, 3)}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-6 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-blue-500/60" />
            <span className="text-slate-400 text-xs">باز شده</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-green-500/60" />
            <span className="text-slate-400 text-xs">بسته شده</span>
          </div>
        </div>
      </div>

      {/* Daily Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-700">
          <h3 className="text-white font-semibold">جزئیات هفتگی</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-right text-slate-400 text-sm font-medium p-4">روز</th>
              <th className="text-right text-slate-400 text-sm font-medium p-4">باز شده</th>
              <th className="text-right text-slate-400 text-sm font-medium p-4">بسته شده</th>
              <th className="text-right text-slate-400 text-sm font-medium p-4">معلق</th>
              <th className="text-right text-slate-400 text-sm font-medium p-4">نرخ حل روزانه</th>
            </tr>
          </thead>
          <tbody>
            {WEEKLY_TICKETS.map(d => (
              <tr key={d.day} className="border-b border-slate-700/50 hover:bg-slate-750 transition-colors">
                <td className="p-4 text-white">{d.day}</td>
                <td className="p-4 text-blue-400 font-medium">{d.opened}</td>
                <td className="p-4 text-green-400 font-medium">{d.closed}</td>
                <td className="p-4 text-amber-400">{d.pending}</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden max-w-20">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${(d.closed / d.opened) * 100}%` }} />
                    </div>
                    <span className="text-slate-300 text-sm">{((d.closed / d.opened) * 100).toFixed(0)}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
