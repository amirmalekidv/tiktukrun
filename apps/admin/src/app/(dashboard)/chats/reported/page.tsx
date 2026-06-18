'use client';
import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, EyeOff, Trash2, RefreshCw } from 'lucide-react';
import { SectionHeader, Avatar, EmptyState, ConfirmDialog } from '@/components/ui';
import { toJalaliDateTime, persianNum } from '@/lib/utils/format';
import { chatsApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface ReportedMsg {
  id: string;
  text: string;
  reportsCount: number;
  status: string;
  createdAt: string;
  user?: { id: string; fullName: string; mobile?: string };
}

// admin/chats/messages is single-wrapped: { success, data, meta:{total} }
function readList(res: any): { items: any[]; total: number } {
  const body = res?.data;
  const items = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : [];
  const total = Number(body?.meta?.total ?? body?.total ?? items.length) || 0;
  return { items, total };
}

export default function ReportedChatsPage() {
  const [messages, setMessages] = useState<ReportedMsg[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState<{ id: string; type: 'hide' | 'delete' } | null>(null);
  const [acting, setActing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // No dedicated "reported" endpoint: fetch visible (NORMAL) messages and keep those with reports.
      const res = await chatsApi.getMessages({ status: 'NORMAL', limit: 200 });
      const { items } = readList(res);
      const reported = (items as ReportedMsg[])
        .filter((m) => (m.reportsCount ?? 0) > 0)
        .sort((a, b) => (b.reportsCount ?? 0) - (a.reportsCount ?? 0));
      setMessages(reported);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'خطا در دریافت پیام‌های گزارش‌شده');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const doAction = async () => {
    if (!confirm) return;
    setActing(true);
    const { id, type } = confirm;
    try {
      if (type === 'hide') {
        await chatsApi.hide(id, 'گزارش‌شده توسط کاربران');
        toast.success('پیام مخفی شد');
      } else {
        await chatsApi.delete(id);
        toast.success('پیام حذف شد');
      }
      setMessages((prev) => prev.filter((m) => m.id !== id));
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'خطا در انجام عملیات');
    } finally {
      setActing(false);
      setConfirm(null);
    }
  };

  return (
    <div className="fade-in">
      <SectionHeader
        title="پیام‌های گزارش‌شده"
        subtitle="پیام‌هایی که توسط کاربران گزارش شده‌اند"
        breadcrumb={[{ label: 'چت', href: '/chats' }, { label: 'گزارش‌شده‌ها' }]}
        actions={
          <button onClick={load} className="btn-secondary flex items-center gap-2" disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            بروزرسانی
          </button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <RefreshCw className="w-8 h-8 text-red-400 animate-spin" />
        </div>
      ) : messages.length === 0 ? (
        <EmptyState title="پیام گزارش‌شده‌ای وجود ندارد" description="در حال حاضر هیچ پیام فعالی توسط کاربران گزارش نشده است." />
      ) : (
        <div className="admin-card">
          <div className="space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className="flex items-start gap-4 p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
                <Avatar name={msg.user?.fullName} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-white font-medium">{msg.user?.fullName || '—'}</span>
                    <span className="badge bg-red-500/20 text-red-400 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {persianNum(msg.reportsCount)} گزارش
                    </span>
                    <span className="text-slate-600 text-xs mr-auto">{toJalaliDateTime(msg.createdAt)}</span>
                  </div>
                  <p className="text-slate-400 text-sm">{msg.text}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setConfirm({ id: msg.id, type: 'hide' })}
                    className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-yellow-400"
                    title="مخفی کردن"
                  >
                    <EyeOff className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setConfirm({ id: msg.id, type: 'delete' })}
                    className="p-1.5 hover:bg-red-900/20 rounded-lg text-slate-400 hover:text-red-400"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={doAction}
        title={confirm?.type === 'delete' ? 'حذف پیام' : 'مخفی کردن پیام'}
        description={
          confirm?.type === 'delete'
            ? 'این پیام برای همیشه حذف می‌شود. ادامه می‌دهید؟'
            : 'این پیام از چت مخفی می‌شود. ادامه می‌دهید؟'
        }
        confirmLabel={confirm?.type === 'delete' ? 'حذف' : 'مخفی کن'}
        variant="danger"
        loading={acting}
      />
    </div>
  );
}
