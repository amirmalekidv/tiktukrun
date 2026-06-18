'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Send, Paperclip, Clock, User, FileText, Tag } from 'lucide-react';
import { SectionHeader, StatusBadge, Avatar } from '@/components/ui';
import { toJalaliDateTime } from '@/lib/utils/format';
import { ticketsApi } from '@/lib/api';
import toast from 'react-hot-toast';

const CANNED_RESPONSES = [
  'متشکریم که با ما در تماس گذاشتید. در اسرع وقت بررسی می‌کنیم.',
  'مشکل شما به تیم فنی ارجاع داده شد.',
  'رزرو شما با موفقیت لغو و مبلغ بازگشت داده شد.',
  'برای اطلاعات بیشتر با پشتیبانی ۲۴/۷ تماس بگیرید.',
];

const MOCK_TICKET = {
  id: 't1',
  code: 'TKT-1001',
  userId: 'u1',
  user: { id: 'u1', name: 'علی احمدی', mobile: '09121234567', email: 'ali@example.com', roles: [], isActive: true, isVip: true, level: 5, tier: 'GOLD' as const, xp: 2500, coins: 350, diamonds: 12, createdAt: '2024-01-15' },
  subject: 'مشکل در پرداخت آنلاین',
  status: 'IN_PROGRESS' as const,
  priority: 'HIGH' as const,
  assignee: { id: 'a1', name: 'پشتیبان ۱', mobile: '', roles: [], isActive: true, isVip: false, level: 1, tier: 'SILVER' as const, xp: 0, coins: 0, diamonds: 0, createdAt: '' },
  tags: ['پرداخت', 'فنی'],
  messages: [
    { id: 'm1', ticketId: 't1', senderId: 'u1', sender: { id: 'u1', name: 'علی احمدی', mobile: '', roles: [], isActive: true, isVip: true, level: 5, tier: 'GOLD' as const, xp: 0, coins: 0, diamonds: 0, createdAt: '' }, content: 'سلام، امروز هنگام پرداخت رزرو با خطا مواجه شدم. مبلغ از حسابم کسر شده اما رزرو ثبت نشده است.', isInternal: false, createdAt: new Date(Date.now() - 7200000).toISOString() },
    { id: 'm2', ticketId: 't1', senderId: 'a1', sender: { id: 'a1', name: 'پشتیبان ۱', mobile: '', roles: [], isActive: true, isVip: false, level: 1, tier: 'SILVER' as const, xp: 0, coins: 0, diamonds: 0, createdAt: '' }, content: 'با سلام، پیگیری می‌کنیم. لطفاً شماره پیگیری تراکنش را ارسال نمایید.', isInternal: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: 'm3', ticketId: 't1', senderId: 'a1', sender: { id: 'a1', name: 'پشتیبان ۱', mobile: '', roles: [], isActive: true, isVip: false, level: 1, tier: 'SILVER' as const, xp: 0, coins: 0, diamonds: 0, createdAt: '' }, content: 'یادداشت داخلی: این کاربر VIP است - اولویت بالا برای رفع مشکل', isInternal: true, createdAt: new Date(Date.now() - 1800000).toISOString() },
  ],
  createdAt: new Date(Date.now() - 7200000).toISOString(),
  updatedAt: new Date().toISOString(),
};

