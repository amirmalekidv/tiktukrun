'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Images, Star, BarChart3, RefreshCw } from 'lucide-react';
import { SectionHeader, EmptyState } from '@/components/ui';
import GameForm from '@/components/games/GameForm';
import { gamesApi } from '@/lib/api';
import type { Game } from '@/lib/types';
import toast from 'react-hot-toast';

// admin/games/:id is single-wrapped: { success, data: game }
function readData<T>(res: any): T {
  const body = res?.data;
  if (body && typeof body === 'object' && 'data' in body) return body.data as T;
  return body as T;
}

export default function EditGamePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await gamesApi.getById(id);
      setGame(readData<Game>(res) || null);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'خطا در دریافت اطلاعات بازی');
      setGame(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="fade-in">
      <SectionHeader
        title="ویرایش بازی"
        subtitle={game?.title ? game.title : `شناسه: ${id}`}
        breadcrumb={[{ label: 'بازی‌ها', href: '/games' }, { label: 'ویرایش بازی' }]}
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/games/${id}/images`} className="btn-secondary">
              <Images className="w-4 h-4" />
              گالری تصاویر
            </Link>
            <Link href={`/games/${id}/reviews`} className="btn-secondary">
              <Star className="w-4 h-4" />
              نظرات
            </Link>
            <Link href={`/games/${id}/stats`} className="btn-secondary">
              <BarChart3 className="w-4 h-4" />
              آمار
            </Link>
          </div>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <RefreshCw className="w-8 h-8 text-red-400 animate-spin" />
        </div>
      ) : !game ? (
        <EmptyState title="بازی یافت نشد" description="بازی مورد نظر وجود ندارد یا حذف شده است." />
      ) : (
        <div className="max-w-3xl">
          <GameForm game={game} onSuccess={() => router.push('/games')} />
        </div>
      )}
    </div>
  );
}
