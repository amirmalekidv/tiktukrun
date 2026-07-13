'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { formatToman, maskMobile } from '@/lib/utils'
import MobileMenu from './MobileMenu'

const menuItems = [
  { label: 'اتاق فرارها', href: '/games' },
  { label: 'برترین‌ها', href: '/section/featured' },
  { label: 'نظرات و تجربه پلیر', href: '/stories' },
  { label: 'پلیر های برتر', href: '/leaderboard' },
  { label: 'گردونه', href: '/wheel' },
  { label: 'چت آنلاین', href: '/community' },
]

const authDropdownItems = [
  { label: 'پروفایل', href: '/profile', icon: 'fas fa-user', iconClassName: 'text-red-400' },
  { label: 'کیف پول', href: '/wallet', icon: 'fas fa-wallet', iconClassName: 'text-yellow-400' },
  { label: 'رزروهای من', href: '/bookings', icon: 'fas fa-calendar-check', iconClassName: 'text-red-400' },
  { label: 'چت آنلاین', href: '/community', icon: 'fas fa-users', iconClassName: 'text-red-400' },
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
        className={`fixed top-0 left-0 right-0 z-50 border-b transition-all duration-500 ${
          scrolled
            ? 'border-white/10 bg-[#05070a]/90 shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-2xl'
            : 'border-white/10 bg-[#05070a]/70 backdrop-blur-xl'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 h-[72px] flex items-center gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
            <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-[11px] bg-white shadow-[0_0_20px_rgba(255,255,255,0.18)]">
              <img
                src="/tiktakrun-logo.svg"
                alt=""
                aria-hidden="true"
                className="h-8 w-8 object-contain"
              />
            </span>
            <span className="font-cinzel font-black text-lg text-white">
              TIK TAK <span className="glow-teal">RUN</span>
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
                      ? 'text-[#00f5ff] bg-white/[0.04] shadow-[inset_0_0_14px_rgba(0,245,255,0.16)]'
                      : 'text-[#9aa3b2] hover:text-white hover:bg-white/[0.04]'
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
                  className="hidden md:flex items-center gap-2 rounded-full border border-[#00f5ff]/30 bg-white/[0.04] px-3 py-1.5 transition-all hover:border-[#00f5ff]/60"
                >
                  <span className="glow-teal text-xs">◈</span>
                  <span className="text-[#00f5ff] text-xs font-bold">
                    {formatToman(user.walletBalance)} ت
                  </span>
                </Link>

                {/* User avatar + dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] py-1.5 pl-3 pr-1.5 transition-all hover:border-[#00f5ff]/45"
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name || 'کاربر'}
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-[#00f5ff]/35"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff00e5] to-[#b026ff] flex items-center justify-center ring-2 ring-[#00f5ff]/35">
                        <i className="fas fa-user text-xs text-white" />
                      </div>
                    )}
                    <span className="hidden md:block text-sm text-gray-200 max-w-[100px] truncate">
                      {user.name || maskMobile(user.mobile)}
                    </span>
                    <i className="fas fa-chevron-down text-xs text-gray-400" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 dark-card rounded-xl overflow-hidden z-50">
                      {authDropdownItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <i className={`${item.icon} ${item.iconClassName} w-4`} />
                          <span className="text-sm text-gray-200">{item.label}</span>
                        </Link>
                      ))}
                      <div className="border-t border-white/10 mt-1">
                        <button
                          onClick={() => { logout(); setUserMenuOpen(false) }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors text-right"
                        >
                          <i className="fas fa-sign-out-alt text-[#ff5470] w-4" />
                          <span className="text-sm text-[#ff5470]">خروج</span>
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
              className="lg:hidden p-2 rounded-lg bg-white/[0.04] border border-white/10 text-gray-300 hover:text-white transition-colors"
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
