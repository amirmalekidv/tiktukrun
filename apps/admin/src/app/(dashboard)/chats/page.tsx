'use client';
import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Shield, EyeOff, Trash2, AlertTriangle, VolumeX, Search, RefreshCw } from 'lucide-react';
import { SectionHeader, StatsCard, FilterBar, Avatar, StatusBadge, ConfirmDialog } from '@/components/ui';
import { toJalaliDateTime, persianNum } from '@/lib/utils/format';
import { chatsApi } from '@/lib/api';
import toast from 'react-hot-toast';

const MOCK_MESSAGES = Array(20).fill(0).map((_, i) => ({
  id: `msg${i + 1}`,
  userId: `u${i % 5 + 1}`,
  user: {
    id: `u${i % 5 + 1}`,
    name: ['علی احمدی', 'سارا محمدی', 'رضا کریمی', 'نیلوفر حسینی', 'امیر رضایی'][i % 5],
    nickname: ['GhostPlayer', 'DarkShadow', 'FearMaster', 'ShadowLord', 'NightRider'][i % 5],
    avatar: undefined,
    mobile: '',
    roles: [],
    isActive: true,
    isVip: i % 4 === 0,
    level: (i % 10) + 1,
    tier: 'SILVER' as const,
    xp: 0, coins: 0, diamonds: 0, createdAt: '',
  },
  roomType: ['GLOBAL', 'TEAM', 'PRIVATE'][i % 3] as 'GLOBAL',
  content: [
    'این بازی واقعاً ترسناک بود! پیشنهاد می‌دم',
    'کسی میاد تیم بزنه؟',
    'اتاق فرار تاریک رو امتحان کنید',
    'این پیام حاوی محتوای نامناسب است 🚫',
    'بهترین تجربه عمرم بود!',
  ][i % 5],
  status: ['NORMAL', 'REPORTED', 'HIDDEN', 'NORMAL', 'NORMAL'][i % 5] as 'NORMAL',
  reportsCount: [0, 3, 0, 1, 0][i % 5],
  createdAt: new Date(Date.now() - i * 180000).toISOString(),
}));

