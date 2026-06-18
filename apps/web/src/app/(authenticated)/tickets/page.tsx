'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import useSWR from 'swr';
import { ticketsApi } from '@/lib/api/tickets';

const STATUS_COLORS: Record<string, string> = { open: '#dc2626', answered: '#22d3ee', closed: '#6b7280' };
const DEMO = [{ id: 't1', subject: 'مشکل در پرداخت', category: 'مالی', status: 'open', createdAt: '۱۴۰۳/۰۹/۱۵' }, { id: 't2', subject: 'سوال درباره گردونه', category: 'فنی', status: 'answered', createdAt: '۱۴۰۳/۰۹/۱۰' }];

export default function TicketsPage() {
  const { data, isLoading } = useSWR('tickets', () => ticketsApi.getTickets().catch(() => null));
  const tickets = data?.tickets ?? DEMO;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="font-cinzel text-2xl text-red-500">تیکت‌ها</h1><p className="text-gray-500 font-vazir text-sm mt-1">پشتیبانی و ارتباط با ما</p></div>
        <Link href="/tickets/new" className="px-4 py-2 bg-red-900/40 border border-red-700/50 text-red-400 rounded-xl font-vazir text-sm hover:bg-red-800/50"><i className="fas fa-plus ml-1" />تیکت جدید</Link>
      </div>
      <div className="space-y-3">
        {isLoading ? [...Array(3)].map((_,i) => <div key={i} className="h-16 bg-gray-900/30 rounded-xl animate-pulse" />) :
          tickets.map((t: any) => (
            <Link key={t.id} href={`/tickets/${t.id}`} className="flex items-center gap-4 p-4 bg-gray-900/30 border border-gray-800/30 rounded-xl hover:border-red-900/30 transition-all block">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: STATUS_COLORS[t.status] ?? '#888' }} />
              <div className="flex-1 min-w-0"><p className="text-sm font-vazir text-gray-200 truncate">{t.subject}</p><p className="text-xs text-gray-600 font-vazir">{t.category} · {t.createdAt}</p></div>
              <i className="fas fa-chevron-left text-gray-600" />
            </Link>
          ))
        }
      </div>
    </motion.div>
  );
}
