'use client';

import { useState, useEffect, useCallback } from 'react';
import { SectionHeader, StatusBadge, EmptyState, ConfirmDialog } from '@/components/ui';
import { FiStar, FiCheck, FiX, FiTrash2, FiArrowRight, FiRefreshCw } from 'react-icons/fi';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { reviewsApi } from '@/lib/api';
import { toJalali, persianNum } from '@/lib/utils/format';
import toast from 'react-hot-toast';

interface ReviewItem {
  id: string;
  userId: string;
  gameId: string;
  bookingId: string;
  rating: number;
  text?: string;
  isApproved: boolean;
  helpfulCount: number;
  createdAt: string;
  user?: { id: string; fullName: string; mobile?: string };
  game?: { id: string; title: string };
}

// admin/reviews list is double-wrapped via buildPaginatedResponse: { success, data: { data, total } }
function unwrapList(res: any): { items: ReviewItem[]; total: number } {
  const body = res?.data;
  const inner = body && typeof body === 'object' && 'data' in body ? body.data : body;
  const items = Array.isArray(inner?.data) ? inner.data : Array.isArray(inner) ? inner : [];
  const total = Number(inner?.total ?? body?.total ?? items.length) || 0;
  return { items, total };
}

function StarDisplay({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <FiStar
          key={i}
          className={`${size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5'} ${
            i <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
          }`}
        />
      ))}
    </div>
  );
}

export default function GameReviewsPage() {
  const params = useParams();
  const gameId = params?.id as string;
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'' | 'pending' | 'approved'>('');
  const [acting, setActing] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!gameId) return;
    setLoading(true);
    try {
      const params: Record<string, unknown> = { gameId, limit: 100 };
      if (filter === 'approved') params.isApproved = 'true';
      if (filter === 'pending') params.isApproved = 'false';
      const res = await reviewsApi.getAll(params);
      const { items } = unwrapList(res);
      setReviews(items);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'خطا در دریافت نظرات');
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [gameId, filter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleApprove = async (id: string) => {
    setActing(true);
    try {
      await reviewsApi.approve(id);
      toast.success('نظر تأیید شد');
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, isApproved: true } : r)));
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'خطا در تأیید نظر');
    } finally {
      setActing(false);
    }
  };

  const handleReject = async (id: string) => {
    setActing(true);
    try {
      await reviewsApi.reject(id);
      toast.success('نظر رد شد');
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, isApproved: false } : r)));
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'خطا در رد نظر');
    } finally {
      setActing(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setActing(true);
    try {
      await reviewsApi.delete(deleteId);
      toast.success('نظر حذف شد');
      setReviews((prev) => prev.filter((r) => r.id !== deleteId));
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'خطا در حذف نظر');
    } finally {
      setActing(false);
      setDeleteId(null);
    }
  };

  const approved = reviews.filter((r) => r.isApproved);
  const avgRating = approved.length ? approved.reduce((a, r) => a + r.rating, 0) / approved.length : 0;
  const counts = {
    pending: reviews.filter((r) => !r.isApproved).length,
    approved: approved.length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/games/${gameId}`}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
        >
          <FiArrowRight className="w-5 h-5" />
        </Link>
        <SectionHeader title="نظرات بازی" subtitle="مدیریت و تأیید نظرات کاربران" icon={<FiStar />} />
        <button
          onClick={load}
          className="btn-secondary flex items-center gap-2 mr-auto"
          disabled={loading}
        >
          <FiRefreshCw className={loading ? 'animate-spin' : ''} />
          بروزرسانی
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 text-center">
          <div className="flex justify-center mb-1">
            <StarDisplay rating={Math.round(avgRating)} size="md" />
          </div>
          <p className="text-2xl font-bold text-amber-400">{avgRating ? persianNum(avgRating.toFixed(1)) : '—'}</p>
          <p className="text-slate-400 text-xs">میانگین امتیاز</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-amber-500/30 text-center">
          <p className="text-2xl font-bold text-amber-400">{persianNum(counts.pending)}</p>
          <p className="text-slate-400 text-xs">در انتظار تأیید</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-green-500/20 text-center">
          <p className="text-2xl font-bold text-green-400">{persianNum(counts.approved)}</p>
          <p className="text-slate-400 text-xs">تأیید شده</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {[
          { v: '', label: 'همه' },
          { v: 'pending', label: 'در انتظار' },
          { v: 'approved', label: 'تأیید شده' },
        ].map((s) => (
          <button
            key={s.v}
            onClick={() => setFilter(s.v as any)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              filter === s.v ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Reviews */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <FiRefreshCw className="w-8 h-8 text-red-400 animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState title="نظری یافت نشد" description="برای این بازی با فیلتر انتخاب‌شده نظری وجود ندارد." />
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div
              key={review.id}
              className={`bg-slate-800 rounded-xl border p-5 ${
                review.isApproved ? 'border-slate-700' : 'border-amber-500/30'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {(review.user?.fullName || '؟')[0]}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{review.user?.fullName || '—'}</p>
                    <p className="text-slate-500 text-xs">{toJalali(review.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge
                    status={review.isApproved ? 'success' : 'warning'}
                    label={review.isApproved ? 'تأیید شده' : 'در انتظار'}
                  />
                  <StarDisplay rating={review.rating} />
                </div>
              </div>

              {review.text && <p className="text-slate-300 text-sm leading-relaxed mb-3">{review.text}</p>}

              {review.helpfulCount > 0 && (
                <p className="text-xs text-slate-500 mb-3">{persianNum(review.helpfulCount)} نفر این نظر را مفید دانستند</p>
              )}

              <div className="flex gap-2">
                {!review.isApproved && (
                  <button
                    onClick={() => handleApprove(review.id)}
                    disabled={acting}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg text-sm transition-colors"
                  >
                    <FiCheck className="w-3.5 h-3.5" />
                    تأیید
                  </button>
                )}
                {review.isApproved && (
                  <button
                    onClick={() => handleReject(review.id)}
                    disabled={acting}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg text-sm transition-colors"
                  >
                    <FiX className="w-3.5 h-3.5" />
                    لغو تأیید
                  </button>
                )}
                <button
                  onClick={() => setDeleteId(review.id)}
                  disabled={acting}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-400 rounded-lg text-sm transition-colors"
                >
                  <FiTrash2 className="w-3.5 h-3.5" />
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="حذف نظر"
        description="این نظر برای همیشه حذف می‌شود. ادامه می‌دهید؟"
        confirmLabel="حذف کن"
        variant="danger"
        loading={acting}
      />
    </div>
  );
}
