'use client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Images, Star, BarChart3 } from 'lucide-react';
import { SectionHeader } from '@/components/ui';
import GameForm from '@/components/games/GameForm';

export default function EditGamePage() {
  const params = useParams();
  const id = params.id as string;

  // Mock game data
  const game = undefined; // Real: useSWR(`/admin/games/${id}`, fetcher)

  return (
    <div className="fade-in">
      <SectionHeader
        title="ویرایش بازی"
        subtitle={`شناسه: ${id}`}
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
      <div className="max-w-3xl">
        <GameForm game={game} />
      </div>
    </div>
  );
}
