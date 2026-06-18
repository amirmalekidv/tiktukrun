'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { MessageSquare, Shield, EyeOff, Trash2, AlertTriangle, VolumeX, Search, RefreshCw } from 'lucide-react';
import { SectionHeader, StatsCard, FilterBar, Avatar, ConfirmDialog, EmptyState, Pagination } from '@/components/ui';
import { toJalaliDateTime, persianNum } from '@/lib/utils/format';
import { chatsApi } from '@/lib/api';
import toast from 'react-hot-toast';

type ChatMsgStatus = 'NORMAL' | 'REPORTED' | 'HIDDEN' | 'DELETED';

// مدل واقعی بک‌اند: ChatMessage { id, roomId, userId, text, status, reportsCount, createdAt, user:{id,fullName,mobile} }
interface AdminChatMessage {
  id: string;
  roomId: string;
  userId: string;
  text: string;
  status: ChatMsgStatus;
  reportsCount: number;
  createdAt: string;
  user: { id: string; fullName: string | null; mobile?: string } | null;
}

interface ChatStats {
  messagesToday: number;
  reportsToday: number;
  mutedUsers: number;
  bannedUsers: number;
  peakHour?: number;
}

// این کنترلر مستقیماً { success, data, meta } برمی‌گرداند
function readList<T = any>(res: any): { data: T[]; total: number } {
  const body = res?.data;
  const data = body?.data ?? [];
  const total = body?.meta?.total ?? data.length;
  return { data, total };
}
function readStats(res: any): ChatStats | null {
  return res?.data?.data ?? res?.data ?? null;
}

