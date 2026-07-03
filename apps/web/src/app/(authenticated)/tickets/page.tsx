'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import useSWR from 'swr';
import { ticketsApi, type UserTicketListItem } from '@/lib/api/tickets';
import { USE_MOCK } from '@/lib/http';

const STATUS_COLORS: Record<string, string> = { open: '#dc2626', answered: '#22d3ee', closed: '#6b7280' };
const DEMO: UserTicketListItem[] = [
  {
    id: 't1',
    code: 'TKT-100001',
    subject: 'مشکل در پرداخت',
    status: 'open',
    statusLabel: 'باز',
    createdAt: '۱۴۰۳/۰۹/۱۵',
    updatedAt: new Date(0).toISOString(),
    lastReplyAt: null,
    messageCount: 0,
  },
  {
    id: 't2',
    code: 'TKT-100002',
    subject: 'سوال درباره گردونه',
    status: 'answered',
    statusLabel: 'پاسخ داده شده',
    createdAt: '۱۴۰۳/۰۹/۱۰',
    updatedAt: new Date(0).toISOString(),
    lastReplyAt: null,
    messageCount: 1,
  },
];

export default function TicketsPage() {
  const { data, isLoading } = useSWR('tickets', () => ticketsApi.getTickets().catch(() => null));
  const tickets = (data as UserTicketListItem[] | null) ?? (USE_MOCK ? DEMO : []);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="font-cinzel text-2xl text-red-500">تیکت‌ها</h1><p className="text-gray-500 font-vazir text-sm mt-1">پشتیبانی و ارتباط با ما</p></div>
        <Link href="/tickets/new" className="px-4 py-2 bg-red-900/40 border border-red-700/50 text-red-400 rounded-xl font-vazir text-sm hover:bg-red-800/50"><i className="fas fa-plus ml-1" />تیکت جدید</Link>
      </div>
      <div className="space-y-3">
        {isLoading ? [...Array(3)].map((_,i) => <div key={i} className="h-16 bg-gray-900/30 rounded-xl animate-pulse" />) :
          tickets.map((t) => (
            <Link key={t.id} href={`/tickets/${t.id}`} className="flex items-center gap-4 p-4 bg-gray-900/30 border border-gray-800/30 rounded-xl hover:border-red-900/30 transition-all block">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: STATUS_COLORS[t.status] ?? '#888' }} />
              <div className="flex-1 min-w-0"><p className="text-sm font-vazir text-gray-200 truncate">{t.subject}</p><p className="text-xs text-gray-600 font-vazir">{t.code} · {t.createdAt}</p></div>
              <span className="text-xs text-gray-500 font-vazir whitespace-nowrap">{t.statusLabel}</span>
              <i className="fas fa-chevron-left text-gray-600" />
            </Link>
          ))
        }
      </div>
    </motion.div>
  );
}
