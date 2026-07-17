'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard, CalendarDays, Gamepad2, Building2,
  Star, MessageSquare, Ticket, CreditCard, Banknote,
  BarChart3, Database, Gift, Award, TrendingUp, User,
  Percent, Trophy, Settings, Shield, ClipboardList,
  ChevronDown, ChevronLeft, Zap, Globe, Images
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { can } from '@/lib/permissions';
import type { AdminUser } from '@/types';

type NavChild = { href: string; label: string; permission?: string };
type NavItemDef = {
  href?: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  permission?: string;
  children?: NavChild[];
};

const navGroups: { title: string; items: NavItemDef[] }[] = [
  {
    title: 'CRM',
    items: [
      { href: '/customers', label: 'مشتریان', icon: User, permission: 'customers.view' },
      { href: '/segments', label: 'سگمنت‌ها', icon: Globe, permission: 'segments.view' },
      { href: '/pipeline', label: 'پایپ‌لاین', icon: TrendingUp, permission: 'pipeline.view' },
      { href: '/campaigns', label: 'کمپین‌ها', icon: Zap, permission: 'campaigns.view' },
    ],
  },
  {
    title: 'عملیاتی',
    items: [
      { href: '/dashboard', label: 'داشبورد', icon: LayoutDashboard, permission: 'dashboard.view' },
      {
        label: 'رزروها', icon: CalendarDays,
        children: [
          { href: '/bookings', label: 'لیست رزروها', permission: 'bookings.view' },
          { href: '/bookings/calendar', label: 'تقویم رزروها', permission: 'bookings.view' },
          { href: '/bookings/new', label: 'رزرو دستی', permission: 'bookings.write' },
        ],
      },
      {
        label: 'بازی‌ها', icon: Gamepad2,
        children: [
          { href: '/games', label: 'لیست بازی‌ها', permission: 'games.view' },
          { href: '/games/new', label: 'بازی جدید', permission: 'games.write' },
        ],
      },
      {
        label: 'شعب و مکان', icon: Building2,
        children: [
          { href: '/branches', label: 'شعب', permission: 'branches.view' },
          { href: '/cities', label: 'شهرها', permission: 'branches.write' },
          { href: '/categories', label: 'دسته‌بندی‌ها', permission: 'games.write' },
          { href: '/landing-sections', label: 'سکشن‌های صفحهٔ اصلی', permission: 'games.write' },
        ],
      },
      { href: '/landing-banners', label: 'بنر های صفحه اصلی', icon: Images, permission: 'games.write' },
      { href: '/reviews', label: 'نظرات', icon: Star, permission: 'games.write' },
      { href: '/comments', label: 'نظرات بازی‌ها', icon: MessageSquare, permission: 'games.view' },
      {
        label: 'چت زنده', icon: MessageSquare,
        children: [
          { href: '/chats', label: 'مانیتور چت', permission: 'chats.view' },
          { href: '/chats/reported', label: 'گزارش‌شده‌ها', permission: 'chats.view' },
          { href: '/chats/stats', label: 'آمار چت', permission: 'chats.view' },
        ],
      },
      {
        label: 'تیکت‌ها', icon: Ticket,
        children: [
          { href: '/tickets', label: 'لیست تیکت‌ها', permission: 'tickets.view' },
          { href: '/tickets/stats', label: 'آمار تیکت‌ها', permission: 'tickets.view' },
        ],
      },
    ],
  },
  {
    title: 'مالی',
    items: [
      { href: '/transactions', label: 'تراکنش‌ها', icon: CreditCard, permission: 'finance.view' },
      { href: '/payments', label: 'پرداخت‌ها (ZarinPal)', icon: Banknote, permission: 'finance.view' },
      {
        label: 'گزارش‌ها', icon: BarChart3,
        children: [
          { href: '/reports/financial', label: 'گزارش مالی', permission: 'reports.view' },
          { href: '/reports/games', label: 'گزارش بازی‌ها', permission: 'reports.view' },
          { href: '/reports/cohort', label: 'تحلیل Cohort', permission: 'reports.view' },
          { href: '/reports/heatmap', label: 'Heatmap فعالیت', permission: 'reports.view' },
        ],
      },
      { href: '/backup', label: 'پشتیبان‌گیری', icon: Database, permission: 'backup.view' },
    ],
  },
  {
    title: 'گیمیفیکیشن',
    items: [
      {
        label: 'گردونه شانس', icon: Gift,
        children: [
          { href: '/wheel/prizes', label: 'جوایز گردونه', permission: 'gamification.view' },
          { href: '/wheel/spins', label: 'تاریخچه چرخش', permission: 'gamification.view' },
          { href: '/wheel/stats', label: 'آمار گردونه', permission: 'gamification.view' },
        ],
      },
      { href: '/badges', label: 'بج‌ها', icon: Award, permission: 'gamification.view' },
      { href: '/levels', label: 'لول‌ها و XP', icon: TrendingUp, permission: 'gamification.view' },
      { href: '/avatars', label: 'آواتارها', icon: User, permission: 'gamification.view' },
      {
        label: 'تخفیف‌ها', icon: Percent,
        children: [
          { href: '/discounts/codes', label: 'کدهای تخفیف', permission: 'discounts.view' },
          { href: '/discounts/auto', label: 'تخفیف خودکار', permission: 'discounts.view' },
          { href: '/discounts/usages', label: 'تاریخچه استفاده', permission: 'discounts.view' },
        ],
      },
      { href: '/monthly', label: 'برندگان ماهانه', icon: Trophy, permission: 'monthly.view' },
    ],
  },
  {
    title: 'تنظیمات و سیستم',
    items: [
      {
        label: 'تنظیمات', icon: Settings,
        children: [
          { href: '/settings/general', label: 'عمومی', permission: 'settings.view' },
          { href: '/settings/financial', label: 'مالی', permission: 'settings.view' },
          { href: '/settings/chat', label: 'چت', permission: 'settings.view' },
          { href: '/settings/security', label: 'امنیت', permission: 'settings.view' },
          { href: '/settings/gamification', label: 'گیمیفیکیشن', permission: 'settings.view' },
          { href: '/settings/payments', label: 'پرداخت', permission: 'settings.view' },
          { href: '/settings/sms', label: 'SMS', permission: 'settings.view' },
          { href: '/settings/theme', label: 'تم', permission: 'settings.view' },
        ],
      },
      {
        label: 'نقش‌ها و دسترسی', icon: Shield,
        children: [
          { href: '/roles', label: 'نقش‌ها', permission: 'roles.read' },
          { href: '/staff', label: 'کاربران ادمین', permission: 'staff.read' },
        ],
      },
      { href: '/audit', label: 'لاگ‌های سیستم', icon: ClipboardList, permission: 'audit.read' },
    ],
  },
];

