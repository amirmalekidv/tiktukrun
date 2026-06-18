'use client';
import { useState } from 'react';
import { AlertTriangle, EyeOff, Trash2 } from 'lucide-react';
import { SectionHeader, Avatar } from '@/components/ui';
import { toJalaliDateTime, persianNum } from '@/lib/utils/format';
import toast from 'react-hot-toast';

const MOCK_REPORTED = Array(8).fill(0).map((_, i) => ({
  id: `r${i + 1}`,
  user: { name: ['علی احمدی', 'سارا محمدی', 'رضا کریمی'][i % 3] },
  content: 'این پیام توسط چند کاربر گزارش شده است - محتوای نامناسب',
  reportsCount: (i + 1) * 2,
  createdAt: new Date(Date.now() - i * 3600000).toISOString(),
}));

export default function ReportedChatsPage() {
  const [messages, setMessages] = useState(MOCK_REPORTED);

  const handleBulkHide = () => {
    setMessages([]);
    toast.success('همه پیام‌های گزارش‌شده مخفی شدند');
  };

  return (
    <div className="fade-in">
      <SectionHeader
        title="پیام‌های گزارش‌شده"
        subtitle="پیام‌هایی که توسط کاربران گزارش شده‌اند"
        breadcrumb={[{ label: 'چت', href: '/chats' }, { label: 'گزارش‌شده‌ها' }]}
        actions={
          <div className="flex gap-2">
            <button onClick={handleBulkHide} className="btn-secondary">
              <EyeOff className="w-4 h-4" /> مخفی کردن همه
            </button>
            <button onClick={() => { setMessages([]); toast.success('همه حذف شدند'); }} className="btn-danger">
              <Trash2 className="w-4 h-4" /> حذف همه
            </button>
          </div>
        }
      />

      <div className="admin-card">
        <div className="space-y-3">
          {messages.map(msg => (
            <div key={msg.id} className="flex items-start gap-4 p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
              <Avatar name={msg.user.name} />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-white font-medium">{msg.user.name}</span>
                  <span className="badge bg-red-500/20 text-red-400">
                    <AlertTriangle className="w-3 h-3" />
                    {persianNum(msg.reportsCount)} گزارش
                  </span>
                  <span className="text-slate-600 text-xs mr-auto">{toJalaliDateTime(msg.createdAt)}</span>
                </div>
                <p className="text-slate-400 text-sm">{msg.content}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setMessages(p => p.filter(m => m.id !== msg.id)); toast.success('مخفی شد'); }} className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-yellow-400">
                  <EyeOff className="w-4 h-4" />
                </button>
                <button onClick={() => { setMessages(p => p.filter(m => m.id !== msg.id)); toast.success('حذف شد'); }} className="p-1.5 hover:bg-red-900/20 rounded-lg text-slate-400 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {messages.length === 0 && (
            <p className="text-center text-slate-500 py-8">پیام گزارش‌شده‌ای وجود ندارد 🎉</p>
          )}
        </div>
      </div>
    </div>
  );
}
