'use client';
import { useState, useEffect, useCallback } from 'react';
import { Search, Calendar, RefreshCw, Building2 } from 'lucide-react';
import Link from 'next/link';
import { bookingsApi, branchesApi } from '@/lib/api';
import { SectionHeader, FilterBar } from '@/components/ui';
import BookingsTable from '@/components/bookings/BookingsTable';
import type { Booking } from '@/lib/types';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: '', label: 'همه وضعیت‌ها' },
  { value: 'PENDING', label: 'در انتظار' },
  { value: 'CONFIRMED', label: 'تأیید شده' },
  { value: 'COMPLETED', label: 'تکمیل شده' },
  { value: 'CANCELLED', label: 'لغو شده' },
  { value: 'REFUNDED', label: 'بازگشت وجه' },
];

const PAGE_SIZE = 20;

interface BranchOption {
  id: string;
  name: string;
  city?: { name?: string | null } | null;
}

// admin/bookings list is double-wrapped: { success, data: { data, total, page, limit } }
function unwrapPaginated(res: any): { items: any[]; total: number } {
  const body = res?.data;
  const inner = body && typeof body === 'object' && 'data' in body ? body.data : body;
  const items = Array.isArray(inner?.data) ? inner.data : Array.isArray(inner) ? inner : [];
  const total = Number(inner?.total ?? body?.total ?? items.length) || 0;
  return { items, total };
}

function unwrapList<T>(res: any): T[] {
  const body = res?.data;
  const inner = body && typeof body === 'object' && 'data' in body ? body.data : body;
  if (Array.isArray(inner?.data)) return inner.data as T[];
  return Array.isArray(inner) ? inner as T[] : [];
}

// Normalize the raw Prisma booking payload into the shape BookingsTable expects.
function normalize(b: any): Booking {
  return {
    id: b.id,
    code: b.code,
    userId: b.userId,
    user: b.user
      ? ({
          id: b.user.id,
          name: b.user.fullName,
          mobile: b.user.mobile,
        } as any)
      : undefined,
    gameId: b.gameId,
    game: b.game ? ({ id: b.game.id, title: b.game.title } as any) : undefined,
    branchId: b.branchId,
    branch: b.branch
      ? ({ id: b.branch.id ?? b.branchId, name: b.branch.name, city: b.branch.city } as any)
      : undefined,
    slotId: b.slotId ?? '',
    slotDate: b.slotDateTime ?? b.slotDate ?? b.createdAt,
    slotTime: b.slotDateTime
      ? new Date(b.slotDateTime).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
      : '',
    playersCount: b.playersCount ?? b.players ?? 0,
    teamName: b.teamName ?? undefined,
    amount: String(b.basePrice ?? b.amount ?? 0),
    discountAmount: String(b.discountApplied ?? b.discountAmount ?? 0),
    finalAmount: String(b.totalAmount ?? b.finalAmount ?? 0),
    paymentMethod: b.paymentMethod ?? 'WALLET',
    status: b.status,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt ?? b.createdAt,
  } as Booking;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [branchId, setBranchId] = useState('');
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [branchesLoading, setBranchesLoading] = useState(true);

  const loadBranches = useCallback(async () => {
    setBranchesLoading(true);
    try {
      const res = await branchesApi.getAll();
      setBranches(unwrapList<BranchOption>(res));
    } catch {
      setBranches([]);
    } finally {
      setBranchesLoading(false);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: PAGE_SIZE };
      if (search) params.q = search;
      if (status) params.status = status;
      if (branchId) params.branchId = branchId;
      const res = await bookingsApi.getAll(params);
      const { items, total } = unwrapPaginated(res);
      setBookings(items.map(normalize));
      setTotal(total);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'خطا در دریافت رزروها');
      setBookings([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, search, status, branchId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="fade-in">
      <SectionHeader
        title="مدیریت رزروها"
        subtitle="نمایش، فیلتر و مدیریت رزروها همراه با شعبه/ونیو مرتبط"
        breadcrumb={[{ label: 'داشبورد', href: '/dashboard' }, { label: 'رزروها' }]}
        actions={
          <>
            <button onClick={load} className="btn-secondary flex items-center gap-2" disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              بروزرسانی
            </button>
            <Link href="/bookings/calendar" className="btn-secondary">
              <Calendar className="w-4 h-4" />
              نمای تقویم
            </Link>
          </>
        }
      />

      {/* Filters */}
      <FilterBar
        onReset={() => {
          setSearch('');
          setStatus('');
          setBranchId('');
          setPage(1);
        }}
      >
        <div className="flex-1 relative min-w-48">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="جستجو (کد، نام، موبایل، شعبه)..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="input-field pr-10"
          />
        </div>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="select-field w-48"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <div className="relative min-w-56">
          <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <select
            value={branchId}
            onChange={(e) => {
              setBranchId(e.target.value);
              setPage(1);
            }}
            disabled={branchesLoading}
            className="select-field w-full pr-10"
          >
            <option value="">همه شعب مجاز</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}{branch.city?.name ? ` — ${branch.city.name}` : ''}
              </option>
            ))}
          </select>
        </div>
      </FilterBar>

      {/* Table */}
      <BookingsTable
        bookings={bookings}
        loading={loading}
        total={total}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onRefresh={load}
        selectedIds={selectedIds}
        onSelectIds={setSelectedIds}
      />
    </div>
  );
}
