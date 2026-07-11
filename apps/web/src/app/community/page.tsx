'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CommunityPageContent from '@/components/community/CommunityPageContent';
import { useAuthStore } from '@/store/auth.store';

export default function CommunityPage() {
  const router = useRouter();
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (!hasHydrated || isLoading) return;

    if (!isAuthenticated) {
      router.replace('/login?redirect=/community');
    }
  }, [hasHydrated, isAuthenticated, isLoading, router]);

  if (!hasHydrated || isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-transparent" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 pb-8 pt-24 md:pt-28">
        <CommunityPageContent />
      </div>
    </div>
  );
}
