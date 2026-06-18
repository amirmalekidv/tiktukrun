'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, Clock, CheckCircle, AlertCircle, Users, RefreshCw } from 'lucide-react';
import { SectionHeader, StatsCard, FilterBar, Avatar, StatusBadge, Pagination, EmptyState } from '@/components/ui';
import { toJalaliDateTime, persianNum } from '@/lib/utils/format';
import { ticketsApi } from '@/lib/api';
import toast from 'react-hot-toast';

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-slate-500/20 text-slate-400',
  MEDIUM: 'bg-yellow-500/20 text-yellow-400',
  HIGH: 'bg-orange-500/20 text-orange-400',
  URGENT: 'bg-red-500/20 text-red-400',
};
const PRIORITY_LABELS: Record<string, string> = { LOW: 'کم', MEDIUM: 'متوسط', HIGH: 'زیاد', URGENT: 'فوری' };

interface AdminTicket {
  id: string;
  code: string;
  subject: string;
  status: string;
  priority: string;
  lastReplyAt?: string | null;
  createdAt: string;
  user?: { id: string; fullName?: string | null; mobile?: string } | null;
  assignee?: { id: string; fullName?: string | null } | null;
  _count?: { messages: number };
}

interface TicketStats { open: number; inProgress: number; closedToday: number; avgResponseTime: number }

const PAGE_SIZE = 20;

// admin-tickets list returns { success, data, total, page, limit } directly
function readList(res: any): { items: AdminTicket[]; total: number } {
  const body = res?.data;
  return { items: body?.data ?? [], total: body?.total ?? 0 };
}
function readStats(res: any): TicketStats | null {
  return res?.data?.data ?? null;
}

export default function TicketsPage() {
  const [items, setItems] = useState<AdminTicket[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        ticketsApi.getAll({
          page, limit: PAGE_SIZE,
          ...(statusFilter ? { status: statusFilter } : {}),
          ...(priorityFilter ? { priority: priorityFilter } : {}),
        }),
        ticketsApi.getStats(),
      ]);
      const { items, total } = readList(listRes);
      setItems(items);
      setTotal(total);
      setStats(readStats(statsRes));
    } catch {
      toast.error('خطا در بارگذاری تیکت‌ها');
      setItems([]); setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, priorityFilter]);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter(t => {
    const q = search.trim();
    if (!q) return true;
    return t.subject?.includes(q) || t.user?.fullName?.includes(q) || t.code?.includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const statCards = [
    { label: 'باز', value: persianNum(stats?.open ?? 0), color: 'blue' as const, icon: <AlertCircle className="w-5 h-5" /> },
    { label: 'در بررسی', value: persianNum(stats?.inProgress ?? 0), color: 'yellow' as const, icon: <Clock className="w-5 h-5" /> },
    { label: 'بسته‌شده امروز', value: persianNum(stats?.closedToday ?? 0), color: 'green' as const, icon: <CheckCircle className="w-5 h-5" /> },
    { label: 'میانگین پاسخ', value: `${persianNum((stats?.avgResponseTime ?? 0).toFixed(1))} ساعت`, color: 'red' as const, icon: <Users className="w-5 h-5" /> },
  ];

  return (
    <div className="fade-in">
      <SectionHeader
        title="مدیریت تیکت‌ها"
        subtitle="مشاهده و پاسخ به تیکت‌های کاربران"
        breadcrumb={[{ label: 'داشبورد' }, { label: 'تیکت‌ها' }]}
        actions={
          <button onClick={load} className="btn-secondary" title="بارگذاری مجدد">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((s, i) => <StatsCard key={i} {...s} />)}
      </div>

      <FilterBar onReset={() => { setStatusFilter(''); setPriorityFilter(''); setSearch(''); setPage(1); }}>
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" placeholder="جستجو (کد، موضوع، کاربر)..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pr-10" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="select-field w-40">
          <option value="">همه وضعیت‌ها</option>
          <option value="OPEN">باز</option>
          <option value="IN_PROGRESS">در بررسی</option>
          <option value="WAITING_USER">منتظر کاربر</option>
          <option value="RESOLVED">حل شده</option>
          <option value="CLOSED">بسته</option>
        </select>
        <select value={priorityFilter} onChange={e => { setPriorityFilter(e.target.value); setPage(1); }} className="select-field w-36">
          <option value="">همه اولویت‌ها</option>
          <option value="URGENT">فوری</option>
          <option value="HIGH">زیاد</option>
          <option value="MEDIUM">متوسط</option>
          <option value="LOW">کم</option>
        </select>
      </FilterBar>

      <div className="admin-card">
        {loading ? (
          <div className="text-center py-12 text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" /> در حال بارگذاری...
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState title="تیکتی یافت نشد" description="با فیلترهای فعلی نتیجه‌ای وجود ندارد." />
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>کد</th>
                  <th>کاربر</th>
                  <th>موضوع</th>
                  <th>اولویت</th>
                  <th>وضعیت</th>
                  <th>مسئول</th>
                  <th>آخرین پاسخ</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(ticket => (
                  <tr key={ticket.id}>
                    <td>
                      <Link href={`/tickets/${ticket.id}`} className="text-red-400 hover:text-red-300 font-mono font-bold text-sm">
                        #{ticket.code}
                      </Link>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Avatar name={ticket.user?.fullName || 'کاربر'} size="sm" />
                        <div>
                          <p className="text-white text-sm">{ticket.user?.fullName || 'کاربر'}</p>
                          <p className="text-slate-500 text-xs font-mono">{ticket.user?.mobile ?? '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td><p className="text-slate-300 text-sm max-w-48 truncate">{ticket.subject}</p></td>
                    <td>
                      <span className={`badge ${PRIORITY_COLORS[ticket.priority] || ''}`}>
                        {PRIORITY_LABELS[ticket.priority] || ticket.priority}
                      </span>
                    </td>
                    <td><StatusBadge status={ticket.status} /></td>
                    <td>
                      {ticket.assignee ? (
                        <div className="flex items-center gap-2">
                          <Avatar name={ticket.assignee.fullName || '—'} size="sm" />
                          <span className="text-slate-300 text-sm">{ticket.assignee.fullName}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-sm">—</span>
                      )}
                    </td>
                    <td><span className="text-slate-400 text-xs">{ticket.lastReplyAt ? toJalaliDateTime(ticket.lastReplyAt) : '—'}</span></td>
                    <td>
                      <Link href={`/tickets/${ticket.id}`} className="btn-secondary text-sm py-1.5 px-3">مشاهده</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} total={total} />
        )}
      </div>
    </div>
  );
}