export default function ChatsPage() {
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [filter, setFilter] = useState({ roomType: '', status: '' });
  const [search, setSearch] = useState('');
  const [muteDialog, setMuteDialog] = useState<{ userId: string; name: string } | null>(null);
  const [muteDuration, setMuteDuration] = useState('24h');
  const [isLive, setIsLive] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Simulate live messages
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      const newMsg = {
        id: `msg-${Date.now()}`,
        userId: 'u1',
        user: { ...MOCK_MESSAGES[0].user },
        roomType: 'GLOBAL' as const,
        content: ['پیام جدید...', 'کاربر فعال شد', 'سوال در چت'][Math.floor(Math.random() * 3)],
        status: 'NORMAL' as const,
        reportsCount: 0,
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [newMsg, ...prev].slice(0, 50));
    }, 10000);
    return () => clearInterval(interval);
  }, [isLive]);

  const handleHide = async (id: string) => {
    try {
      await chatsApi.hide(id);
      setMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'HIDDEN' as const } : m));
      toast.success('پیام مخفی شد');
    } catch { toast.error('خطا'); }
  };

  const handleDelete = async (id: string) => {
    try {
      await chatsApi.delete(id);
      setMessages(prev => prev.filter(m => m.id !== id));
      toast.success('پیام حذف شد');
    } catch { toast.error('خطا'); }
  };

  const handleMute = async () => {
    if (!muteDialog) return;
    try {
      await chatsApi.mute(muteDialog.userId, muteDuration);
      toast.success(`کاربر ${muteDialog.name} برای ${muteDuration} بی‌صدا شد`);
      setMuteDialog(null);
    } catch { toast.error('خطا'); }
  };

  const filtered = messages.filter(m =>
    (!filter.roomType || m.roomType === filter.roomType) &&
    (!filter.status || m.status === filter.status) &&
    (!search || m.content.includes(search) || m.user.name.includes(search))
  );

  const stats = [
    { label: 'پیام‌های امروز', value: persianNum(347), color: 'blue' as const, icon: <MessageSquare className="w-5 h-5" /> },
    { label: 'گزارش‌های امروز', value: persianNum(12), color: 'red' as const, icon: <AlertTriangle className="w-5 h-5" /> },
    { label: 'کاربران Mute', value: persianNum(3), color: 'yellow' as const, icon: <VolumeX className="w-5 h-5" /> },
    { label: 'کاربران Ban', value: persianNum(1), color: 'red' as const, icon: <Shield className="w-5 h-5" /> },
  ];

  return (
    <div className="fade-in">
      <SectionHeader
        title="مانیتور چت زنده"
        subtitle="نظارت real-time بر پیام‌های چت کاربران"
        breadcrumb={[{ label: 'داشبورد' }, { label: 'چت' }]}
        actions={
          <button
            onClick={() => setIsLive(!isLive)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border font-medium text-sm ${isLive ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-slate-700 text-slate-400 hover:text-white'}`}
          >
            <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`} />
            {isLive ? 'زنده' : 'متوقف'}
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => <StatsCard key={i} {...s} />)}
      </div>

      <FilterBar onReset={() => { setFilter({ roomType: '', status: '' }); setSearch(''); }}>
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" placeholder="جستجو..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pr-10" />
        </div>
        <select value={filter.roomType} onChange={e => setFilter(p => ({ ...p, roomType: e.target.value }))} className="select-field w-36">
          <option value="">همه اتاق‌ها</option>
          <option value="GLOBAL">عمومی</option>
          <option value="TEAM">تیم</option>
          <option value="PRIVATE">خصوصی</option>
        </select>
        <select value={filter.status} onChange={e => setFilter(p => ({ ...p, status: e.target.value }))} className="select-field w-36">
          <option value="">همه وضعیت‌ها</option>
          <option value="NORMAL">عادی</option>
          <option value="REPORTED">گزارش‌شده</option>
          <option value="HIDDEN">مخفی</option>
        </select>
      </FilterBar>

      <div className="admin-card">
        <div className="flex items-center justify-between mb-4">
          <p className="text-slate-400 text-sm">{persianNum(filtered.length)} پیام</p>
          <button onClick={() => setMessages(MOCK_MESSAGES)} className="btn-ghost text-sm">
            <RefreshCw className="w-4 h-4" />
            بروزرسانی
          </button>
        </div>

        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {filtered.map(msg => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                msg.status === 'REPORTED'
                  ? 'border-red-500/30 bg-red-500/5'
                  : msg.status === 'HIDDEN'
                  ? 'border-slate-700/50 bg-slate-700/20 opacity-60'
                  : 'border-slate-700/30 hover:border-slate-600/50'
              }`}
            >
              <Avatar name={msg.user.name} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-white text-sm font-medium">{msg.user.name}</span>
                  {msg.user.nickname && <span className="text-slate-500 text-xs">@{msg.user.nickname}</span>}
                  <span className={`badge text-xs ${msg.roomType === 'GLOBAL' ? 'bg-blue-500/20 text-blue-400' : msg.roomType === 'TEAM' ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-500/20 text-slate-400'}`}>
                    {msg.roomType === 'GLOBAL' ? 'عمومی' : msg.roomType === 'TEAM' ? 'تیم' : 'خصوصی'}
                  </span>
                  {msg.reportsCount > 0 && (
                    <span className="badge bg-red-500/20 text-red-400">
                      {msg.reportsCount} گزارش
                    </span>
                  )}
                  <span className="text-slate-600 text-xs mr-auto">{toJalaliDateTime(msg.createdAt)}</span>
                </div>
                <p className={`text-sm leading-relaxed ${msg.status === 'HIDDEN' ? 'line-through text-slate-500' : 'text-slate-300'}`}>
                  {msg.content}
                </p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                {msg.status !== 'HIDDEN' && (
                  <button
                    onClick={() => handleHide(msg.id)}
                    className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-yellow-400"
                    title="مخفی کردن"
                  >
                    <EyeOff className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setMuteDialog({ userId: msg.userId, name: msg.user.name })}
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
                {[{ v: '24h', l: '۲۴ ساعت' }, { v: '7d', l: '۷ روز' }, { v: '30d', l: '۳۰ روز' }].map(o => (
                  <button
                    key={o.v}
                    onClick={() => setMuteDuration(o.v)}
                    className={`px-3 py-1.5 rounded-lg text-sm border ${muteDuration === o.v ? 'border-red-500 text-red-400 bg-red-500/10' : 'border-slate-700 text-slate-400'}`}
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
