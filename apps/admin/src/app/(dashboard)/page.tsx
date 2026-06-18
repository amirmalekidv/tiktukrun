'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FiCalendar, FiDollarSign, FiUsers, FiTrendingUp, FiTrendingDown,
  FiAlertCircle, FiActivity, FiClock, FiStar, FiMessageCircle,
  FiHelpCircle, FiRotateCw, FiAward, FiZap, FiArrowLeft,
  FiCheckCircle
} from 'react-icons/fi';

// ─── Mock Data ───────────────────────────────────────────────────────────────
const KPI_DATA = [
  {
    key: 'bookings_today',
    label: 'رزرو امروز',
    value: '47',
    change: '+12%',
    up: true,
    icon: FiCalendar,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    link: '/bookings',
  },
  {
    key: 'revenue_today',
    label: 'درآمد امروز',
    value: '۱۱.۷M',
    change: '+8%',
    up: true,
    icon: FiDollarSign,
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    link: '/transactions',
  },
  {
    key: 'new_users',
    label: 'کاربران جدید',
    value: '23',
    change: '+5%',
    up: true,
    icon: FiUsers,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    link: '/bookings',
  },
  {
    key: 'active_games',
    label: 'بازی‌های فعال',
    value: '34',
    change: '0%',
    up: true,
    icon: FiZap,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    link: '/games',
  },
];

const RECENT_BOOKINGS = [
  { id: 'B-1089', user: 'علی محمدی', game: 'قلعه اشباح', time: '۱۸:۰۰', amount: 350000, status: 'confirmed' },
  { id: 'B-1088', user: 'مریم احمدی', game: 'گنج دزد دریایی', time: '۱۷:۰۰', amount: 300000, status: 'pending' },
  { id: 'B-1087', user: 'رضا کریمی', game: 'آزمایشگاه مخفی', time: '۱۶:۳۰', amount: 280000, status: 'confirmed' },
  { id: 'B-1086', user: 'فاطمه حسینی', game: 'عملیات فرار', time: '۱۵:۰۰', amount: 250000, status: 'cancelled' },
  { id: 'B-1085', user: 'محمد رضایی', game: 'قلعه اشباح', time: '۱۴:۰۰', amount: 350000, status: 'confirmed' },
];

const PENDING_TICKETS = [
  { id: 'T-441', user: 'سارا محمدی', subject: 'مشکل در پرداخت', priority: 'high', time: '۳۰ دقیقه پیش' },
  { id: 'T-440', user: 'احمد کریمی', subject: 'درخواست استرداد وجه', priority: 'medium', time: '۱ ساعت پیش' },
  { id: 'T-439', user: 'لیلا احمدی', subject: 'تغییر تایم رزرو', priority: 'low', time: '۲ ساعت پیش' },
];

const LIVE_CHATS = [
  { id: 'C-78', user: 'نگار علوی', message: 'میخوام برای ۴ نفر رزرو کنم...', time: '2 min' },
  { id: 'C-77', user: 'امیر حسینی', message: 'قیمت بازی رو میگید؟', time: '5 min' },
  { id: 'C-76', user: 'فریبا کاظمی', message: 'آیا امشب جای خالی دارید؟', time: '8 min' },
];

const HOURLY_BOOKINGS = [8, 12, 15, 22, 35, 48, 42, 38, 51, 67, 45, 33];
const HOURS = ['۸', '۹', '۱۰', '۱۱', '۱۲', '۱۳', '۱۴', '۱۵', '۱۶', '۱۷', '۱۸', '۱۹'];

const TOP_GAMES = [
  { name: 'قلعه اشباح', bookings: 89, revenue: 31150000, rating: 4.8 },
  { name: 'گنج دزد دریایی', bookings: 76, revenue: 22800000, rating: 4.6 },
  { name: 'آزمایشگاه مخفی', bookings: 54, revenue: 15120000, rating: 4.7 },
  { name: 'عملیات فرار', bookings: 48, revenue: 12000000, rating: 4.5 },
];

