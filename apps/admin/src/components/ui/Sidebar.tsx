'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard, CalendarDays, Gamepad2, Building2,
  Star, MessageSquare, Ticket, CreditCard, Banknote,
  BarChart3, Database, Gift, Award, TrendingUp, User,
  Percent, Trophy, Settings, Shield, ClipboardList,
  ChevronDown, ChevronLeft, Zap, Globe
} from 'lucide-react';

const navGroups = [
  {
    title: 'عملیاتی',
    items: [
      { href: '/dashboard', label: 'داشبورد', icon: LayoutDashboard },
      {
        label: 'رزروها', icon: CalendarDays,
        children: [
          { href: '/bookings', label: 'لیست رزروها' },
          { href: '/bookings/calendar', label: 'تقویم رزروها' },
          { href: '/bookings/new', label: 'رزرو دستی' },
        ]
      },
      {
        label: 'بازی‌ها', icon: Gamepad2,
        children: [
          { href: '/games', label: 'لیست بازی‌ها' },
          { href: '/games/new', label: 'بازی جدید' },
        ]
      },
      {
        label: 'شعب و مکان', icon: Building2,
        children: [
          { href: '/branches', label: 'شعب' },
          { href: '/cities', label: 'شهرها' },
          { href: '/categories', label: 'دسته‌بندی‌ها' },
        ]
      },
      { href: '/reviews', label: 'نظرات', icon: Star },
      { href: '/comments', label: 'نظرات بازی‌ها', icon: MessageSquare },
      {
        label: 'چت زنده', icon: MessageSquare,
        children: [
          { href: '/chats', label: 'مانیتور چت' },
          { href: '/chats/reported', label: 'گزارش‌شده‌ها' },
          { href: '/chats/stats', label: 'آمار چت' },
        ]
      },
      {
        label: 'تیکت‌ها', icon: Ticket,
        children: [
          { href: '/tickets', label: 'لیست تیکت‌ها' },
          { href: '/tickets/stats', label: 'آمار تیکت‌ها' },
        ]
      },
    ]
  },
  {
    title: 'مالی',
    items: [
      { href: '/transactions', label: 'تراکنش‌ها', icon: CreditCard },
      { href: '/payments', label: 'پرداخت‌ها (ZarinPal)', icon: Banknote },
      {
        label: 'گزارش‌ها', icon: BarChart3,
        children: [
          { href: '/reports/financial', label: 'گزارش مالی' },
          { href: '/reports/games', label: 'گزارش بازی‌ها' },
          { href: '/reports/cohort', label: 'تحلیل Cohort' },
          { href: '/reports/heatmap', label: 'Heatmap فعالیت' },
        ]
      },
      { href: '/backup', label: 'پشتیبان‌گیری', icon: Database },
    ]
  },
  {
    title: 'گیمیفیکیشن',
    items: [
      {
        label: 'گردونه شانس', icon: Gift,
        children: [
          { href: '/wheel/prizes', label: 'جوایز گردونه' },
          { href: '/wheel/spins', label: 'تاریخچه چرخش' },
          { href: '/wheel/stats', label: 'آمار گردونه' },
        ]
      },
      { href: '/badges', label: 'بج‌ها', icon: Award },
      { href: '/levels', label: 'لول‌ها و XP', icon: TrendingUp },
      { href: '/avatars', label: 'آواتارها', icon: User },
      {
        label: 'تخفیف‌ها', icon: Percent,
        children: [
          { href: '/discounts/codes', label: 'کدهای تخفیف' },
          { href: '/discounts/auto', label: 'تخفیف خودکار' },
          { href: '/discounts/usages', label: 'تاریخچه استفاده' },
        ]
      },
      { href: '/monthly', label: 'برندگان ماهانه', icon: Trophy },
    ]
  },
  {
    title: 'تنظیمات و سیستم',
    items: [
      {
        label: 'تنظیمات', icon: Settings,
        children: [
          { href: '/settings/general', label: 'عمومی' },
          { href: '/settings/financial', label: 'مالی' },
          { href: '/settings/chat', label: 'چت' },
          { href: '/settings/security', label: 'امنیت' },
          { href: '/settings/gamification', label: 'گیمیفیکیشن' },
          { href: '/settings/payments', label: 'پرداخت' },
          { href: '/settings/sms', label: 'SMS' },
          { href: '/settings/theme', label: 'تم' },
        ]
      },
      {
        label: 'نقش‌ها و دسترسی', icon: Shield,
        children: [
          { href: '/roles', label: 'نقش‌ها' },
          { href: '/staff', label: 'کاربران ادمین' },
        ]
      },
      { href: '/audit', label: 'لاگ‌های سیستم', icon: ClipboardList },
    ]
  },
];

interface NavItemProps {
  item: {
    href?: string;
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    children?: { href: string; label: string }[];
  };
  depth?: number;
}

function NavItem({ item, depth = 0 }: NavItemProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(() => {
    if (!item.children) return false;
    return item.children.some(c => pathname.startsWith(c.href));
  });

  if (item.children) {
    const isActiveGroup = item.children.some(c => pathname.startsWith(c.href));
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${
            isActiveGroup
              ? 'text-red-400 bg-red-600/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          {item.icon && <item.icon className="w-4 h-4 flex-shrink-0" />}
          <span className="flex-1 text-right">{item.label}</span>
          {open ? <ChevronDown className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
        {open && (
          <div className="mt-1 mr-7 space-y-1 border-r border-slate-700/50 pr-3">
            {item.children.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                className={`block px-3 py-2 rounded-lg text-sm transition-all ${
                  pathname === child.href
                    ? 'text-white bg-red-600/20 border border-red-500/20 font-medium'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
                }`}
              >
                {child.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  const isActive = item.href && pathname === item.href;
  return (
    <Link
      href={item.href!}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${
        isActive
          ? 'text-white bg-red-600/20 border border-red-500/20'
          : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
      }`}
    >
      {item.icon && <item.icon className="w-4 h-4 flex-shrink-0" />}
      <span>{item.label}</span>
    </Link>
  );
}

export default function Sidebar({ collapsed }: { collapsed?: boolean }) {
  return (
    <aside className={`${collapsed ? 'w-16' : 'w-64'} bg-slate-900 border-l border-slate-800 flex flex-col h-screen sticky top-0 overflow-hidden transition-all duration-300`}>
      {/* Logo */}
      <div className="p-4 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Zap className="w-6 h-6 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-white font-black text-lg leading-none">TIK TAK RUN</h1>
              <p className="text-slate-500 text-xs mt-0.5">Command Center</p>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {navGroups.map((group) => (
          <div key={group.title}>
            {!collapsed && (
              <p className="text-slate-600 text-xs font-bold uppercase tracking-widest mb-2 px-3">
                {group.title}
              </p>
            )}
            <div className="space-y-1">
              {group.items.map((item, i) => (
                <NavItem key={i} item={item} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-800 flex-shrink-0">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-300 text-sm rounded-lg hover:bg-slate-800 transition-all"
          target="_blank"
        >
          <Globe className="w-4 h-4" />
          {!collapsed && <span>مشاهده سایت</span>}
        </Link>
      </div>
    </aside>
  );
}
