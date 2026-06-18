'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Send, Clock, User, RefreshCw } from 'lucide-react';
import { SectionHeader, StatusBadge, Avatar, EmptyState } from '@/components/ui';
import { toJalaliDateTime } from '@/lib/utils/format';
import { ticketsApi, staffApi } from '@/lib/api';
import toast from 'react-hot-toast';

// admin-tickets findOneAdmin returns { success, data } directly
interface TicketSender {
  id: string;
  fullName?: string | null;
  avatarUrl?: string | null;
}
interface TicketMsg {
  id: string;
  ticketId: string;
  senderId: string;
  body: string;
  isStaffReply: boolean;
  attachments?: string[];
  createdAt: string;
  sender?: TicketSender | null;
}
interface TicketDetail {
  id: string;
  code: string;
  userId: string;
  subject: string;
  body?: string;
  status: string;
  priority: string;
  assigneeId?: string | null;
  createdAt: string;
  lastReplyAt?: string | null;
  closedAt?: string | null;
  user?: { id: string; fullName?: string | null; mobile?: string | null } | null;
  assignee?: { id: string; fullName?: string | null } | null;
  messages?: TicketMsg[];
}

interface StaffMember {
  id: string;
  fullName?: string | null;
  mobile?: string | null;
}

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'کم',
  MEDIUM: 'متوسط',
  HIGH: 'زیاد',
  URGENT: 'فوری',
};

// helper for endpoints returning { success, data } directly OR double-wrapped
function readData<T = unknown>(res: { data?: unknown } | null | undefined): T | null {
  const d = (res as { data?: unknown } | null | undefined)?.data;
  if (d && typeof d === 'object' && 'data' in (d as Record<string, unknown>)) {
    return (d as { data: T }).data;
  }
  return (d as T) ?? null;
}

