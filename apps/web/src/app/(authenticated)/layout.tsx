'use client';
import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const router = useRouter();
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (!hasHydrated || isLoading) return;

    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [hasHydrated, isAuthenticated, isLoading, router]);

  if (!hasHydrated || isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-transparent" dir="rtl">
      <main className="max-w-7xl mx-auto px-4 pb-8 pt-24 md:pt-28">
        {children}
      </main>
    </div>
  );
}
