'use client';
import { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Check, X, Trash2, ThumbsUp, RefreshCw, Heart } from 'lucide-react';
import { SectionHeader, StatsCard, FilterBar, Avatar, ConfirmDialog, Pagination, EmptyState } from '@/components/ui';
import { toJalaliDateTime, persianNum } from '@/lib/utils/format';
import { gameCommentsApi } from '@/lib/api';
import toast from 'react-hot-toast';

type CommentFilter = 'pending' | 'all' | 'hidden';

interface ModComment {
  id: string;
  text: string;
  isApproved: boolean;
  isHidden: boolean;
  likesCount: number;
  parentId: string | null;
  createdAt: string;
  user: { id: string; fullName: string | null; avatarUrl: string | null } | null;
  game: { id: string; title: string; slug: string } | null;
}

interface CommentStats {
  totalLikes: number;
  totalComments: number;
  pendingComments: number;
  topLiked: { id: string; title: string; slug: string; likesCount: number; commentsCount: number }[];
}

// خواندن داده از پاسخ بک‌اند (ResponseInterceptor → { success, data: {...} })
function unwrap<T = any>(res: any): T {
  const d = res?.data;
  if (d && typeof d === 'object' && 'data' in d) return d.data as T;
  return d as T;
}

export default function CommentsModerationPage() {
  const [filter, setFilter] = useState<CommentFilter>('pending');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [comments, setComments] = useState<ModComment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CommentStats | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      const res = await gameCommentsApi.stats();
      setStats(unwrap<CommentStats>(res));
    } catch {
      /* بی‌صدا */
    }
  }, []);

  const loadComments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await gameCommentsApi.list(filter, page, limit);
      const payload = unwrap<{ data: ModComment[]; total: number }>(res);
      setComments(payload?.data ?? []);
      setTotal(payload?.total ?? 0);
    } catch {
      toast.error('خطا در بارگذاری کامنت‌ها');
      setComments([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filter, page, limit]);

  useEffect(() => { loadComments(); }, [loadComments]);
  useEffect(() => { loadStats(); }, [loadStats]);

  const handleApprove = async (id: string) => {
    try {
      await gameCommentsApi.approve(id);
      toast.success('کامنت تأیید شد');
      loadComments();
      loadStats();
    } catch { toast.error('خطا در تأیید'); }
  };

  const handleReject = async (id: string) => {
    try {
      await gameCommentsApi.reject(id);
      toast.success('کامنت رد/مخفی شد');
      loadComments();
      loadStats();
    } catch { toast.error('خطا در رد'); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await gameCommentsApi.remove(deleteId);
      toast.success('کامنت حذف شد');
      setDeleteId(null);
      loadComments();
      loadStats();
    } catch { toast.error('خطا در حذف'); }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const filterTabs: { key: CommentFilter; label: string }[] = [
    { key: 'pending', label: 'در انتظار تأیید' },
    { key: 'all', label: 'همه' },
    { key: 'hidden', label: 'مخفی‌شده' },
  ];

  return (
    <div className="fade-in">
      <SectionHeader
        title="مدیریت نظرات بازی‌ها"
        subtitle="تأیید، رد یا حذف نظرات کاربران + آمار لایک‌ها"
        breadcrumb={[{ label: 'داشبورد' }, { label: 'نظرات بازی‌ها' }]}
        actions={
          <button
            onClick={() => { loadComments(); loadStats(); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm"
          >
            <RefreshCw className="w-4 h-4" /> بروزرسانی
          </button>
        }
      />

      {/* آمار */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard label="کل لایک‌ها" value={persianNum(stats?.totalLikes ?? 0)} color="red" icon={<Heart className="w-5 h-5" />} />
        <StatsCard label="کامنت‌های تأییدشده" value={persianNum(stats?.totalComments ?? 0)} color="green" icon={<MessageSquare className="w-5 h-5" />} />
        <StatsCard label="در انتظار تأیید" value={persianNum(stats?.pendingComments ?? 0)} color="yellow" icon={<Check className="w-5 h-5" />} />
        <StatsCard label="پربازدیدترین بازی" value={stats?.topLiked?.[0]?.title ?? '—'} color="blue" icon={<ThumbsUp className="w-5 h-5" />} />
      </div>

      {/* فیلتر */}
      <FilterBar>
        <div className="flex gap-2">
          {filterTabs.map(t => (
            <button
              key={t.key}
              onClick={() => { setFilter(t.key); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-sm transition-all ${
                filter === t.key
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </FilterBar>

      {/* فهرست کامنت‌ها */}
      <div className="mt-4 space-y-3">
        {loading ? (
          <div className="text-center py-12 text-slate-400">در حال بارگذاری...</div>
        ) : comments.length === 0 ? (
          <EmptyState title="کامنتی یافت نشد" description="هیچ کامنتی با این فیلتر وجود ندارد." />
        ) : (
          comments.map(c => (
            <div
              key={c.id}
              className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${
                c.isHidden
                  ? 'border-slate-700/50 bg-slate-800/30 opacity-70'
                  : c.isApproved
                  ? 'border-green-500/20 bg-green-500/5'
                  : 'border-yellow-500/30 bg-yellow-500/5'
              }`}
            >
              <Avatar name={c.user?.fullName ?? 'کاربر'} src={c.user?.avatarUrl ?? undefined} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-white text-sm font-medium">{c.user?.fullName ?? 'کاربر ناشناس'}</span>
                  {c.game && (
                    <span className="badge bg-slate-700/40 text-slate-300 text-xs">
                      بازی: {c.game.title}
                    </span>
                  )}
                  {c.parentId && (
                    <span className="badge bg-purple-500/20 text-purple-300 text-xs">پاسخ</span>
                  )}
                  {c.isApproved ? (
                    <span className="badge bg-green-500/20 text-green-400 text-xs">تأییدشده</span>
                  ) : c.isHidden ? (
                    <span className="badge bg-slate-600/30 text-slate-400 text-xs">مخفی</span>
                  ) : (
                    <span className="badge bg-yellow-500/20 text-yellow-400 text-xs">در انتظار</span>
                  )}
                  <span className="flex items-center gap-1 text-slate-400 text-xs">
                    <ThumbsUp className="w-3 h-3" /> {persianNum(c.likesCount ?? 0)}
                  </span>
                  <span className="text-slate-600 text-xs mr-auto">{toJalaliDateTime(c.createdAt)}</span>
                </div>
                <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-wrap break-words">{c.text}</p>
              </div>
              <div className="flex flex-col gap-1 flex-shrink-0">
                {!c.isApproved && (
                  <button
                    onClick={() => handleApprove(c.id)}
                    className="p-1.5 hover:bg-green-500/20 rounded-lg text-slate-400 hover:text-green-400"
                    title="تأیید"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                {!c.isHidden && (
                  <button
                    onClick={() => handleReject(c.id)}
                    className="p-1.5 hover:bg-yellow-500/20 rounded-lg text-slate-400 hover:text-yellow-400"
                    title="رد/مخفی"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setDeleteId(c.id)}
                  className="p-1.5 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400"
                  title="حذف"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* صفحه‌بندی */}
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} total={total} />
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="حذف کامنت"
        message="آیا از حذف کامل این کامنت مطمئن هستید؟ این عمل قابل بازگشت نیست."
        confirmText="حذف"
        variant="danger"
      />
    </div>
  );
}
