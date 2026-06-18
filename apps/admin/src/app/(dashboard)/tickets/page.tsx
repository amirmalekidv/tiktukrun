'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Search, Clock, CheckCircle, AlertCircle, Users } from 'lucide-react';
import { SectionHeader, StatsCard, FilterBar, Avatar, StatusBadge, Pagination } from '@/components/ui';
import { toJalaliDateTime, persianNum } from '@/lib/utils/format';
import type { Ticket } from '@/lib/types';

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-slate-500/20 text-slate-400',
  MEDIUM: 'bg-yellow-500/20 text-yellow-400',
  HIGH: 'bg-orange-500/20 text-orange-400',
  URGENT: 'bg-red-500/20 text-red-400',
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'کم', MEDIUM: 'متوسط', HIGH: 'زیاد', URGENT: 'فوری',
};

const MOCK_TICKETS: Ticket[] = Array(15).fill(0).map((_, i) => ({
  id: `t${i + 1}`,
  code: `TKT-${String(1000 + i).padStart(4, '0')}`,
  userId: `u${i + 1}`,
  user: {
    id: `u${i + 1}`,
    name: ['علی احمدی', 'سارا محمدی', 'رضا کریمی', 'نیلوفر', 'امیر'][i % 5],
    mobile: `0912${String(1000000 + i)}`,
    roles: [], isActive: true, isVip: false, level: 1, tier: 'BRONZE',
    xp: 0, coins: 0, diamonds: 0, createdAt: '',
  },
  subject: [
    'مشکل در پرداخت آنلاین',
    'درخواست لغو رزرو',
    'سوال درباره قوانین بازی',
    'گزارش مشکل فنی',
    'پیشنهاد بهبود سیستم',
  ][i % 5],
  status: ['OPEN', 'IN_PROGRESS', 'WAITING_USER', 'RESOLVED', 'CLOSED'][i % 5] as 'OPEN',
  priority: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'][i % 4] as 'LOW',
  assigneeId: i % 3 === 0 ? 'admin1' : undefined,
  assignee: i % 3 === 0 ? { id: 'admin1', name: 'پشتیبان ۱', mobile: '', roles: [], isActive: true, isVip: false, level: 1, tier: 'GOLD', xp: 0, coins: 0, diamonds: 0, createdAt: '' } : undefined,
  tags: ['پرداخت', 'فنی'][i % 2 === 0 ? 0 : 1] ? [['پرداخت', 'فنی'][i % 2]] : [],
  createdAt: new Date(Date.now() - i * 7200000).toISOString(),
  updatedAt: new Date(Date.now() - i * 3600000).toISOString(),
  lastReplyAt: new Date(Date.now() - i * 1800000).toISOString(),
}));

export default function TicketsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = MOCK_TICKETS.filter(t =>
    (!statusFilter || t.status === statusFilter) &&
    (!priorityFilter || t.priority === priorityFilter) &&
    (!search || t.subject.includes(search) || t.user?.name?.includes(search) || t.code.includes(search))
  );

  const stats = [
    { label: 'باز', value: persianNum(MOCK_TICKETS.filter(t => t.status === 'OPEN').length), color: 'blue' as const, icon: <AlertCircle className="w-5 h-5" /> },
    { label: 'در بررسی', value: persianNum(MOCK_TICKETS.filter(t => t.status === 'IN_PROGRESS').length), color: 'yellow' as const, icon: <Clock className="w-5 h-5" /> },
    { label: 'حل شده امروز', value: persianNum(5), color: 'green' as const, icon: <CheckCircle className="w-5 h-5" /> },
    { label: 'میانگین پاسخ', value: '۴ ساعت', color: 'red' as const, icon: <Users className="w-5 h-5" /> },
  ];

  return (
    <div className="fade-in">
      <SectionHeader
        title="مدیریت تیکت‌ها"
        subtitle="مشاهده و پاسخ به تیکت‌های کاربران"
        breadcrumb={[{ label: 'داشبورد' }, { label: 'تیکت‌ها' }]}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => <StatsCard key={i} {...s} />)}
      </div>

      <FilterBar onReset={() => { setStatusFilter(''); setPriorityFilter(''); setSearch(''); }}>
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" placeholder="جستجو (کد، موضوع، کاربر)..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pr-10" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="select-field w-40">
          <option value="">همه وضعیت‌ها</option>
          <option value="OPEN">باز</option>
          <option value="IN_PROGRESS">در بررسی</option>
          <option value="WAITING_USER">منتظر کاربر</option>
          <option value="RESOLVED">حل شده</option>
          <option value="CLOSED">بسته</option>
        </select>
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="select-field w-36">
          <option value="">همه اولویت‌ها</option>
          <option value="URGENT">فوری</option>
          <option value="HIGH">زیاد</option>
          <option value="MEDIUM">متوسط</option>
          <option value="LOW">کم</option>
        </select>
      </FilterBar>

      <div className="admin-card">
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
                      <Avatar name={ticket.user?.name} size="sm" />
                      <div>
                        <p className="text-white text-sm">{ticket.user?.name}</p>
                        <p className="text-slate-500 text-xs font-mono">{ticket.user?.mobile}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <p className="text-slate-300 text-sm max-w-48 truncate">{ticket.subject}</p>
                    {ticket.tags.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {ticket.tags.map(tag => (
                          <span key={tag} className="badge bg-slate-700 text-slate-400 text-xs py-0 px-1.5">{tag}</span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${PRIORITY_COLORS[ticket.priority]}`}>
                      {PRIORITY_LABELS[ticket.priority]}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td>
                    {ticket.assignee ? (
                      <div className="flex items-center gap-2">
                        <Avatar name={ticket.assignee.name} size="sm" />
                        <span className="text-slate-300 text-sm">{ticket.assignee.name}</span>
                      </div>
                    ) : (
                      <span className="text-slate-500 text-sm">—</span>
                    )}
                  </td>
                  <td>
                    <span className="text-slate-400 text-xs">{toJalaliDateTime(ticket.lastReplyAt)}</span>
                  </td>
                  <td>
                    <Link href={`/tickets/${ticket.id}`} className="btn-secondary text-sm py-1.5 px-3">
                      مشاهده
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={page} totalPages={3} onPageChange={setPage} total={filtered.length} />
      </div>
    </div>
  );
}