export default function TicketDetailPage() {
  const params = useParams();
  const ticketId = String(params?.id ?? '');

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState(false);

  const load = useCallback(async () => {
    if (!ticketId) return;
    setLoading(true);
    try {
      const res = await ticketsApi.getById(ticketId);
      const data = readData<TicketDetail>(res);
      setTicket(data);
    } catch {
      toast.error('خطا در بارگذاری تیکت');
      setTicket(null);
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  const loadStaff = useCallback(async () => {
    try {
      const res = await staffApi.getAll({ limit: 100 });
      const list = readData<StaffMember[] | { data: StaffMember[] }>(res);
      const arr = Array.isArray(list) ? list : ((list as { data?: StaffMember[] })?.data ?? []);
      setStaff(Array.isArray(arr) ? arr : []);
    } catch {
      // staff list is optional for assignment; ignore failure silently
      setStaff([]);
    }
  }, []);

  useEffect(() => {
    load();
    loadStaff();
  }, [load, loadStaff]);

  const handleReply = async () => {
    if (!replyText.trim() || !ticket) return;
    setSending(true);
    try {
      await ticketsApi.reply(ticket.id, replyText.trim());
      setReplyText('');
      toast.success('پاسخ ارسال شد');
      await load();
    } catch {
      toast.error('خطا در ارسال پاسخ');
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!ticket) return;
    const prev = ticket.status;
    setTicket({ ...ticket, status });
    try {
      await ticketsApi.changeStatus(ticket.id, status);
      toast.success('وضعیت به‌روزرسانی شد');
    } catch {
      toast.error('خطا در تغییر وضعیت');
      setTicket((t) => (t ? { ...t, status: prev } : t));
    }
  };

  const handleAssign = async (assigneeId: string) => {
    if (!ticket) return;
    setUpdating(true);
    try {
      await ticketsApi.update(ticket.id, { assigneeId: assigneeId || undefined });
      toast.success('مسئول رسیدگی به‌روزرسانی شد');
      await load();
    } catch {
      toast.error('خطا در تعیین مسئول');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <RefreshCw className="w-8 h-8 text-red-400 animate-spin" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="fade-in">
        <SectionHeader
          title="تیکت"
          breadcrumb={[{ label: 'تیکت‌ها', href: '/tickets' }, { label: 'یافت نشد' }]}
        />
        <EmptyState title="تیکت یافت نشد" description="این تیکت وجود ندارد یا حذف شده است." />
      </div>
    );
  }

  const messages = ticket.messages ?? [];

  return (
    <div className="fade-in">
      <SectionHeader
        title={`تیکت #${ticket.code}`}
        subtitle={ticket.subject}
        breadcrumb={[{ label: 'تیکت‌ها', href: '/tickets' }, { label: `#${ticket.code}` }]}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={ticket.status} />
            <select
              className="select-field text-sm py-1.5"
              value={ticket.status}
              onChange={(e) => handleStatusChange(e.target.value)}
            >
              <option value="OPEN">باز</option>
              <option value="IN_PROGRESS">در بررسی</option>
              <option value="WAITING_USER">منتظر کاربر</option>
              <option value="RESOLVED">حل شده</option>
              <option value="CLOSED">بسته</option>
            </select>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversation */}
        <div className="lg:col-span-2 space-y-4">
          {/* Original ticket body */}
          {ticket.body && (
            <div className="admin-card">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-white font-medium text-sm">{ticket.user?.fullName ?? 'کاربر'}</span>
                <span className="text-slate-500 text-xs mr-auto">{toJalaliDateTime(ticket.createdAt)}</span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{ticket.body}</p>
            </div>
          )}

          {/* Messages */}
          <div className="admin-card space-y-4">
            {messages.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-4">هنوز پیامی ثبت نشده است.</p>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="flex gap-3">
                  <Avatar name={msg.sender?.fullName ?? undefined} size="md" />
                  <div className="flex-1">
                    <div
                      className={`rounded-xl p-4 ${
                        msg.isStaffReply
                          ? 'bg-red-600/10 border border-red-500/20'
                          : 'bg-slate-700/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-white font-medium text-sm">
                          {msg.sender?.fullName ?? (msg.isStaffReply ? 'پشتیبانی' : 'کاربر')}
                        </span>
                        {msg.isStaffReply && (
                          <span className="badge bg-red-500/20 text-red-400 text-xs">پشتیبانی</span>
                        )}
                        <span className="text-slate-500 text-xs mr-auto">{toJalaliDateTime(msg.createdAt)}</span>
                      </div>
                      <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Reply Form */}
          <div className="admin-card">
            <h3 className="text-white font-bold mb-3">پاسخ</h3>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="پاسخ خود را بنویسید..."
              className="input-field resize-none h-32 mb-3"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleReply}
                disabled={!replyText.trim() || sending}
                className="btn-primary mr-auto"
              >
                <Send className="w-4 h-4" />
                {sending ? 'در حال ارسال...' : 'ارسال پاسخ'}
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Customer Info */}
          <div className="admin-card">
            <h3 className="section-title flex items-center gap-2">
              <User className="w-4 h-4 text-red-400" />
              اطلاعات کاربر
            </h3>
            <div className="flex items-center gap-3">
              <Avatar name={ticket.user?.fullName ?? undefined} size="lg" />
              <div>
                <p className="text-white font-bold">{ticket.user?.fullName ?? 'کاربر'}</p>
                <p className="text-slate-400 text-sm font-mono">{ticket.user?.mobile ?? '-'}</p>
              </div>
            </div>
          </div>

          {/* Assign */}
          <div className="admin-card">
            <h3 className="section-title flex items-center gap-2">
              <Clock className="w-4 h-4 text-red-400" />
              مسئول رسیدگی
            </h3>
            <select
              className="select-field"
              value={ticket.assigneeId ?? ''}
              disabled={updating}
              onChange={(e) => handleAssign(e.target.value)}
            >
              <option value="">انتخاب مسئول...</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName ?? s.mobile ?? s.id}
                </option>
              ))}
            </select>
            {ticket.assignee?.fullName && (
              <p className="text-slate-400 text-xs mt-2">مسئول فعلی: {ticket.assignee.fullName}</p>
            )}
          </div>

          {/* Info */}
          <div className="admin-card text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">ایجاد شده</span>
              <span className="text-slate-300">{toJalaliDateTime(ticket.createdAt)}</span>
            </div>
            {ticket.lastReplyAt && (
              <div className="flex justify-between">
                <span className="text-slate-400">آخرین پاسخ</span>
                <span className="text-slate-300">{toJalaliDateTime(ticket.lastReplyAt)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">اولویت</span>
              <span className="text-orange-400">{PRIORITY_LABELS[ticket.priority] ?? ticket.priority}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