export default function TicketDetailPage() {
  const params = useParams();
  const [ticket, setTicket] = useState(MOCK_TICKET);
  const [replyContent, setReplyContent] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [showCanned, setShowCanned] = useState(false);

  const handleReply = async () => {
    if (!replyContent.trim()) return;
    setSending(true);
    try {
      // Real: await ticketsApi.reply(ticket.id, replyContent, isInternal)
      const newMsg = {
        id: `m${Date.now()}`,
        ticketId: ticket.id,
        senderId: 'admin',
        sender: ticket.assignee,
        content: replyContent,
        isInternal,
        createdAt: new Date().toISOString(),
      };
      setTicket(prev => ({ ...prev, messages: [...prev.messages, newMsg] }));
      setReplyContent('');
      toast.success('پاسخ ارسال شد');
    } catch {
      toast.error('خطا');
    } finally {
      setSending(false);
    }
  };

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
              onChange={e => setTicket(p => ({ ...p, status: e.target.value as typeof ticket.status }))}
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
          {/* Messages */}
          <div className="admin-card space-y-4">
            {ticket.messages.map(msg => (
              <div key={msg.id} className={`flex gap-3 ${msg.isInternal ? 'opacity-75' : ''}`}>
                <Avatar name={msg.sender?.name} size="md" />
                <div className={`flex-1 ${msg.senderId === ticket.userId ? '' : 'items-end'}`}>
                  <div className={`rounded-xl p-4 ${
                    msg.isInternal
                      ? 'bg-yellow-500/10 border border-yellow-500/20'
                      : msg.senderId === ticket.userId
                      ? 'bg-slate-700/50'
                      : 'bg-red-600/10 border border-red-500/20'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-white font-medium text-sm">{msg.sender?.name}</span>
                      {msg.isInternal && <span className="badge bg-yellow-500/20 text-yellow-400 text-xs">یادداشت داخلی</span>}
                      <span className="text-slate-500 text-xs mr-auto">{toJalaliDateTime(msg.createdAt)}</span>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Reply Form */}
          <div className="admin-card">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-white font-bold">پاسخ</h3>
              <label className="flex items-center gap-2 mr-auto cursor-pointer">
                <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} className="accent-yellow-500" />
                <span className="text-slate-400 text-sm">یادداشت داخلی</span>
              </label>
            </div>

            {/* Canned Responses */}
            <div className="mb-3">
              <button
                onClick={() => setShowCanned(!showCanned)}
                className="btn-ghost text-sm py-1"
              >
                <FileText className="w-4 h-4" />
                پاسخ‌های آماده
              </button>
              {showCanned && (
                <div className="mt-2 space-y-1 p-3 bg-slate-700/30 rounded-xl">
                  {CANNED_RESPONSES.map((cr, i) => (
                    <button
                      key={i}
                      onClick={() => { setReplyContent(cr); setShowCanned(false); }}
                      className="w-full text-right text-sm text-slate-300 hover:text-white p-2 hover:bg-slate-700 rounded-lg"
                    >
                      {cr}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <textarea
              value={replyContent}
              onChange={e => setReplyContent(e.target.value)}
              placeholder={isInternal ? 'یادداشت داخلی (قابل مشاهده فقط برای ادمین)...' : 'پاسخ خود را بنویسید...'}
              className={`input-field resize-none h-32 mb-3 ${isInternal ? 'border-yellow-500/30 bg-yellow-500/5' : ''}`}
            />

            <div className="flex items-center gap-2">
              <button className="btn-ghost">
                <Paperclip className="w-4 h-4" />
                پیوست
              </button>
              <button
                onClick={handleReply}
                disabled={!replyContent.trim() || sending}
                className="btn-primary mr-auto"
              >
                <Send className="w-4 h-4" />
                ارسال پاسخ
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
            <div className="flex items-center gap-3 mb-3">
              <Avatar name={ticket.user.name} size="lg" />
              <div>
                <p className="text-white font-bold">{ticket.user.name}</p>
                <p className="text-slate-400 text-sm font-mono">{ticket.user.mobile}</p>
                {ticket.user.isVip && <span className="badge bg-yellow-500/20 text-yellow-400 text-xs mt-1">VIP</span>}
              </div>
            </div>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">لول</span>
                <span className="text-white">لول {ticket.user.level}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">تیر</span>
                <span className="text-white">{ticket.user.tier}</span>
              </div>
            </div>
          </div>

          {/* Assign */}
          <div className="admin-card">
            <h3 className="section-title flex items-center gap-2">
              <Clock className="w-4 h-4 text-red-400" />
              مسئول رسیدگی
            </h3>
            <select className="select-field" defaultValue="a1">
              <option value="">انتخاب مسئول...</option>
              <option value="a1">پشتیبان ۱</option>
              <option value="a2">پشتیبان ۲</option>
              <option value="a3">مدیر فنی</option>
            </select>
          </div>

          {/* Tags */}
          <div className="admin-card">
            <h3 className="section-title flex items-center gap-2">
              <Tag className="w-4 h-4 text-red-400" />
              برچسب‌ها
            </h3>
            <div className="flex flex-wrap gap-1">
              {ticket.tags.map(tag => (
                <span key={tag} className="badge bg-red-500/20 text-red-400">{tag}</span>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="admin-card text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">ایجاد شده</span>
              <span className="text-slate-300">{toJalaliDateTime(ticket.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">آخرین بروزرسانی</span>
              <span className="text-slate-300">{toJalaliDateTime(ticket.updatedAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">اولویت</span>
              <span className="text-orange-400">زیاد</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