function userCan(user: AdminUser | null, permission?: string): boolean {
  if (!permission) return true;
  return can(user, permission);
}

function filterNavItems(items: NavItemDef[], user: AdminUser | null): NavItemDef[] {
  return items
    .map((item) => {
      if (item.children) {
        const children = item.children.filter((c) => userCan(user, c.permission));
        if (children.length === 0) return null;
        return { ...item, children };
      }
      if (!userCan(user, item.permission)) return null;
      return item;
    })
    .filter(Boolean) as NavItemDef[];
}

function NavItem({ item }: { item: NavItemDef }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(() => {
    if (!item.children) return false;
    return item.children.some((c) => pathname.startsWith(c.href));
  });

  if (item.children) {
    const isActiveGroup = item.children.some((c) => pathname.startsWith(c.href));
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
  const user = useAuthStore((s) => s.user);

  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: filterNavItems(group.items, user),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-64'} bg-slate-900 border-l border-slate-800 flex flex-col h-screen sticky top-0 overflow-hidden transition-all duration-300`}>
      <div className="p-4 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-[0_0_18px_rgba(255,255,255,0.12)]">
            <img
              src="/tiktakrun-logo.svg"
              alt=""
              aria-hidden="true"
              className="h-8 w-8 object-contain"
            />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-white font-black text-lg leading-none">TIK TAK RUN</h1>
              <p className="text-slate-500 text-xs mt-0.5">
                {user?.branch ? user.branch : 'Command Center'}
              </p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {visibleGroups.map((group) => (
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
