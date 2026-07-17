'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, MapPin, Trash2, Edit, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { SectionHeader, StatsCard, FilterBar, ConfirmDialog, EmptyState } from '@/components/ui';
import { persianNum } from '@/lib/utils/format';
import { branchesApi, citiesApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { can } from '@/lib/permissions';
import { isPlatformAdmin } from '@/lib/route-permissions';
import toast from 'react-hot-toast';

interface AdminBranch {
  id: string;
  name: string;
  address: string;
  phone?: string | null;
  isActive: boolean;
  cityId: string;
  city?: { id: string; name: string } | null;
  manager?: { id: string; fullName?: string | null; mobile?: string | null } | null;
  _count?: { games?: number; bookings?: number };
  games?: unknown[];
  bookings?: unknown[];
}

interface CityOption { id: string; name: string }

function unwrap<T = any>(res: any): T {
  const d = res?.data;
  if (d && typeof d === 'object' && 'data' in d) return d.data as T;
  return d as T;
}

export default function BranchesPage() {
  const user = useAuthStore((s) => s.user);
  const canWrite = can(user, 'branches.write');
  const canManageBranches = isPlatformAdmin(user);
  const [branches, setBranches] = useState<AdminBranch[]>([]);
  const [cities, setCities] = useState<CityOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, cRes] = await Promise.all([branchesApi.getAll(), citiesApi.getAll()]);
      const bPayload = unwrap<AdminBranch[] | { data: AdminBranch[] }>(bRes);
      const cPayload = unwrap<CityOption[] | { data: CityOption[] }>(cRes);
      setBranches(Array.isArray(bPayload) ? bPayload : (bPayload as any)?.data ?? []);
      setCities(Array.isArray(cPayload) ? cPayload : (cPayload as any)?.data ?? []);
    } catch {
      toast.error('خطا در بارگذاری شعب');
      setBranches([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (branch: AdminBranch) => {
    setBranches(prev => prev.map(b => b.id === branch.id ? { ...b, isActive: !b.isActive } : b));
    try {
      await branchesApi.update(branch.id, { isActive: !branch.isActive });
    } catch {
      toast.error('خطا در تغییر وضعیت');
      load();
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await branchesApi.delete(deleteId);
      setBranches(prev => prev.filter(b => b.id !== deleteId));
      toast.success('شعبه حذف شد');
    } catch {
      toast.error('خطا در حذف شعبه');
    } finally {
      setDeleteId(null);
    }
  };

  const filtered = branches.filter(b => {
    const q = search.trim();
    if (!q) return true;
    return (b.name?.includes(q) || b.address?.includes(q) || b.city?.name?.includes(q));
  });

  const activeCount = branches.filter(b => b.isActive).length;
  const inactiveCount = branches.length - activeCount;

  return (
    <div className="fade-in">
      <SectionHeader
        title="مدیریت شعب"
        breadcrumb={[{ label: 'داشبورد' }, { label: 'شعب' }]}
        actions={
          <div className="flex gap-2">
            <button onClick={load} className="btn-secondary" title="بارگذاری مجدد">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            {canManageBranches && (
              <Link href="/branches/new" className="btn-primary">
                <Plus className="w-4 h-4" /> شعبه جدید
              </Link>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatsCard label="کل شعب" value={persianNum(branches.length)} color="red" icon={<MapPin className="w-5 h-5" />} />
        <StatsCard label="شعب فعال" value={persianNum(activeCount)} color="green" icon={<CheckCircle className="w-5 h-5" />} />
        <StatsCard label="شعب غیرفعال" value={persianNum(inactiveCount)} color="yellow" icon={<XCircle className="w-5 h-5" />} />
      </div>

      <FilterBar onReset={() => setSearch('')}>
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" placeholder="جستجو..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pr-10" />
        </div>
      </FilterBar>

      {loading ? (
        <div className="text-center py-16 text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" /> در حال بارگذاری...
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title="شعبه‌ای یافت نشد" description="اولین شعبه را اضافه کنید." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(branch => (
            <div key={branch.id} className="admin-card hover:border-slate-600 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-white font-bold text-lg">{branch.name}</h3>
                  <p className="text-slate-400 text-sm">{branch.city?.name ?? '—'}</p>
                </div>
                <button
                  onClick={() => canManageBranches && handleToggle(branch)}
                  disabled={!canManageBranches}
                  className={`badge ${branch.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'} ${!canManageBranches ? 'opacity-60 cursor-not-allowed' : ''}`}
                  title={canManageBranches ? 'تغییر وضعیت' : undefined}
                >
                  {branch.isActive ? 'فعال' : 'غیرفعال'}
                </button>
              </div>
              <div className="space-y-2 text-sm mb-4">
                <p className="text-slate-400 flex items-center gap-2">
                  <MapPin className="w-4 h-4 flex-shrink-0" />{branch.address}
                </p>
                {branch.phone && <p className="text-slate-400 font-mono">{branch.phone}</p>}
                {branch.manager && (
                  <p className="text-slate-500 text-xs">
                    مالک: {branch.manager.fullName || branch.manager.mobile || '—'}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-700/30 rounded-xl mb-4">
                <div className="text-center">
                  <p className="text-white font-bold text-xl">{persianNum(branch._count?.games ?? branch.games?.length ?? 0)}</p>
                  <p className="text-slate-500 text-xs">بازی</p>
                </div>
                <div className="text-center">
                  <p className="text-white font-bold text-xl">{persianNum(branch._count?.bookings ?? branch.bookings?.length ?? 0)}</p>
                  <p className="text-slate-500 text-xs">رزرو</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/branches/${branch.id}`} className="btn-secondary flex-1 justify-center text-sm">
                  <Edit className="w-3.5 h-3.5" /> {canWrite ? 'ویرایش' : 'مشاهده'}
                </Link>
                {canManageBranches && (
                  <button onClick={() => setDeleteId(branch.id)} className="btn-danger px-3">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="حذف شعبه"
        description="آیا از حذف این شعبه اطمینان دارید؟"
        confirmLabel="حذف"
        variant="danger"
      />
    </div>
  );
}
