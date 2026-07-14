'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { canAccessPath } from '@/lib/route-permissions';

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'SUPPORT', 'MARKETING'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.replace('/login');
      return;
    }

    const hasAdminRole = user.roles.some((r) => ADMIN_ROLES.includes(r));
    if (!hasAdminRole) {
      router.replace('/login');
      return;
    }

    if (!canAccessPath(user, pathname)) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, user, pathname, router]);

  if (!isAuthenticated || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-400">
        در حال بررسی دسترسی...
      </div>
    );
  }

  return <>{children}</>;
}
