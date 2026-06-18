'use client'
import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { useNotificationsStore } from '@/stores/notificationsStore'
import { useUiStore } from '@/stores/uiStore'
import { formatJalali } from '@/lib/utils'
import { NotificationsPanel } from './NotificationsPanel'
import { UserMenuDropdown } from './UserMenuDropdown'

const breadcrumbMap: Record<string, string> = {
  '/dashboard': 'نمای کلی',
  '/analytics': 'آنالیتیکس',
  '/reports': 'گزارش‌ها',
  '/customers': 'مشتریان',
  '/segments': 'سگمنت‌ها',
  '/pipeline': 'Pipeline فروش',
  '/activities': 'تاریخچه فعالیت',
  '/campaigns': 'کمپین‌ها',
  '/messages': 'ایمیل/پیامک',
  '/bookings': 'رزروها',
  '/games': 'بازی‌ها',
  '/settings': 'تنظیمات',
}

function getBreadcrumb(pathname: string): { label: string; parent?: string } {
  if (breadcrumbMap[pathname]) return { label: breadcrumbMap[pathname] }
  
  const parts = pathname.split('/').filter(Boolean)
  if (parts.length >= 2) {
    const parent = `/${parts[0]}`
    return {
      label: parts[parts.length - 1] === 'new' ? 'ایجاد جدید' : 'جزئیات',
      parent: breadcrumbMap[parent] || parts[0],
    }
  }
  return { label: 'داشبورد' }
}

export function Topbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuthStore()
  const { unreadCount, isOpen, setOpen } = useNotificationsStore()
  const { setSidebarMobile } = useUiStore()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false)

  const breadcrumb = getBreadcrumb(pathname)
  const today = formatJalali(new Date(), 'long')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/customers?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <>
      <header
        className="sticky top-0 z-30 h-16 flex items-center gap-4 px-4 lg:px-6 border-b border-slate-700/30"
        style={{ background: 'rgba(2,6,23,0.8)', backdropFilter: 'blur(12px)' }}
      >
        {/* Mobile menu button */}
        <button
          onClick={() => setSidebarMobile(true)}
          className="lg:hidden text-slate-400 hover:text-white p-2"
        >
          <i className="fas fa-bars text-lg" />
        </button>

        {/* Breadcrumb */}
        <div className="hidden sm:flex items-center gap-2 text-sm flex-shrink-0">
          <i className="fas fa-house text-slate-600 text-xs" />
          {breadcrumb.parent && (
            <>
              <span className="text-slate-500">{breadcrumb.parent}</span>
              <i className="fas fa-chevron-left text-slate-700 text-xs" />
            </>
          )}
          <span className="text-slate-300 font-medium">{breadcrumb.label}</span>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md mx-auto">
          <div className="relative">
            <i className="fas fa-search absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="جستجوی مشتری، رزرو، بازی..."
              className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg pr-9 pl-4 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-red-600/50"
            />
          </div>
        </form>

        {/* Right Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Date */}
          <span className="hidden xl:block text-xs text-slate-500 border border-slate-700/30 px-2 py-1 rounded-md">
            {today}
          </span>

          {/* Chat */}
          <button className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors">
            <i className="fas fa-comments text-sm" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full" />
          </button>

          {/* Notifications */}
          <button
            onClick={() => setOpen(!isOpen)}
            className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
          >
            <i className="fas fa-bell text-sm" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-600 text-white text-[9px] rounded-full flex items-center justify-center font-bold px-1">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Divider */}
          <div className="h-6 w-px bg-slate-700/50" />

          {/* User Menu */}
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800/50 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.slice(0, 2) || 'AD'}
            </div>
            <span className="hidden md:block text-sm text-slate-300">{user?.name || 'مدیر'}</span>
            <i className={`fas fa-chevron-down text-slate-500 text-xs transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </header>

      {/* Notifications Panel */}
      {isOpen && <NotificationsPanel />}

      {/* User Dropdown */}
      {showUserMenu && <UserMenuDropdown onClose={() => setShowUserMenu(false)} />}
    </>
  )
}