const ALERTS = [
  { type: 'warning', msg: '۵ تیکت بدون پاسخ بیش از ۳ ساعت' },
  { type: 'info', msg: 'پشتیبان‌گیری خودکار ۳ ساعت دیگر انجام می‌شود' },
  { type: 'success', msg: 'پرداخت‌های معلق امروز تسویه شدند' },
];

const BOOKING_STATUS_COLOR: Record<string, string> = {
  confirmed: 'text-green-400',
  pending: 'text-amber-400',
  cancelled: 'text-red-400',
};
const BOOKING_STATUS_LABEL: Record<string, string> = {
  confirmed: 'تأیید شده',
  pending: 'در انتظار',
  cancelled: 'لغو شده',
};
const PRIORITY_COLOR: Record<string, string> = {
  high: 'text-red-400 bg-red-500/10',
  medium: 'text-amber-400 bg-amber-500/10',
  low: 'text-slate-400 bg-slate-500/10',
};

function LiveClock() {
  const [time, setTime] = useState(new Date().toLocaleTimeString('fa-IR'));
  useEffect(() => {
    const t = setInterval(() => setTime(new Date().toLocaleTimeString('fa-IR')), 1000);
    return () => clearInterval(t);
  }, []);
  return <span className="font-mono text-red-400 text-sm">{time}</span>;
}

