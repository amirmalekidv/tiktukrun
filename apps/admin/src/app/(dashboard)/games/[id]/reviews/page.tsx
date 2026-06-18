'use client';

import { useState } from 'react';
import { SectionHeader, StatusBadge } from '@/components/ui';
import { FiStar, FiCheck, FiX, FiTrash2, FiArrowRight } from 'react-icons/fi';
import Link from 'next/link';

interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  bookingId: string;
  fearLevel: number;
  escapeTime?: number;
  createdAt: string;
  adminNote?: string;
}

const MOCK_REVIEWS: Review[] = [
  { id: '1', userId: 'u1', userName: 'علی محمدی', rating: 5, comment: 'اتاق فرار عالی بود! طراحی پازل‌ها خلاقانه و هیجان‌انگیز بود. حتماً دوباره میایم.', status: 'approved', bookingId: 'B-001', fearLevel: 4, escapeTime: 47, createdAt: '۱۴۰۳/۰۴/۱۰' },
  { id: '2', userId: 'u2', userName: 'مریم احمدی', rating: 4, comment: 'تجربه خوبی بود. کمی گیج‌کننده بود ولی کلاً مثبت.', status: 'pending', bookingId: 'B-002', fearLevel: 3, createdAt: '۱۴۰۳/۰۴/۱۲' },
  { id: '3', userId: 'u3', userName: 'رضا کریمی', rating: 2, comment: 'گیم‌ماستر غیرحرفه‌ای بود و یه سری پازل‌ها کار نمی‌کرد.', status: 'pending', bookingId: 'B-003', fearLevel: 2, createdAt: '۱۴۰۳/۰۴/۱۳' },
  { id: '4', userId: 'u4', userName: 'فاطمه حسینی', rating: 5, comment: 'بی‌نظیر بود! بهترین اتاق فراری که تا حالا رفتم.', status: 'approved', bookingId: 'B-004', fearLevel: 5, escapeTime: 52, createdAt: '۱۴۰۳/۰۴/۱۴' },
  { id: '5', userId: 'u5', userName: 'محمد رضایی', rating: 1, comment: 'اصلاً ارزش نداشت. کاملاً بی‌کیفیت.', status: 'rejected', bookingId: 'B-005', fearLevel: 1, createdAt: '۱۴۰۳/۰۴/۰۸', adminNote: 'نظر توهین‌آمیز' },
];

const STATUS_MAP = { pending: 'در انتظار', approved: 'تأیید شده', rejected: 'رد شده' };
const STATUS_COLOR: Record<string, any> = { pending: 'warning', approved: 'success', rejected: 'danger' };

function StarDisplay({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <FiStar
          key={i}
          className={`${size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5'} ${i <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`}
        />
      ))}
    </div>
  );
}

export default function GameReviewsPage({ params }: { params: { id: string } }) {
  const [reviews, setReviews] = useState<Review[]>(MOCK_REVIEWS);
  const [filter, setFilter] = useState<string>('');

  const filtered = reviews.filter(r => !filter || r.status === filter);

  const updateStatus = (id: string, status: 'approved' | 'rejected') => {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const deleteReview = (id: string) => {
    setReviews(prev => prev.filter(r => r.id !== id));
  };

  const avgRating = reviews.filter(r => r.status === 'approved').reduce((a, r) => a + r.rating, 0) / reviews.filter(r => r.status === 'approved').length;
  const counts = { pending: reviews.filter(r => r.status === 'pending').length, approved: reviews.filter(r => r.status === 'approved').length, rejected: reviews.filter(r => r.status === 'rejected').length };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/games/${params.id}`} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
          <FiArrowRight className="w-5 h-5" />
        </Link>
        <SectionHeader
          title={`نظرات بازی #${params.id}`}
          subtitle="مدیریت و تأیید نظرات کاربران"
          icon={<FiStar />}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 text-center">
          <div className="flex justify-center mb-1"><StarDisplay rating={Math.round(avgRating)} size="md" /></div>
          <p className="text-2xl font-bold text-amber-400">{avgRating?.toFixed(1) || '—'}</p>
          <p className="text-slate-400 text-xs">میانگین امتیاز</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-amber-500/30 text-center">
          <p className="text-2xl font-bold text-amber-400">{counts.pending}</p>
          <p className="text-slate-400 text-xs">در انتظار تأیید</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-green-500/20 text-center">
          <p className="text-2xl font-bold text-green-400">{counts.approved}</p>
          <p className="text-slate-400 text-xs">تأیید شده</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-red-500/20 text-center">
          <p className="text-2xl font-bold text-red-400">{counts.rejected}</p>
          <p className="text-slate-400 text-xs">رد شده</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['', 'pending', 'approved', 'rejected'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${filter === s ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}
          >
            {s === '' ? 'همه' : STATUS_MAP[s as keyof typeof STATUS_MAP]}
          </button>
        ))}
      </div>

      {/* Reviews */}
      <div className="space-y-3">
        {filtered.map(review => (
          <div
            key={review.id}
            className={`bg-slate-800 rounded-xl border p-5 ${review.status === 'pending' ? 'border-amber-500/30' : review.status === 'rejected' ? 'border-red-500/20' : 'border-slate-700'}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {review.userName[0]}
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{review.userName}</p>
                  <p className="text-slate-500 text-xs">{review.createdAt} · رزرو {review.bookingId}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={STATUS_COLOR[review.status]} label={STATUS_MAP[review.status]} />
                <StarDisplay rating={review.rating} />
              </div>
            </div>

            <p className="text-slate-300 text-sm leading-relaxed mb-3">{review.comment}</p>

            <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
              <span>سطح ترس: {'⭐'.repeat(review.fearLevel)}</span>
              {review.escapeTime && <span>زمان فرار: {review.escapeTime} دقیقه</span>}
              {review.adminNote && <span className="text-red-400">یادداشت ادمین: {review.adminNote}</span>}
            </div>

            {review.status === 'pending' && (
              <div className="flex gap-2">
                <button
                  onClick={() => updateStatus(review.id, 'approved')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg text-sm transition-colors"
                >
                  <FiCheck className="w-3.5 h-3.5" />
                  تأیید
                </button>
                <button
                  onClick={() => updateStatus(review.id, 'rejected')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm transition-colors"
                >
                  <FiX className="w-3.5 h-3.5" />
                  رد
                </button>
                <button
                  onClick={() => deleteReview(review.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-400 rounded-lg text-sm transition-colors"
                >
                  <FiTrash2 className="w-3.5 h-3.5" />
                  حذف
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <FiStar className="w-10 h-10 mx-auto mb-3 text-slate-600" />
          <p>نظری یافت نشد</p>
        </div>
      )}
    </div>
  );
}
