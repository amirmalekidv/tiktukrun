'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ticketsApi } from '@/lib/api/tickets';

interface TicketReply {
  message: string;
  isAdmin: boolean;
  createdAt: string;
}

interface Ticket {
  id?: string;
  subject: string;
  category: string;
  status: 'open' | 'answered' | 'closed';
  message: string;
  replies: TicketReply[];
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  open: { label: 'باز', color: '#dc2626' },
  answered: { label: 'پاسخ داده شده', color: '#22d3ee' },
  closed: { label: 'بسته شده', color: '#6b7280' },
};

const DEMO_TICKET: Ticket = {
  subject: 'مشکل در پرداخت',
  category: 'مالی',
  status: 'open',
  message: 'سلام، موجودی کیف پولم بعد از پرداخت اضافه نشد. لطفاً بررسی کنید.',
  replies: [
    {
      message: 'با سلام، درخواست شما دریافت شد. در حال بررسی هستیم.',
      isAdmin: true,
      createdAt: '۱۴۰۳/۰۹/۲۰',
    },
  ],
};

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ticketsApi
      .getTicket(id)
      .then((d) => setTicket(d?.ticket ?? DEMO_TICKET))
      .catch(() => setTicket(DEMO_TICKET))
      .finally(() => setLoading(false));
  }, [id]);

  const handleReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      await ticketsApi.replyTicket(id, reply);
      toast.success('پاسخ ارسال شد');
      setReply('');
      // Refresh ticket
      ticketsApi
        .getTicket(id)
        .then((d) => setTicket(d?.ticket ?? ticket))
        .catch(() => {});
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطا در ارسال پاسخ';
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <i className="fas fa-spinner fa-spin text-4xl text-red-600" />
      </div>
    );
  }

  const t = ticket ?? DEMO_TICKET;
  const statusCfg = STATUS_LABELS[t.status] ?? { label: t.status, color: '#888' };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="text-gray-500 hover:text-red-400 transition-colors"
        >
          <i className="fas fa-arrow-right text-lg" />
        </button>
        <div className="flex-1">
          <h1 className="font-cinzel text-xl text-red-500">{t.subject}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className="text-xs font-vazir px-2 py-0.5 rounded-full"
              style={{ color: statusCfg.color, background: statusCfg.color + '20' }}
            >
              {statusCfg.label}
            </span>
            <span className="text-xs text-gray-600 font-vazir">{t.category}</span>
          </div>
        </div>
      </div>

      {/* Ticket card */}
      <div className="dark-card rounded-2xl p-5 border border-red-900/30 bg-[#0d0d0d] space-y-4">
        {/* Original message */}
        <div className="p-4 bg-red-950/20 rounded-xl border border-red-900/20 text-sm text-gray-300 font-vazir leading-relaxed">
          <p className="text-xs text-gray-600 mb-2">🙋 شما</p>
          {t.message}
        </div>

        {/* Reply thread */}
        {(t.replies ?? []).map((r, i) => (
          <div
            key={i}
            className={`p-4 rounded-xl text-sm font-vazir ${
              r.isAdmin
                ? 'bg-blue-950/20 border border-blue-900/20'
                : 'bg-gray-900/40 border border-gray-800/30'
            }`}
          >
            <p className="text-xs text-gray-500 mb-2">
              {r.isAdmin ? '👤 پشتیبانی' : '🙋 شما'} · {r.createdAt}
            </p>
            <p className="text-gray-300 leading-relaxed">{r.message}</p>
          </div>
        ))}

        {/* Reply input (only when not closed) */}
        {t.status !== 'closed' && (
          <div className="mt-4 space-y-3">
            <label className="text-xs text-gray-500 font-vazir block">پاسخ شما:</label>
            <div className="flex gap-3">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                className="flex-1 bg-gray-900/50 border border-red-900/30 rounded-xl px-4 py-3 text-gray-200 font-vazir text-sm resize-none h-24 focus:outline-none focus:border-red-600 transition-colors placeholder-gray-600"
                placeholder="پاسخ خود را بنویسید..."
              />
              <button
                onClick={handleReply}
                disabled={sending || !reply.trim()}
                className="px-4 bg-red-900/40 border border-red-700/40 text-red-400 rounded-xl hover:bg-red-800/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors self-end h-12"
              >
                {sending ? (
                  <i className="fas fa-spinner fa-spin" />
                ) : (
                  <i className="fas fa-paper-plane" />
                )}
              </button>
            </div>
          </div>
        )}

        {t.status === 'closed' && (
          <div className="text-center text-gray-600 font-vazir text-sm py-2">
            <i className="fas fa-lock ml-2" />
            این تیکت بسته شده است
          </div>
        )}
      </div>
    </motion.div>
  );
}
