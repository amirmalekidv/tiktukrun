'use client';
import { useState } from 'react';
import { Star, Check, X, Trash2, Eye, Search } from 'lucide-react';
import { SectionHeader, StatsCard, FilterBar, Avatar, StatusBadge, ConfirmDialog, Modal } from '@/components/ui';
import { toJalaliDateTime, persianNum } from '@/lib/utils/format';
import { reviewsApi } from '@/lib/api';
import toast from 'react-hot-toast';

type ReviewStatusT = 'PENDING' | 'APPROVED' | 'REJECTED';

const MOCK_REVIEWS = Array(12).fill(0).map((_, i) => ({
  id: `r${i + 1}`,
  userId: `u${i + 1}`,
  user: { id: `u${i + 1}`, name: ['علی احمدی', 'سارا محمدی', 'رضا کریمی'][i % 3], mobile: '', roles: [], isActive: true, isVip: false, level: 1, tier: 'BRONZE' as const, xp: 0, coins: 0, diamonds: 0, createdAt: '' },
  gameId: `g${i + 1}`,
  game: { id: `g${i + 1}`, title: ['اتاق فرار تاریک', 'لیزرتگ پرو', 'VR ماجرا'][i % 3], slug: '', categoryId: '', branchId: '', fearLevel: 3, difficulty: 'HARD' as const, minPlayers: 2, maxPlayers: 6, duration: 60, pricePerPerson: '', tags: [], images: [], isActive: true, isFeatured: false, createdAt: '', updatedAt: '' },
  rating: (i % 5) + 1,
  comment: 'بازی فوق‌العاده بود! تجربه‌ای که هرگز فراموش نمی‌کنم. محیط ترسناک و هیجان‌انگیز بود.',
  status: (['PENDING', 'APPROVED', 'REJECTED'][i % 3]) as ReviewStatusT,
  createdAt: new Date(Date.now() - i * 86400000).toISOString(),
}));

export default function ReviewsPage() {
  const [reviews, setReviews] = useState(MOCK_REVIEWS);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedReview, setSelectedReview] = useState<typeof MOCK_REVIEWS[0] | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    try {
      await reviewsApi.approve(id);
      setReviews(prev => prev.map(r => r.id === id ? { ...r, status: 'APPROVED' as const } : r));
      toast.success('نظر تأیید شد');
    } catch { toast.error('خطا'); }
  };

  const handleReject = async (id: string) => {
    try {
      await reviewsApi.reject(id);
      setReviews(prev => prev.map(r => r.id === id ? { ...r, status: 'REJECTED' as const } : r));
      toast.success('نظر رد شد');
    } catch { toast.error('خطا'); }
  };

  const filtered = reviews.filter(r =>
    (!statusFilter || r.status === statusFilter) &&
    (!search || r.user.name.includes(search) || r.game?.title?.includes(search))
  );

  const stats = [
    { label: 'در انتظار بررسی', value: persianNum(reviews.filter(r => r.status === 'PENDING').length), color: 'yellow' as const },
    { label: 'تأیید شده', value: persianNum(reviews.filter(r => r.status === 'APPROVED').length), color: 'green' as const },
    { label: 'رد شده', value: persianNum(reviews.filter(r => r.status === 'REJECTED').length), color: 'red' as const },
  ];

  return (
    <div className="fade-in">
      <SectionHeader
        title="مدیریت نظرات"
        subtitle="تأیید یا رد نظرات کاربران"
        breadcrumb={[{ label: 'داشبورد' }, { label: 'نظرات' }]}
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        {stats.map((s, i) => <StatsCard key={i} {...s} icon={<Star className="w-5 h-5" />} />)}
      </div>

      <FilterBar onReset={() => { setStatusFilter(''); setSearch(''); }}>
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" placeholder="جستجو..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pr-10" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="select-field w-40">
          <option value="">همه وضعیت‌ها</option>
          <option value="PENDING">در انتظار</option>
          <option value="APPROVED">تأیید شده</option>
          <option value="REJECTED">رد شده</option>
        </select>
      </FilterBar>

      <div className="admin-card">
        <div className="space-y-4">
          {filtered.map(review => (
            <div key={review.id} className="p-4 bg-slate-700/30 rounded-xl border border-slate-700/30 hover:border-slate-600/50 transition-all">
              <div className="flex items-start gap-4">
                <Avatar name={review.user.name} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="text-white font-bold">{review.user.name}</span>
                    <span className="text-slate-500 text-sm">→</span>
                    <span className="text-slate-300 text-sm">{review.game?.title}</span>
                    <div className="flex items-center gap-0.5 mr-auto">
                      {Array(5).fill(0).map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`} />
                      ))}
                    </div>
                    <StatusBadge status={review.status} />
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed truncate">{review.comment}</p>
                  <p className="text-slate-600 text-xs mt-2">{toJalaliDateTime(review.createdAt)}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => setSelectedReview(review)} className="p-1.5 hover:bg-slate-600 rounded-lg text-slate-400 hover:text-white">
                    <Eye className="w-4 h-4" />
                  </button>
                  {review.status === 'PENDING' && (
                    <>
                      <button onClick={() => handleApprove(review.id)} className="p-1.5 hover:bg-green-900/30 rounded-lg text-slate-400 hover:text-green-400">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleReject(review.id)} className="p-1.5 hover:bg-red-900/30 rounded-lg text-slate-400 hover:text-red-400">
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button onClick={() => setDeleteId(review.id)} className="p-1.5 hover:bg-red-900/20 rounded-lg text-slate-400 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-slate-500 py-8">نظری یافت نشد</p>
          )}
        </div>
      </div>

      {/* Review Detail Modal */}
      <Modal
        open={!!selectedReview}
        onClose={() => setSelectedReview(null)}
        title="جزئیات نظر"
        size="md"
        footer={
          selectedReview?.status === 'PENDING' ? (
            <>
              <button onClick={() => { handleReject(selectedReview!.id); setSelectedReview(null); }} className="btn-danger">رد کردن</button>
              <button onClick={() => { handleApprove(selectedReview!.id); setSelectedReview(null); }} className="btn-primary">تأیید کردن</button>
            </>
          ) : undefined
        }
      >
        {selectedReview && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-0.5">
                {Array(5).fill(0).map((_, i) => (
                  <Star key={i} className={`w-5 h-5 ${i < selectedReview.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`} />
                ))}
              </div>
              <StatusBadge status={selectedReview.status} />
            </div>
            <p className="text-slate-300 leading-relaxed">{selectedReview.comment}</p>
            <div className="text-slate-500 text-sm">
              <p>بازی: {selectedReview.game?.title}</p>
              <p>کاربر: {selectedReview.user.name}</p>
              <p>تاریخ: {toJalaliDateTime(selectedReview.createdAt)}</p>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { setReviews(p => p.filter(r => r.id !== deleteId)); toast.success('حذف شد'); setDeleteId(null); }}
        title="حذف نظر"
        description="آیا از حذف این نظر اطمینان دارید؟"
        confirmLabel="حذف"
        variant="danger"
      />
    </div>
  );
}