export default function ChatsPage() {
  const [messages, setMessages] = useState<AdminChatMessage[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ChatStats | null>(null);

  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(30);

  const [muteDialog, setMuteDialog] = useState<{ userId: string; name: string } | null>(null);
  const [muteHours, setMuteHours] = useState(24);
  const [isLive, setIsLive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadStats = useCallback(async () => {
    try {
      const res = await chatsApi.getStats();
      setStats(readStats(res));
    } catch { /* بی‌صدا */ }
  }, []);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit };
      if (statusFilter) params.status = statusFilter;
      const res = await chatsApi.getMessages(params);
      const { data, total: t } = readList<AdminChatMessage>(res);
      setMessages(data);
      setTotal(t);
    } catch {
      toast.error('خطا در بارگذاری پیام‌ها');
      setMessages([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFilter]);

  useEffect(() => { loadMessages(); }, [loadMessages]);
  useEffect(() => { loadStats(); }, [loadStats]);

  // حالت زنده: هر ۱۰ ثانیه لیست را تازه‌سازی می‌کند (polling واقعی، نه شبیه‌سازی)
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => { loadMessages(); loadStats(); }, 10000);
    return () => clearInterval(interval);
  }, [isLive, loadMessages, loadStats]);

  const handleHide = async (id: string) => {
    try {
      await chatsApi.hide(id);
      setMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'HIDDEN' } : m));
      toast.success('پیام مخفی شد');
    } catch { toast.error('خطا در مخفی‌کردن پیام'); }
  };

  const handleDelete = async (id: string) => {
    try {
      await chatsApi.delete(id);
      setMessages(prev => prev.filter(m => m.id !== id));
      setTotal(t => Math.max(0, t - 1));
      toast.success('پیام حذف شد');
    } catch { toast.error('خطا در حذف پیام'); }
  };

  const handleMute = async () => {
    if (!muteDialog) return;
    try {
      await chatsApi.mute(muteDialog.userId, muteHours, 'تخلف در چت');
      toast.success(`کاربر ${muteDialog.name} برای ${persianNum(muteHours)} ساعت بی‌صدا شد`);
      setMuteDialog(null);
    } catch { toast.error('خطا در بی‌صدا کردن کاربر'); }
  };

  // جستجوی کلاینتی روی صفحه‌ی جاری
  const filtered = messages.filter(m =>
    !search || m.text?.includes(search) || m.user?.fullName?.includes(search)
  );

  const statCards = [
    { label: 'پیام‌های امروز', value: persianNum(stats?.messagesToday ?? 0), color: 'blue' as const, icon: <MessageSquare className="w-5 h-5" /> },
    { label: 'گزارش‌های امروز', value: persianNum(stats?.reportsToday ?? 0), color: 'red' as const, icon: <AlertTriangle className="w-5 h-5" /> },
    { label: 'کاربران بی‌صدا', value: persianNum(stats?.mutedUsers ?? 0), color: 'yellow' as const, icon: <VolumeX className="w-5 h-5" /> },
    { label: 'کاربران مسدود', value: persianNum(stats?.bannedUsers ?? 0), color: 'red' as const, icon: <Shield className="w-5 h-5" /> },
  ];

  return (
    <div className="fade-in">
      <SectionHeader
        title="مانیتور چت"
        subtitle="نظارت و مدیریت پیام‌های چت کاربران"
        breadcrumb={[{ label: 'داشبورد' }, { label: 'چت' }]}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => { loadMessages(); loadStats(); }} className="btn-secondary" title="بارگذاری مجدد">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setIsLive(!isLive)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border font-medium text-sm ${isLive ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-slate-700 text-slate-400 hover:text-white'}`}
            >
              <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`} />
              {isLive ? 'زنده (هر ۱۰ث)' : 'متوقف'}
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((s, i) => <StatsCard key={i} {...s} />)}
      </div>

      <FilterBar onReset={() => { setStatusFilter(''); setSearch(''); setPage(1); }}>
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" placeholder="جستجو..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pr-10" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="select-field w-40">
          <option value="">همه وضعیت‌ها</option>
          <option value="NORMAL">عادی</option>
          <option value="REPORTED">گزارش‌شده</option>
          <option value="HIDDEN">مخفی</option>
        </select>
      </FilterBar>

      <div className="admin-card">
        <div className="flex items-center justify-between mb-4">
          <p className="text-slate-400 text-sm">{persianNum(total)} پیام</p>
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3" />
            در حال بارگذاری...
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState title="پیامی یافت نشد" description="هیچ پیامی با این فیلتر وجود ندارد." />
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {filtered.map(msg => (
              <div
                key={msg.id}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                  msg.status === 'REPORTED'
                    ? 'border-red-500/30 bg-red-500/5'
                    : msg.status === 'HIDDEN' || msg.status === 'DELETED'
                    ? 'border-slate-700/50 bg-slate-700/20 opacity-60'
                    : 'border-slate-700/30 hover:border-slate-600/50'
                }`}
              >
                <Avatar name={msg.user?.fullName || 'کاربر'} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-white text-sm font-medium">{msg.user?.fullName || 'کاربر ناشناس'}</span>
                    {msg.user?.mobile && <span className="text-slate-500 text-xs font-mono">{msg.user.mobile}</span>}
                    {msg.reportsCount > 0 && (
                      <span className="badge bg-red-500/20 text-red-400">
                        {persianNum(msg.reportsCount)} گزارش
                      </span>
                    )}
                    <span className="text-slate-600 text-xs mr-auto">{toJalaliDateTime(msg.createdAt)}</span>
                  </div>
                  <p className={`text-sm leading-relaxed ${msg.status === 'HIDDEN' || msg.status === 'DELETED' ? 'line-through text-slate-500' : 'text-slate-300'}`}>
                    {msg.text}
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {msg.status !== 'HIDDEN' && msg.status !== 'DELETED' && (
                    <button
                      onClick={() => handleHide(msg.id)}
                      className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-yellow-400"
                      title="مخفی کردن"
                    >
                      <EyeOff className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setMuteDialog({ userId: msg.userId, name: msg.user?.fullName || 'کاربر' })}
                    className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-orange-400"
                    title="بی‌صدا کردن"
                  >
                    <VolumeX className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(msg.id)}
                    className="p-1.5 hover:bg-red-900/20 rounded-lg text-slate-400 hover:text-red-400"
                    title="حذف پیام"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        {!loading && total > limit && (
          <Pagination currentPage={page} totalPages={Math.ceil(total / limit)} onPageChange={setPage} total={total} />
        )}
      </div>

      {/* Mute Dialog */}
      {muteDialog && (
        <ConfirmDialog
          open={!!muteDialog}
          onClose={() => setMuteDialog(null)}
          onConfirm={handleMute}
          title={`بی‌صدا کردن ${muteDialog.name}`}
          description={
            <div className="space-y-3">
              <p>مدت زمان بی‌صدا کردن را انتخاب کنید:</p>
              <div className="flex gap-2">
                {[{ v: 24, l: '۲۴ ساعت' }, { v: 168, l: '۷ روز' }, { v: 720, l: '۳۰ روز' }].map(o => (
                  <button
                    key={o.v}
                    onClick={() => setMuteHours(o.v)}
                    className={`px-3 py-1.5 rounded-lg text-sm border ${muteHours === o.v ? 'border-red-500 text-red-400 bg-red-500/10' : 'border-slate-700 text-slate-400'}`}
                  >
                    {o.l}
                  </button>
                ))}
              </div>
            </div>
          }
          confirmLabel="بی‌صدا کن"
          variant="warning"
        />
      )}
    </div>
  );
}
