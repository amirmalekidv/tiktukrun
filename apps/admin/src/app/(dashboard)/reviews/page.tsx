'use client';
import { useState, useEffect, useCallback } from 'react';
import { Star, Check, X, Trash2, Eye, Search, RefreshCw, ThumbsUp } from 'lucide-react';
import { SectionHeader, StatsCard, FilterBar, Avatar, ConfirmDialog, Modal, Pagination, EmptyState } from '@/components/ui';
import { toJalaliDateTime, persianNum } from '@/lib/utils/format';
import { reviewsApi } from '@/lib/api';
import toast from 'react-hot-toast';

// مدل واقعی بک‌اند: Review { id, rating, text, isApproved, helpfulCount, createdAt, user:{id,fullName,mobile}, game:{id,title} }
interface AdminReview {
  id: string;
  rating: number;
  text: string | null;
  isApproved: boolean;
  helpfulCount: number;
  createdAt: string;
  user: { id: string; fullName: string | null; mobile?: string } | null;
  game: { id: string; title: string } | null;
}

type ApprovalFilter = 'pending' | 'approved' | 'all';

// خواندن داده از پاسخ بک‌اند (ResponseInterceptor → { success, data: {...} })
function unwrap<T = any>(res: any): T {
  const d = res?.data;
  if (d && typeof d === 'object' && 'data' in d) return d.data as T;
  return d as T;
}

