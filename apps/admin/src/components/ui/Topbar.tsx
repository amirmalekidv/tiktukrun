'use client';
import { useState } from 'react';
import { Bell, Search, Menu, LogOut, User, Settings, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth';
import Link from 'next/link';

interface TopbarProps {
  onToggleSidebar?: () => void;
  pageTitle?: string;
}

export default function Topbar({ onToggleSidebar, pageTitle }: TopbarProps) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);

  const mockNotifications = [
    { id: 1, text: 'رزرو جدید #BK-001234 ثبت شد', time: '۲ دقیقه پیش', type: 'booking' },
    { id: 2, text: 'تیکت #TKT-0056 پاسخ نیاز دارد', time: '۱۵ دقیقه پیش', type: 'ticket' },
    { id: 3, text: '۳ پیام گزارش‌شده در انتظار بررسی', time: '۳۰ دقیقه پیش', type: 'chat' },
  ];

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-40">
      {/* Right side */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-all"
        >
          <Menu className="w-5 h-5" />
        </button>

        {pageTitle && (
          <h2 className="text-white font-semibold text-lg">{pageTitle}</h2>
        )}
      </div>

      {/* Search */}
      <div className="flex-1 max-w-md mx-6 hidden md:block">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="جستجو در پنل..."
            className="w-full bg-slate-800 border border-slate-700/50 text-slate-300 rounded-lg pr-10 pl-4 py-2 text-sm focus:outline-none focus:border-red-500/50 placeholder-slate-600"
          />
        </div>
      </div>

      {/* Left side */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setShowNotifs(!showNotifs); setShowUserMenu(false); }}
            className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {showNotifs && (
            <div className="absolute left-0 top-12 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50">
              <div className="p-4 border-b border-slate-700">
                <h3 className="text-white font-bold text-sm">اعلان‌ها</h3>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {mockNotifications.map((n) => (
                  <div key={n.id} className="p-3 hover:bg-slate-700/50 border-b border-slate-700/30 cursor-pointer">
                    <p className="text-slate-300 text-sm">{n.text}</p>
                    <p className="text-slate-500 text-xs mt-1">{n.time}</p>
                  </div>
                ))}
              </div>
              <div className="p-3 text-center">
                <button className="text-red-400 text-sm hover:text-red-300">مشاهده همه</button>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifs(false); }}
            className="flex items-center gap-2 p-2 hover:bg-slate-800 rounded-lg transition-all"
          >
            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">
                {user?.name?.charAt(0) || 'A'}
              </span>
            </div>
            <div className="hidden md:block text-right">
              <p className="text-white text-sm font-medium leading-none">{user?.name || 'ادمین'}</p>
              <p className="text-slate-500 text-xs mt-0.5">{user?.roles?.[0]?.label || 'Super Admin'}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-500 hidden md:block" />
          </button>

          {showUserMenu && (
            <div className="absolute left-0 top-12 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50">
              <div className="p-2 space-y-1">
                <Link
                  href="/settings/general"
                  className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg text-sm"
                  onClick={() => setShowUserMenu(false)}
                >
                  <Settings className="w-4 h-4" />
                  تنظیمات
                </Link>
                <Link
                  href="/staff"
                  className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg text-sm"
                  onClick={() => setShowUserMenu(false)}
                >
                  <User className="w-4 h-4" />
                  پروفایل
                </Link>
                <hr className="border-slate-700 my-1" />
                <button
                  onClick={() => { logout(); window.location.href = '/login'; }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  خروج
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
