'use client';
import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Toaster } from 'react-hot-toast';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0a0a0a]" dir="rtl">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#1a1a1a',
            color: '#f5f5f5',
            border: '1px solid #7f1d1d',
            fontFamily: 'Vazirmatn, sans-serif',
            direction: 'rtl',
          },
          success: { iconTheme: { primary: '#dc2626', secondary: '#fff' } },
          error: { iconTheme: { primary: '#7f1d1d', secondary: '#fff' } },
        }}
      />

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-[#0d0d0d]/95 backdrop-blur border-b border-red-900/30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <a href="/" className="font-cinzel text-2xl text-red-500 tracking-widest">
            TIK TAK RUN
          </a>
          <div className="flex items-center gap-4 flex-wrap">
            <a href="/profile" className="text-gray-300 hover:text-red-400 text-sm font-vazir transition-colors">
              پروفایل
            </a>
            <a href="/wallet" className="text-gray-300 hover:text-red-400 text-sm font-vazir transition-colors">
              کیف پول
            </a>
            <a href="/wheel" className="text-gray-300 hover:text-red-400 text-sm font-vazir transition-colors">
              گردونه
            </a>
            <a href="/community" className="text-gray-300 hover:text-red-400 text-sm font-vazir transition-colors">
              انجمن
            </a>
            <a href="/leaderboard" className="text-gray-300 hover:text-red-400 text-sm font-vazir transition-colors">
              تالار
            </a>
            <a href="/invites" className="text-gray-300 hover:text-red-400 text-sm font-vazir transition-colors">
              دعوت
            </a>
            <a href="/tickets" className="text-gray-300 hover:text-red-400 text-sm font-vazir transition-colors">
              پشتیبانی
            </a>
            <a href="/bookings" className="text-gray-300 hover:text-red-400 text-sm font-vazir transition-colors">
              رزروها
            </a>
            <a href="/notifications" className="relative text-gray-300 hover:text-red-400 transition-colors">
              <i className="fas fa-bell text-lg" />
            </a>
            <a href="/settings" className="text-gray-300 hover:text-red-400 transition-colors">
              <i className="fas fa-cog text-lg" />
            </a>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('auth_token');
                  window.location.href = '/login';
                }
              }}
              className="text-xs text-red-600 hover:text-red-400 transition-colors border border-red-900/50 rounded px-3 py-1 font-vazir"
            >
              خروج
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="mt-16 border-t border-red-900/20 py-6 text-center text-gray-600 text-xs font-vazir">
        © ۱۴۰۳ TIK TAK RUN — همه حقوق محفوظ است
      </footer>
    </div>
  );
}
