'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { useUiStore } from '@/stores/uiStore'
import { cn } from '@/lib/utils'
import { can, getRoleLabel } from '@/lib/permissions'
import type { AdminUser } from '@/types'

// =============================================
// Sidebar Item Types
// =============================================
interface NavItem {
  icon: string
  label: string
  href: string
  badge?: number | null
  permission?: string
}

interface NavSection {
  title: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    title: 'داشبورد',
    items: [
      { icon: 'fas fa-gauge-high', label: 'نمای کلی', href: '/dashboard', permission: 'dashboard.view' },
      { icon: 'fas fa-chart-line', label: 'آنالیتیکس', href: '/analytics', permission: 'analytics.view' },
      { icon: 'fas fa-file-chart-column', label: 'گزارش‌ها', href: '/reports', permission: 'analytics.view' },
    ],
  },
  {
    title: 'مشتریان (CRM)',
    items: [
      { icon: 'fas fa-users', label: 'لیست مشتریان', href: '/customers', permission: 'customers.view' },
      { icon: 'fas fa-layer-group', label: 'سگمنت‌ها', href: '/segments', permission: 'segments.view' },
      { icon: 'fas fa-kanban', label: 'Pipeline', href: '/pipeline', permission: 'pipeline.view' },
      { icon: 'fas fa-timeline', label: 'تاریخچه فعالیت', href: '/activities', permission: 'activities.view' },
    ],
  },
  {
    title: 'بازاریابی',
    items: [
      { icon: 'fas fa-megaphone', label: 'کمپین‌ها', href: '/campaigns', permission: 'campaigns.view' },
      { icon: 'fas fa-envelope', label: 'ایمیل/پیامک', href: '/messages', permission: 'campaigns.view' },
      { icon: 'fas fa-spinner', label: 'گردونه شانس', href: '/spin-wheel', permission: 'campaigns.view' },
      { icon: 'fas fa-tag', label: 'تخفیف‌ها', href: '/discounts', permission: 'campaigns.view' },
    ],
  },
  {
    title: 'عملیات',
    items: [
      { icon: 'fas fa-calendar-check', label: 'رزروها', href: '/bookings', permission: 'bookings.view' },
      { icon: 'fas fa-gamepad', label: 'بازی‌ها', href: '/games', permission: 'bookings.view' },
      { icon: 'fas fa-store', label: 'شعب', href: '/branches', permission: 'settings.view' },
      { icon: 'fas fa-headset', label: 'تیکت‌ها', href: '/tickets', permission: 'activities.view' },
      { icon: 'fas fa-comments', label: 'چت/مدیریت', href: '/chat', permission: 'activities.view' },
    ],
  },
  {
    title: 'مالی',
    items: [
      { icon: 'fas fa-money-bill-wave', label: 'تراکنش‌ها', href: '/transactions', permission: 'analytics.view' },
      { icon: 'fas fa-credit-card', label: 'پرداخت‌ها', href: '/payments', permission: 'analytics.view' },
      { icon: 'fas fa-chart-pie', label: 'گزارش مالی', href: '/financial-reports', permission: 'analytics.view' },
      { icon: 'fas fa-database', label: 'Backup', href: '/backup', permission: 'settings.view' },
    ],
  },
  {
    title: 'سیستم',
    items: [
      { icon: 'fas fa-gear', label: 'تنظیمات', href: '/settings', permission: 'settings.view' },
      { icon: 'fas fa-shield-halved', label: 'نقش‌ها و دسترسی‌ها', href: '/roles', permission: 'settings.view' },
      { icon: 'fas fa-scroll', label: 'Audit Log', href: '/audit-log', permission: 'settings.view' },
      { icon: 'fas fa-user-shield', label: 'کاربران ادمین', href: '/admins', permission: 'settings.view' },
    ],
  },
]

// =============================================
// SidebarItem Component
// =============================================
function SidebarItem({ item, isActive }: { item: NavItem; isActive: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group relative text-sm',
        isActive
          ? 'bg-red-600/20 border-r-2 border-red-500 text-red-300'
          : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100 border-r-2 border-transparent'
      )}
    >
      <i className={cn(
        item.icon, 'w-4 text-center text-xs flex-shrink-0 transition-colors',
        isActive ? 'text-red-400' : 'text-slate-500 group-hover:text-slate-300'
      )} />
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge != null && item.badge > 0 && (
        <span className="bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
          {item.badge > 99 ? '99+' : item.badge}
        </span>
      )}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-red-500 rounded-r-full" />
      )}
    </Link>
  )
}

// =============================================
// SidebarSection Component
// =============================================
function SidebarSection({ section, pathname, user }: { section: NavSection; pathname: string; user: AdminUser | null }) {
  const visibleItems = section.items.filter(item => !item.permission || can(user, item.permission))
  if (visibleItems.length === 0) return null
  
  return (
    <div className="mb-4">
      <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-3 mb-1.5">
        {section.title}
      </p>
      <div className="space-y-0.5">
        {visibleItems.map(item => (
          <SidebarItem
            key={item.href}
            item={item}
            isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
          />
        ))}
      </div>
    </div>
  )
}

// =============================================
// Main Sidebar Component
// =============================================
export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuthStore()
  const { sidebarMobileOpen, setSidebarMobile } = useUiStore()

  const sidebarContent = (
    <div className="h-full flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-red-900/30">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-[0_0_16px_rgba(255,255,255,0.12)]">
            <img
              src="/tiktakrun-logo.svg"
              alt=""
              aria-hidden="true"
              className="h-7 w-7 object-contain"
            />
          </div>
          <div>
            <h1 className="font-cinzel text-sm font-bold text-white tracking-widest leading-tight">
              TIK TAK RUN
            </h1>
            <p className="text-slate-500 text-xs">Command Center</p>
          </div>
        </Link>
      </div>

      {/* Admin Info */}
      {user && (
        <div className="p-4 border-b border-slate-700/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user.name?.slice(0, 2) || 'AD'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">{user.name}</p>
              <p className="text-xs text-slate-500">
                {getRoleLabel(user.roles[0] ?? 'ADMIN')}
              </p>
            </div>
            <div className="flex-shrink-0">
              <span className="w-2 h-2 bg-emerald-500 rounded-full block" title="آنلاین" />
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navSections.map(section => (
          <SidebarSection
            key={section.title}
            section={section}
            pathname={pathname}
            user={user}
          />
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-slate-700/30">
        <div className="flex items-center justify-between px-3 py-2 text-xs text-slate-600">
          <span>v1.0.0</span>
          <div className="flex items-center gap-1.5">
            <span className="live-dot" style={{ width: 6, height: 6 }} />
            <span className="text-emerald-500">آنلاین</span>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:flex flex-col w-64 h-screen sticky top-0 overflow-hidden border-l border-red-900/30 flex-shrink-0"
        style={{ background: 'rgba(2,6,23,0.9)', backdropFilter: 'blur(12px)' }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarMobileOpen && (
        <div
          className="sidebar-overlay lg:hidden"
          onClick={() => setSidebarMobile(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'lg:hidden fixed inset-y-0 right-0 z-50 w-64 flex flex-col h-full transition-transform duration-300 border-l border-red-900/30',
          sidebarMobileOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        style={{ background: 'rgba(2,6,23,0.95)', backdropFilter: 'blur(12px)' }}
      >
        <button
          onClick={() => setSidebarMobile(false)}
          className="absolute top-4 left-4 text-slate-400 hover:text-white p-2"
        >
          <i className="fas fa-xmark text-lg" />
        </button>
        {sidebarContent}
      </aside>
    </>
  )
}
