'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/stores/authStore'

interface Props { onClose: () => void }

export function UserMenuDropdown({ onClose }: Props) {
  const router = useRouter()
  const { logout } = useAuth()
  const { user } = useAuthStore()

  const handleLogout = async () => {
    onClose()
    await logout()
    router.push('/login')
  }

  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <div
        className="fixed top-16 left-4 z-40 w-56 rounded-xl border border-slate-700/50 overflow-hidden slide-in-right py-1"
        style={{ background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(16px)' }}
      >
        {/* User Info */}
        <div className="px-4 py-3 border-b border-slate-700/30">
          <p className="text-sm font-semibold text-slate-200">{user?.name}</p>
          <p className="text-xs text-slate-500">{user?.mobile}</p>
        </div>

        {/* Menu Items */}
        <div className="py-1">
          {[
            { icon: 'fa-user', label: 'پروفایل من', href: '/profile' },
            { icon: 'fa-gear', label: 'تنظیمات', href: '/settings' },
            { icon: 'fa-shield', label: 'امنیت', href: '/security' },
          ].map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 transition-colors"
            >
              <i className={`fas ${item.icon} w-4 text-center text-xs`} />
              {item.label}
            </Link>
          ))}
        </div>

        <div className="border-t border-slate-700/30 py-1">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-600/10 transition-colors"
          >
            <i className="fas fa-right-from-bracket w-4 text-center text-xs" />
            خروج از سیستم
          </button>
        </div>
      </div>
    </>
  )
}