export default function ReviewsPage() {
  const [filter, setFilter] = useState<ApprovalFilter>('pending');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<AdminReview | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit };
      if (filter === 'pending') params.isApproved = 'false';
      if (filter === 'approved') params.isApproved = 'true';
      const res = await reviewsApi.getAll(params);
      const payload = unwrap<{ data: AdminReview[]; total: number }>(res);
      setReviews(payload?.data ?? []);
      setTotal(payload?.total ?? 0);
    } catch {
      toast.error('خطا در بارگذاری نظرات');
      setReviews([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filter, page, limit]);

  useEffect(() => { loadReviews(); }, [loadReviews]);

  const handleApprove = async (id: string) => {
    try {
      await reviewsApi.approve(id);
      toast.success('نظر تأیید شد');
      setReviews(prev => prev.map(r => r.id === id ? { ...r, isApproved: true } : r));
    } catch { toast.error('خطا در تأیید نظر'); }
  };

  // در بک‌اند، «رد کردن» نظر را حذف می‌کند و به کاربر اطلاع می‌دهد
  const handleReject = async (id: string) => {
    try {
      await reviewsApi.reject(id);
      toast.success('نظر رد شد و به کاربر اطلاع داده شد');
      setReviews(prev => prev.filter(r => r.id !== id));
      setTotal(t => Math.max(0, t - 1));
    } catch { toast.error('خطا در رد نظر'); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await reviewsApi.delete(deleteId);
      toast.success('نظر حذف شد');
      setReviews(prev => prev.filter(r => r.id !== deleteId));
      setTotal(t => Math.max(0, t - 1));
    } catch { toast.error('خطا در حذف نظر'); }
    finally { setDeleteId(null); }
  };

  // جستجوی کلاینتی روی صفحه‌ی جاری
  const filtered = reviews.filter(r =>
    !search ||
    r.user?.fullName?.includes(search) ||
    r.game?.title?.includes(search) ||
    r.text?.includes(search)
  );

  const pendingCount = reviews.filter(r => !r.isApproved).length;
  const approvedCount = reviews.filter(r => r.isApproved).length;

  const stats = [
    { label: 'کل نظرات', value: persianNum(total), color: 'blue' as const },
    { label: 'در انتظار (این صفحه)', value: persianNum(pendingCount), color: 'yellow' as const },
    { label: 'تأیید شده (این صفحه)', value: persianNum(approvedCount), color: 'green' as const },
  ];

  return (
    <div className="fade-in">
      <SectionHeader
        title="مدیریت نظرات"
        subtitle="تأیید، رد یا حذف نظرات کاربران درباره بازی‌ها"
        breadcrumb={[{ label: 'داشبورد' }, { label: 'نظرات' }]}
        actions={
          <button onClick={loadReviews} className="btn-secondary" title="بارگذاری مجدد">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {stats.map((s, i) => <StatsCard key={i} {...s} icon={<Star className="w-5 h-5" />} />)}
      </div>

      <FilterBar onReset={() => { setFilter('pending'); setSearch(''); setPage(1); }}>
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" placeholder="جستجو..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pr-10" />
        </div>
        <select value={filter} onChange={e => { setFilter(e.target.value as ApprovalFilter); setPage(1); }} className="select-field w-44">
          <option value="pending">در انتظار تأیید</option>
          <option value="approved">تأیید شده</option>
          <option value="all">همه نظرات</option>
        </select>
      </FilterBar>

      <div className="admin-card">
        {loading ? (
          <div className="text-center py-16 text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3" />
            در حال بارگذاری...
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState title="نظری یافت نشد" description="هیچ نظری با این فیلتر وجود ندارد." />
        ) : (
          <div className="space-y-4">
            {filtered.map(review => (
              <div key={review.id} className="p-4 bg-slate-700/30 rounded-xl border border-slate-700/30 hover:border-slate-600/50 transition-all">
                <div className="flex items-start gap-4">
                  <Avatar name={review.user?.fullName || 'کاربر'} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="text-white font-bold">{review.user?.fullName || 'کاربر ناشناس'}</span>
                      <span className="text-slate-500 text-sm">→</span>
                      <span className="text-slate-300 text-sm">{review.game?.title}</span>
                      <div className="flex items-center gap-0.5 mr-auto">
                        {Array(5).fill(0).map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`} />
                        ))}
                      </div>
                      {review.isApproved ? (
                        <span className="badge bg-green-500/15 text-green-400 border border-green-500/30 text-xs">تأیید شده</span>
                      ) : (
                        <span className="badge bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xs">در انتظار</span>
                      )}
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed truncate">{review.text || '—'}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <p className="text-slate-600 text-xs">{toJalaliDateTime(review.createdAt)}</p>
                      <span className="text-slate-500 text-xs flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" /> {persianNum(review.helpfulCount || 0)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => setSelectedReview(review)} className="p-1.5 hover:bg-slate-600 rounded-lg text-slate-400 hover:text-white">
                      <Eye className="w-4 h-4" />
                    </button>
                    {!review.isApproved && (
                      <>
                        <button onClick={() => handleApprove(review.id)} className="p-1.5 hover:bg-green-900/30 rounded-lg text-slate-400 hover:text-green-400" title="تأیید">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleReject(review.id)} className="p-1.5 hover:bg-red-900/30 rounded-lg text-slate-400 hover:text-red-400" title="رد و حذف">
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button onClick={() => setDeleteId(review.id)} className="p-1.5 hover:bg-red-900/20 rounded-lg text-slate-400 hover:text-red-400" title="حذف">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!loading && total > limit && (
        <div className="mt-6">
          <Pagination currentPage={page} totalPages={Math.ceil(total / limit)} onPageChange={setPage} />
        </div>
      )}

      {/* Review Detail Modal */}
      <Modal
        open={!!selectedReview}
        onClose={() => setSelectedReview(null)}
        title="جزئیات نظر"
        size="md"
        footer={
          selectedReview && !selectedReview.isApproved ? (
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
              {selectedReview.isApproved ? (
                <span className="badge bg-green-500/15 text-green-400 border border-green-500/30 text-xs">تأیید شده</span>
              ) : (
                <span className="badge bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xs">در انتظار</span>
              )}
            </div>
            <p className="text-slate-300 leading-relaxed">{selectedReview.text || '—'}</p>
            <div className="text-slate-500 text-sm space-y-1">
              <p>بازی: {selectedReview.game?.title}</p>
              <p>کاربر: {selectedReview.user?.fullName || 'ناشناس'}</p>
              <p>تعداد مفید بودن: {persianNum(selectedReview.helpfulCount || 0)}</p>
              <p>تاریخ: {toJalaliDateTime(selectedReview.createdAt)}</p>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="حذف نظر"
        description="آیا از حذف این نظر اطمینان دارید؟ این عملیات بازگشت‌ناپذیر است."
        confirmLabel="حذف"
        variant="danger"
      />
    </div>
  );
}
