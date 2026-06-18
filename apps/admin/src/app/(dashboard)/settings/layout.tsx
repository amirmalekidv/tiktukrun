'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FiSettings, FiDollarSign, FiMessageCircle, FiShield,
  FiAward, FiCreditCard, FiSmartphone, FiDroplet
} from 'react-icons/fi';

const SETTINGS_MENU = [
  { label: 'عمومی', path: '/settings/general', icon: FiSettings },
  { label: 'مالی', path: '/settings/financial', icon: FiDollarSign },
  { label: 'چت', path: '/settings/chat', icon: FiMessageCircle },
  { label: 'امنیتی', path: '/settings/security', icon: FiShield },
  { label: 'گیمیفیکیشن', path: '/settings/gamification', icon: FiAward },
  { label: 'درگاه پرداخت', path: '/settings/payments', icon: FiCreditCard },
  { label: 'پیامک', path: '/settings/sms', icon: FiSmartphone },
  { label: 'ظاهری', path: '/settings/theme', icon: FiDroplet },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex gap-6">
      {/* Settings Sidebar */}
      <div className="w-52 flex-shrink-0">
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden sticky top-6">
          <div className="p-4 border-b border-slate-700">
            <h3 className="text-white font-semibold text-sm flex items-center gap-2">
              <FiSettings className="text-red-400 w-4 h-4" />
              تنظیمات
            </h3>
          </div>
          <nav className="p-2">
            {SETTINGS_MENU.map(item => {
              const isActive = pathname === item.path || pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-red-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}
