'use client';
import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { Plus, Search, Calendar, Filter } from 'lucide-react';
import Link from 'next/link';
import { fetcher } from '@/lib/api';
import { SectionHeader, StatsCard, FilterBar, LoadingSpinner } from '@/components/ui';
import BookingsTable from '@/components/bookings/BookingsTable';
import { formatToman, persianNum, toJalali } from '@/lib/utils/format';
import { CalendarDays, CreditCard, Users, TrendingUp } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: '', label: 'همه وضعیت‌ها' },
  { value: 'PENDING', label: 'در انتظار' },
  { value: 'CONFIRMED', label: 'تأیید شده' },
  { value: 'COMPLETED', label: 'تکمیل شده' },
  { value: 'CANCELLED', label: 'لغو شده' },
  { value: 'REFUNDED', label: 'بازگشت وجه' },
];

// Mock data for display
const MOCK_BOOKINGS = Array(10).fill(0).map((_, i) => ({
  id: `bk-${i + 1}`,
  code: `BK-${String(100000 + i).padStart(6, '0')}`,
  userId: `u${i + 1}`,
  user: {
    id: `u${i + 1}`, name: ['علی احمدی', 'سارا محمدی', 'رضا کریمی', 'نیلوفر حسینی', 'امیر رضایی'][i % 5],
    mobile: `0912${String(1000000 + i)}`,
    roles: [], isActive: true, isVip: false, level: 1, tier: 'BRONZE' as const,
    xp: 0, coins: 0, diamonds: 0, createdAt: '2024-01-01',
  },
  gameId: `g${i + 1}`,
  game: { id: `g${i + 1}`, title: ['اتاق فرار تاریک', 'ترس مطلق', 'لیزرتگ پرو', 'VR ماجرا', 'پینت‌بال'][i % 5], slug: '', categoryId: '', branchId: '', fearLevel: 3, difficulty: 'HARD' as const, minPlayers: 2, maxPlayers: 6, duration: 60, pricePerPerson: '250000', tags: [], images: [], isActive: true, isFeatured: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  branchId: `br${i + 1}`,
  branch: { id: `br${i + 1}`, name: ['شعبه تهران', 'شعبه مشهد', 'شعبه اصفهان'][i % 3], cityId: 'c1', address: '', isActive: true, createdAt: '2024-01-01' },
  slotId: `s${i + 1}`,
  slotDate: new Date(Date.now() - i * 86400000).toISOString(),
  slotTime: ['۱۴:۰۰', '۱۶:۰۰', '۱۸:۰۰', '۲۰:۰۰'][i % 4],
  playersCount: (i % 4) + 2,
  amount: String((i + 1) * 250000),
  discountAmount: i % 3 === 0 ? '50000' : '0',
  finalAmount: String((i + 1) * 250000 - (i % 3 === 0 ? 50000 : 0)),
  paymentMethod: ['WALLET', 'ZARINPAL', 'CASH'][i % 3] as 'WALLET',
  status: ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'REFUNDED'][i % 5] as 'PENDING',
  createdAt: new Date(Date.now() - i * 86400000).toISOString(),
  updatedAt: new Date(Date.now() - i * 3600000).toISOString(),
}));

export default function BookingsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Real API: const { data, isLoading, mutate } = useSWR(`/admin/bookings?page=${page}&search=${search}&status=${status}`, fetcher);
  const bookings = MOCK_BOOKINGS;
  const isLoading = false;
  const mutate = () => {};

  const stats = [
    { label: 'رزروهای امروز', value: persianNum(24), subValue: formatToman(6000000), icon: <CalendarDays className="w-5 h-5" />, color: 'red' as const },
    { label: 'رزروهای این هفته', value: persianNum(142), subValue: formatToman(35500000), icon: <CreditCard className="w-5 h-5" />, color: 'blue' as const },
    { label: 'رزروهای این ماه', value: persianNum(528), subValue: formatToman(132000000), icon: <TrendingUp className="w-5 h-5" />, color: 'green' as const },
    { label: 'کل کاربران فعال', value: persianNum(1240), subValue: 'کاربر ثبت‌نام کرده', icon: <Users className="w-5 h-5" />, color: 'yellow' as const },
  ];

  return (
    <div className="fade-in">
      <SectionHeader
        title="مدیریت رزروها"
        subtitle="نمایش، فیلتر و مدیریت تمام رزروهای پلتفرم"
        breadcrumb={[{ label: 'داشبورد', href: '/dashboard' }, { label: 'رزروها' }]}
        actions={
          <>
            <Link href="/bookings/calendar" className="btn-secondary">
              <Calendar className="w-4 h-4" />
              نمای تقویم
            </Link>
            <Link href="/bookings/new" className="btn-primary">
              <Plus className="w-4 h-4" />
              رزرو دستی
            </Link>
          </>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => (
          <StatsCard key={i} {...s} />
        ))}
      </div>

      {/* Filters */}
      <FilterBar onReset={() => { setSearch(''); setStatus(''); }}>
        <div className="flex-1 relative min-w-48">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="جستجو (کد، نام، موبایل)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pr-10"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="select-field w-48"
        >
          {STATUS_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <button className="btn-secondary">
          <Filter className="w-4 h-4" />
          فیلترهای بیشتر
        </button>
      </FilterBar>

      {/* Table */}
      <BookingsTable
        bookings={bookings}
        loading={isLoading}
        total={528}
        page={page}
        totalPages={53}
        onPageChange={setPage}
        onRefresh={mutate}
        selectedIds={selectedIds}
        onSelectIds={setSelectedIds}
      />
    </div>
  );
}
