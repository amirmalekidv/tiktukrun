'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import type { User } from '@/types'
import { formatToman } from '@/lib/utils'

interface Props {
  isOpen: boolean
  onClose: () => void
  menuItems: { label: string; href: string }[]
  user: User | null
  isAuthenticated: boolean
  onLogout: () => void
}

const authMenuItems = [
  { label: 'پروفایل', href: '/profile', icon: 'fas fa-user' },
  { label: 'کیف پول', href: '/wallet', icon: 'fas fa-wallet' },
  { label: 'رزروهای من', href: '/bookings', icon: 'fas fa-calendar-check' },
  { label: 'دعوت', href: '/invites', icon: 'fas fa-user-plus' },
  { label: 'پشتیبانی', href: '/tickets', icon: 'fas fa-headset' },
  { label: 'اعلان‌ها', href: '/notifications', icon: 'fas fa-bell' },
  { label: 'تنظیمات', href: '/settings', icon: 'fas fa-cog' },
]

export default function MobileMenu({ isOpen, onClose, menuItems, user, isAuthenticated, onLogout }: Props) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] lg:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Menu panel - slides from right (RTL) */}
      <div className="absolute right-0 top-0 bottom-0 w-80 bg-bg-dark border-l border-red-900/40 shadow-xl shadow-black flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-red-900/30">
          <span className="font-cinzel font-black text-xl text-white flicker">TIK TAK RUN</span>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-red-950/30 border border-red-800/30 text-gray-400 hover:text-white transition-colors"
          >
            <i className="fas fa-times text-lg" />
          </button>
        </div>

        {/* User section */}
        {isAuthenticated && user ? (
          <div className="p-4 border-b border-red-900/30">
            <div className="flex items-center gap-3">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name || 'کاربر'} className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-red-800 flex items-center justify-center">
                  <i className="fas fa-user text-white" />
                </div>
              )}
              <div>
                <div className="text-white font-medium">{user.name || 'کاربر'}</div>
                <div className="text-yellow-400 text-sm">
                  <i className="fas fa-wallet ml-1" />
                  {formatToman(user.walletBalance)} تومان
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 border-b border-red-900/30">
            <Link
              href="/login"
              onClick={onClose}
              className="btn-blood w-full text-center block py-3"
            >
              <i className="fas fa-sign-in-alt ml-2" />
              ورود / ثبت‌نام
            </Link>
          </div>
        )}

        {/* Menu items */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {menuItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-200 hover:text-red-400 hover:bg-red-950/30 transition-all"
                >
                  <i className="fas fa-chevron-left text-red-600 text-xs" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>

          {isAuthenticated && (
            <>
              <div className="border-t border-red-900/30 mt-4 pt-4 px-3 space-y-1">
                {authMenuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-200 hover:text-red-400 hover:bg-red-950/30 transition-all"
                  >
                    <i className={`${item.icon} text-red-400 w-4`} />
                    <span>{item.label}</span>
                  </Link>
                ))}
                <button
                  onClick={() => { onLogout(); onClose() }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-950/30 transition-all text-right"
                >
                  <i className="fas fa-sign-out-alt w-4" />
                  <span>خروج</span>
                </button>
              </div>
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-red-900/30 text-center text-gray-500 text-xs">
          © ۱۴۰۳ تیک تاک ران — همه حقوق محفوظ است
        </div>
      </div>
    </div>
  )
}
