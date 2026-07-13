'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import type { User } from '@/types'
import { formatToman, maskMobile } from '@/lib/utils'

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
      <div className="absolute right-0 top-0 bottom-0 w-80 bg-[#05070a]/95 border-l border-white/10 shadow-xl shadow-black flex flex-col backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-[11px] bg-white shadow-[0_0_20px_rgba(255,255,255,0.16)]">
              <img
                src="/tiktakrun-logo.svg"
                alt=""
                aria-hidden="true"
                className="h-7 w-7 object-contain"
              />
            </span>
            <span className="font-cinzel font-black text-lg text-white">
              TIK TAK <span className="glow-teal">RUN</span>
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/[0.04] border border-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <i className="fas fa-times text-lg" />
          </button>
        </div>

        {/* User section */}
        {isAuthenticated && user ? (
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name || 'کاربر'} className="w-12 h-12 rounded-full object-cover ring-2 ring-[#00f5ff]/35" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ff00e5] to-[#b026ff] flex items-center justify-center ring-2 ring-[#00f5ff]/35">
                  <i className="fas fa-user text-white" />
                </div>
              )}
              <div>
                <div className="text-white font-medium">{user.name || maskMobile(user.mobile)}</div>
                <div className="text-[#00f5ff] text-sm">
                  <span className="ml-1">◈</span>
                  {formatToman(user.walletBalance)} تومان
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 border-b border-white/10">
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
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-200 hover:text-[#00f5ff] hover:bg-white/[0.04] transition-all"
                >
                  <i className="fas fa-chevron-left text-[#00f5ff] text-xs" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>

          {isAuthenticated && (
            <>
              <div className="border-t border-white/10 mt-4 pt-4 px-3 space-y-1">
                {authMenuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-200 hover:text-[#00f5ff] hover:bg-white/[0.04] transition-all"
                  >
                    <i className={`${item.icon} text-[#00f5ff] w-4`} />
                    <span>{item.label}</span>
                  </Link>
                ))}
                <button
                  onClick={() => { onLogout(); onClose() }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#ff5470] hover:bg-white/[0.04] transition-all text-right"
                >
                  <i className="fas fa-sign-out-alt w-4" />
                  <span>خروج</span>
                </button>
              </div>
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 text-center text-gray-500 text-xs">
          © ۱۴۰۳ تیک تاک ران — همه حقوق محفوظ است
        </div>
      </div>
    </div>
  )
}
