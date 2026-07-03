'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { formatToman } from '@/lib/utils'
import MobileMenu from './MobileMenu'

const menuItems = [
  { label: 'قلمرو', href: '/games' },
  { label: 'تجربه‌ها', href: '/section/featured' },
  { label: 'داستان‌ها', href: '/stories' },
  { label: 'شجاعان', href: '/leaderboard' },
  { label: 'گردونه', href: '/wheel' },
  { label: 'انجمن', href: '/community' },
]

const authDropdownItems = [
  { label: 'پروفایل', href: '/profile', icon: 'fas fa-user', iconClassName: 'text-red-400' },
  { label: 'کیف پول', href: '/wallet', icon: 'fas fa-wallet', iconClassName: 'text-yellow-400' },
  { label: 'رزروهای من', href: '/bookings', icon: 'fas fa-calendar-check', iconClassName: 'text-red-400' },
  { label: 'انجمن', href: '/community', icon: 'fas fa-users', iconClassName: 'text-red-400' },
  { label: 'دعوت', href: '/invites', icon: 'fas fa-user-plus', iconClassName: 'text-red-400' },
  { label: 'پشتیبانی', href: '/tickets', icon: 'fas fa-headset', iconClassName: 'text-red-400' },
  { label: 'اعلان‌ها', href: '/notifications', icon: 'fas fa-bell', iconClassName: 'text-red-400' },
  { label: 'تنظیمات', href: '/settings', icon: 'fas fa-cog', iconClassName: 'text-red-400' },
]

export default function Navbar() {
  const pathname = usePathname()
  const { user, isAuthenticated, logout } = useAuthStore()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const desktopMenuItems = menuItems.map((item) =>
    item.href === '/community' && !isAuthenticated
      ? { ...item, href: '/login?redirect=/community' }
      : item
  )

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-black/95 backdrop-blur-md border-b border-red-900/50 shadow-lg shadow-red-950/50'
            : 'bg-gradient-to-b from-black/80 to-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
            <span className="text-2xl heartbeat inline-block">⏳</span>
            <span className="font-cinzel font-black text-xl tracking-wider flicker text-white">
              TIK TAK RUN
            </span>
          </Link>

          {/* Desktop Menu */}
          <ul className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            {desktopMenuItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`px-3 py-2 rounded-lg text-sm font-fa font-medium transition-all duration-300 ${
                    pathname === item.href || pathname.startsWith(item.href + '/')
                      ? 'text-red-400 bg-red-950/40'
                      : 'text-gray-300 hover:text-red-400 hover:bg-red-950/20'
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Right side */}
          <div className="flex items-center gap-3 flex-shrink-0 mr-auto lg:mr-0">
            {isAuthenticated && user ? (
              <>
                {/* Wallet pill */}
                <Link
                  href="/wallet"
                  className="hidden md:flex items-center gap-2 bg-yellow-900/30 border border-yellow-700/40 rounded-full px-3 py-1.5 transition-all hover:border-yellow-500/60 hover:bg-yellow-900/40"
                >
                  <i className="fas fa-wallet text-yellow-400 text-xs" />
                  <span className="text-yellow-300 text-xs font-bold">
                    {formatToman(user.walletBalance)} ت
                  </span>
                </Link>

                {/* User avatar + dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 bg-red-950/30 border border-red-800/40 rounded-full px-2 py-1.5 hover:border-red-600/60 transition-all"
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name || 'کاربر'}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-red-800 flex items-center justify-center">
                        <i className="fas fa-user text-xs text-white" />
                      </div>
                    )}
                    <span className="hidden md:block text-sm text-gray-200 max-w-[100px] truncate">
                      {user.name || maskMobileDisplay(user.mobile)}
                    </span>
                    <i className="fas fa-chevron-down text-xs text-gray-400" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 dark-card rounded-xl border border-red-900/40 shadow-xl shadow-black/80 overflow-hidden z-50">
                      {authDropdownItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-red-950/40 transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <i className={`${item.icon} ${item.iconClassName} w-4`} />
                          <span className="text-sm text-gray-200">{item.label}</span>
                        </Link>
                      ))}
                      <div className="border-t border-red-900/30 mt-1">
                        <button
                          onClick={() => { logout(); setUserMenuOpen(false) }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-950/40 transition-colors text-right"
                        >
                          <i className="fas fa-sign-out-alt text-red-500 w-4" />
                          <span className="text-sm text-red-400">خروج</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link
                href="/login"
                className="btn-blood text-sm py-2 px-4"
              >
                <i className="fas fa-sign-in-alt ml-1" />
                ورود
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              className="lg:hidden p-2 rounded-lg bg-red-950/30 border border-red-800/30 text-gray-300 hover:text-white transition-colors"
              onClick={() => setMobileOpen(true)}
              aria-label="منو"
            >
              <i className="fas fa-bars text-lg" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        menuItems={desktopMenuItems}
        user={user}
        isAuthenticated={isAuthenticated}
        onLogout={logout}
      />
    </>
  )
}

function maskMobileDisplay(mobile: string): string {
  if (!mobile || mobile.length < 7) return mobile
  return mobile.slice(0, 4) + '***' + mobile.slice(-2)
}