export default function DashboardPage() {
  const maxHourly = Math.max(...HOURLY_BOOKINGS);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">داشبورد مدیریت</h1>
          <p className="text-slate-400 text-sm mt-1">
            {new Date().toLocaleDateString('fa-IR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2">
          <FiClock className="text-slate-400 w-4 h-4" />
          <LiveClock />
        </div>
      </div>

      {/* System Alerts */}
      {ALERTS.length > 0 && (
        <div className="space-y-2">
          {ALERTS.map((a, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm border ${
                a.type === 'warning' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                a.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                'bg-blue-500/10 border-blue-500/30 text-blue-400'
              }`}
            >
              {a.type === 'warning' ? <FiAlertCircle className="w-4 h-4 flex-shrink-0" /> :
               a.type === 'success' ? <FiCheckCircle className="w-4 h-4 flex-shrink-0" /> :
               <FiActivity className="w-4 h-4 flex-shrink-0" />}
              {a.msg}
            </div>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_DATA.map(kpi => (
          <Link
            key={kpi.key}
            href={kpi.link}
            className="bg-slate-800 rounded-xl p-5 border border-slate-700 hover:border-slate-600 transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 ${kpi.bg} rounded-lg flex items-center justify-center`}>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <span className={`text-xs flex items-center gap-0.5 ${kpi.up ? 'text-green-400' : 'text-red-400'}`}>
                {kpi.up ? <FiTrendingUp className="w-3 h-3" /> : <FiTrendingDown className="w-3 h-3" />}
                {kpi.change}
              </span>
            </div>
            <p className={`text-2xl font-bold ${kpi.color} mb-1`}>{kpi.value}</p>
            <p className="text-slate-400 text-sm">{kpi.label}</p>
          </Link>
        ))}
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Bookings Chart */}
        <div className="lg:col-span-2 bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-white font-semibold">رزروهای امروز (ساعتی)</h3>
            <span className="text-slate-400 text-sm">مجموع: ۴۱۵</span>
          </div>
          <div className="flex items-end gap-2 h-28">
            {HOURLY_BOOKINGS.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-red-500/70 hover:bg-red-500 rounded-t transition-all cursor-pointer"
                  style={{ height: `${(v / maxHourly) * 100}%` }}
                  title={`ساعت ${HOURS[i]}: ${v} رزرو`}
                />
                <span className="text-slate-500 text-xs">{HOURS[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-semibold mb-4">وضعیت سیستم</h3>
          <div className="space-y-4">
            {[
              { label: 'چت‌های فعال', value: 8, icon: FiMessageCircle, color: 'text-blue-400' },
              { label: 'تیکت‌های معلق', value: 15, icon: FiHelpCircle, color: 'text-amber-400' },
              { label: 'چرخش چرخ امروز', value: 234, icon: FiRotateCw, color: 'text-purple-400' },
              { label: 'XP اعطا شده', value: '12.4K', icon: FiAward, color: 'text-green-400' },
              { label: 'میانگین امتیاز', value: '4.7', icon: FiStar, color: 'text-amber-400' },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                  <span className="text-slate-400 text-sm">{s.label}</span>
                </div>
                <span className={`font-bold ${s.color}`}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Third Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Bookings */}
        <div className="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-slate-700">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <FiCalendar className="w-4 h-4 text-red-400" />
              آخرین رزروها
            </h3>
            <Link href="/bookings" className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors">
              مشاهده همه
              <FiArrowLeft className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-700/50">
            {RECENT_BOOKINGS.map(b => (
              <div key={b.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-750 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                    {b.user[0]}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{b.user}</p>
                    <p className="text-slate-500 text-xs">{b.game} · {b.time}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-green-400 text-sm font-medium">{b.amount.toLocaleString('fa-IR')} ت</p>
                  <p className={`text-xs ${BOOKING_STATUS_COLOR[b.status]}`}>{BOOKING_STATUS_LABEL[b.status]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Tickets + Live Chats */}
        <div className="space-y-4">
          {/* Pending Tickets */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                <FiHelpCircle className="w-4 h-4 text-amber-400" />
                تیکت‌های معلق
              </h3>
              <Link href="/tickets" className="text-xs text-red-400 hover:text-red-300">همه</Link>
            </div>
            <div className="divide-y divide-slate-700/50">
              {PENDING_TICKETS.map(t => (
                <Link key={t.id} href={`/tickets/${t.id}`} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-750 transition-colors block">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-0.5 ${PRIORITY_COLOR[t.priority]}`}>
                    {t.priority === 'high' ? 'فوری' : t.priority === 'medium' ? 'متوسط' : 'پایین'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium truncate">{t.subject}</p>
                    <p className="text-slate-500 text-xs">{t.user} · {t.time}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Live Chats */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                چت‌های زنده
              </h3>
              <Link href="/chats" className="text-xs text-red-400 hover:text-red-300">همه</Link>
            </div>
            <div className="divide-y divide-slate-700/50">
              {LIVE_CHATS.map(c => (
                <div key={c.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-750 transition-colors cursor-pointer">
                  <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                    {c.user[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium">{c.user}</p>
                    <p className="text-slate-400 text-xs truncate">{c.message}</p>
                  </div>
                  <span className="text-slate-500 text-xs whitespace-nowrap">{c.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Games */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <FiZap className="w-4 h-4 text-red-400" />
            برترین بازی‌های این ماه
          </h3>
          <Link href="/games" className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors">
            مشاهده همه
            <FiArrowLeft className="w-3 h-3" />
          </Link>
        </div>
        <div className="divide-y divide-slate-700/50">
          {TOP_GAMES.map((g, i) => (
            <div key={g.name} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-750 transition-colors">
              <span className="text-slate-500 font-bold w-5 text-center">{i + 1}</span>
              <div className="flex-1">
                <p className="text-white font-medium">{g.name}</p>
                <p className="text-slate-400 text-xs">{g.bookings} رزرو</p>
              </div>
              <div className="text-center">
                <p className="text-green-400 font-medium text-sm">{(g.revenue / 1000000).toFixed(1)}M</p>
                <p className="text-slate-500 text-xs">درآمد</p>
              </div>
              <div className="flex items-center gap-1">
                <FiStar className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span className="text-amber-400 font-medium text-sm">{g.rating}</span>
              </div>
              {/* Mini bar */}
              <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full"
                  style={{ width: `${(g.bookings / TOP_GAMES[0].bookings) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'کل کاربران فعال', value: '12,456', sub: '+234 این ماه', color: 'text-blue-400' },
          { label: 'نرخ بازگشت', value: '68.4%', sub: 'بهتر از ماه قبل', color: 'text-green-400' },
          { label: 'میانگین ارزش سفارش', value: '285K', sub: 'تومان', color: 'text-amber-400' },
          { label: 'NPS Score', value: '72', sub: 'عالی ↑', color: 'text-purple-400' },
        ].map(s => (
          <div key={s.label} className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-white text-sm mt-1">{s.label}</p>
            <p className="text-slate-500 text-xs mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
