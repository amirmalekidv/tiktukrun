'use client';

import { SectionHeader } from '@/components/ui';
import { FiMessageCircle, FiClock, FiStar, FiUsers, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

const HOURLY_ACTIVITY = [
  { hour: '۰۰', count: 12 }, { hour: '۰۲', count: 5 }, { hour: '۰۴', count: 3 },
  { hour: '۰۶', count: 8 }, { hour: '۰۸', count: 24 }, { hour: '۱۰', count: 67 },
  { hour: '۱۲', count: 89 }, { hour: '۱۴', count: 78 }, { hour: '۱۶', count: 95 },
  { hour: '۱۸', count: 112 }, { hour: '۲۰', count: 134 }, { hour: '۲۲', count: 98 },
];

const OPERATOR_STATS = [
  { name: 'فاطمه حسینی', handled: 156, avgResponseTime: 2.3, avgRating: 4.8, resolved: 148 },
  { name: 'علی رضایی', handled: 134, avgResponseTime: 3.1, avgRating: 4.5, resolved: 128 },
  { name: 'مریم کریمی', handled: 98, avgResponseTime: 1.9, avgRating: 4.9, resolved: 96 },
  { name: 'رضا احمدی', handled: 87, avgResponseTime: 4.2, avgRating: 4.1, resolved: 79 },
];

const WEEKLY_DATA = [
  { day: 'شنبه', total: 89, resolved: 85, avgTime: 3.2 },
  { day: 'یکشنبه', total: 102, resolved: 97, avgTime: 2.8 },
  { day: 'دوشنبه', total: 76, resolved: 73, avgTime: 3.5 },
  { day: 'سه‌شنبه', total: 91, resolved: 88, avgTime: 2.9 },
  { day: 'چهارشنبه', total: 83, resolved: 80, avgTime: 3.1 },
  { day: 'پنجشنبه', total: 121, resolved: 115, avgTime: 2.7 },
  { day: 'جمعه', total: 145, resolved: 138, avgTime: 2.5 },
];

const TOPICS = [
  { topic: 'سؤال درباره بازی', count: 234, percent: 34 },
  { topic: 'مشکل رزرو', count: 189, percent: 27 },
  { topic: 'استرداد وجه', count: 98, percent: 14 },
  { topic: 'تغییر زمان', count: 76, percent: 11 },
  { topic: 'سایر', count: 98, percent: 14 },
];

export default function ChatStatsPage() {
  const maxHourly = Math.max(...HOURLY_ACTIVITY.map(h => h.count));
  const maxWeekly = Math.max(...WEEKLY_DATA.map(d => d.total));

  return (
    <div className="space-y-6">
      <SectionHeader
        title="آمار چت"
        subtitle="تحلیل عملکرد سیستم چت و اپراتورها"
        icon={<FiMessageCircle />}
      />

      {/* Overview Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'کل گفتگوها (این ماه)', value: '707', icon: FiMessageCircle, color: 'text-blue-400', change: '+12%', up: true },
          { label: 'نرخ حل مشکل', value: '94.2%', icon: FiTrendingUp, color: 'text-green-400', change: '+2.1%', up: true },
          { label: 'میانگین پاسخ', value: '2.8 دقیقه', icon: FiClock, color: 'text-amber-400', change: '-0.3m', up: true },
          { label: 'رضایت کاربران', value: '4.6/5', icon: FiStar, color: 'text-purple-400', change: '+0.2', up: true },
        ].map(s => (
          <div key={s.label} className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <s.icon className={`w-5 h-5 ${s.color}`} />
              <span className={`text-xs flex items-center gap-0.5 ${s.up ? 'text-green-400' : 'text-red-400'}`}>
                {s.up ? <FiTrendingUp className="w-3 h-3" /> : <FiTrendingDown className="w-3 h-3" />}
                {s.change}
              </span>
            </div>
            <p className={`text-2xl font-bold ${s.color} mb-1`}>{s.value}</p>
            <p className="text-slate-400 text-xs">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Activity */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-semibold mb-5">فعالیت ساعتی</h3>
          <div className="flex items-end gap-2 h-32">
            {HOURLY_ACTIVITY.map(h => (
              <div key={h.hour} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-red-500/70 hover:bg-red-500 rounded-t transition-colors cursor-pointer"
                  style={{ height: `${(h.count / maxHourly) * 100}%` }}
                  title={`${h.hour}:00 — ${h.count} چت`}
                />
                <span className="text-slate-500 text-xs">{h.hour}</span>
              </div>
            ))}
          </div>
          <p className="text-slate-500 text-xs text-center mt-2">اوج فعالیت: ساعت ۲۰-۲۲</p>
        </div>

        {/* Topics Breakdown */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-semibold mb-5">موضوعات چت</h3>
          <div className="space-y-4">
            {TOPICS.map(t => (
              <div key={t.topic}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300">{t.topic}</span>
                  <span className="text-slate-400">{t.count} ({t.percent}%)</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full"
                    style={{ width: `${t.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly Trend */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-white font-semibold mb-5">روند هفتگی</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-right text-slate-400 font-medium pb-3">روز</th>
                <th className="text-right text-slate-400 font-medium pb-3">کل چت</th>
                <th className="text-right text-slate-400 font-medium pb-3">حل شده</th>
                <th className="text-right text-slate-400 font-medium pb-3">نرخ حل</th>
                <th className="text-right text-slate-400 font-medium pb-3">میانگین پاسخ</th>
                <th className="text-right text-slate-400 font-medium pb-3">نمودار</th>
              </tr>
            </thead>
            <tbody>
              {WEEKLY_DATA.map(d => (
                <tr key={d.day} className="border-b border-slate-700/50">
                  <td className="py-3 text-white">{d.day}</td>
                  <td className="py-3 text-white font-medium">{d.total}</td>
                  <td className="py-3 text-green-400">{d.resolved}</td>
                  <td className="py-3">
                    <span className="text-green-400">{((d.resolved / d.total) * 100).toFixed(1)}%</span>
                  </td>
                  <td className="py-3 text-amber-400">{d.avgTime} دقیقه</td>
                  <td className="py-3 w-32">
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(d.total / maxWeekly) * 100}%` }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Operator Performance */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-5 border-b border-slate-700">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <FiUsers className="w-5 h-5 text-red-400" />
            عملکرد اپراتورها
          </h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-right text-slate-400 text-sm font-medium p-4">اپراتور</th>
              <th className="text-right text-slate-400 text-sm font-medium p-4">مدیریت شده</th>
              <th className="text-right text-slate-400 text-sm font-medium p-4">حل شده</th>
              <th className="text-right text-slate-400 text-sm font-medium p-4">نرخ حل</th>
              <th className="text-right text-slate-400 text-sm font-medium p-4">میانگین پاسخ</th>
              <th className="text-right text-slate-400 text-sm font-medium p-4">امتیاز</th>
            </tr>
          </thead>
          <tbody>
            {OPERATOR_STATS.map((op, idx) => (
              <tr key={op.name} className="border-b border-slate-700/50 hover:bg-slate-750 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {idx === 0 && <span className="text-amber-400 text-sm">🥇</span>}
                    {idx === 1 && <span className="text-slate-400 text-sm">🥈</span>}
                    {idx === 2 && <span className="text-amber-600 text-sm">🥉</span>}
                    {idx > 2 && <span className="text-slate-500 text-sm w-4">{idx + 1}</span>}
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {op.name[0]}
                    </div>
                    <span className="text-white text-sm">{op.name}</span>
                  </div>
                </td>
                <td className="p-4 text-white font-medium">{op.handled}</td>
                <td className="p-4 text-green-400">{op.resolved}</td>
                <td className="p-4">
                  <span className="text-green-400">{((op.resolved / op.handled) * 100).toFixed(1)}%</span>
                </td>
                <td className="p-4 text-amber-400">{op.avgResponseTime} دقیقه</td>
                <td className="p-4">
                  <div className="flex items-center gap-1">
                    <span className="text-amber-400">⭐</span>
                    <span className="text-white font-medium">{op.avgRating}</span>
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
