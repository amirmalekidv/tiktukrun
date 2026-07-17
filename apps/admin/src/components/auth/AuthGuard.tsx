'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { canAccessPath } from '@/lib/route-permissions';
import { getAccessToken, isTokenExpired } from '@/lib/auth';

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'SUPPORT', 'MARKETING'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, hasHydrated, restoreSession, logout } = useAuthStore();
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  useEffect(() => {
    if (!hasHydrated) return;

    let cancelled = false;

    async function checkAccess() {
      const accessToken = getAccessToken();
      const needsSessionRestore =
        !isAuthenticated ||
        !user ||
        !accessToken ||
        isTokenExpired(accessToken, 30_000);

      if (needsSessionRestore) {
        const restored = await restoreSession();
        if (cancelled) return;

        if (!restored) {
          router.replace('/login');
          setIsCheckingAccess(false);
        }
        return;
      }

      const hasAdminRole = user.roles.some((r) => ADMIN_ROLES.includes(r));
      if (!hasAdminRole) {
        logout();
        router.replace('/login');
        setIsCheckingAccess(false);
        return;
      }

      if (!canAccessPath(user, pathname)) {
        router.replace('/dashboard');
        setIsCheckingAccess(false);
        return;
      }

      setIsCheckingAccess(false);
    }

    setIsCheckingAccess(true);
    void checkAccess();

    return () => {
      cancelled = true;
    };
  }, [hasHydrated, isAuthenticated, user, pathname, router, restoreSession, logout]);

  if (!hasHydrated || isLoading || isCheckingAccess || !isAuthenticated || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-400">
        در حال بررسی دسترسی...
      </div>
    );
  }

  return <>{children}</>;
}
