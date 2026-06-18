'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, MapPin, Trash2, Edit, CheckCircle, XCircle } from 'lucide-react';
import { SectionHeader, StatsCard, FilterBar, ConfirmDialog } from '@/components/ui';
import { persianNum } from '@/lib/utils/format';
import toast from 'react-hot-toast';

const MOCK_BRANCHES = [
  { id: 'br1', name: 'شعبه تهران', city: { name: 'تهران' }, address: 'ولیعصر، پلاک ۱۲۳', phone: '۰۲۱-۱۲۳۴۵۶۷۸', isActive: true, gamesCount: 8, bookingsCount: 245 },
  { id: 'br2', name: 'شعبه مشهد', city: { name: 'مشهد' }, address: 'بلوار وکیل‌آباد', phone: '۰۵۱-۲۳۴۵۶۷۸۹', isActive: true, gamesCount: 5, bookingsCount: 132 },
  { id: 'br3', name: 'شعبه اصفهان', city: { name: 'اصفهان' }, address: 'خیابان چهارباغ', phone: '۰۳۱-۳۴۵۶۷۸۹۰', isActive: false, gamesCount: 3, bookingsCount: 78 },
];

export default function BranchesPage() {
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  return (
    <div className="fade-in">
      <SectionHeader
        title="مدیریت شعب"
        breadcrumb={[{ label: 'داشبورد' }, { label: 'شعب' }]}
        actions={
          <Link href="/branches/new" className="btn-primary">
            <Plus className="w-4 h-4" /> شعبه جدید
          </Link>
        }
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatsCard label="کل شعب" value={persianNum(3)} color="red" icon={<MapPin className="w-5 h-5" />} />
        <StatsCard label="شعب فعال" value={persianNum(2)} color="green" icon={<CheckCircle className="w-5 h-5" />} />
        <StatsCard label="شعب غیرفعال" value={persianNum(1)} color="yellow" icon={<XCircle className="w-5 h-5" />} />
      </div>

      <FilterBar onReset={() => setSearch('')}>
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" placeholder="جستجو..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pr-10" />
        </div>
      </FilterBar>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MOCK_BRANCHES.map(branch => (
          <div key={branch.id} className="admin-card hover:border-slate-600 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-white font-bold text-lg">{branch.name}</h3>
                <p className="text-slate-400 text-sm">{branch.city.name}</p>
              </div>
              <span className={`badge ${branch.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {branch.isActive ? 'فعال' : 'غیرفعال'}
              </span>
            </div>
            <div className="space-y-2 text-sm mb-4">
              <p className="text-slate-400 flex items-center gap-2">
                <MapPin className="w-4 h-4 flex-shrink-0" />{branch.address}
              </p>
              {branch.phone && <p className="text-slate-400 font-mono">{branch.phone}</p>}
            </div>
            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-700/30 rounded-xl mb-4">
              <div className="text-center">
                <p className="text-white font-bold text-xl">{persianNum(branch.gamesCount)}</p>
                <p className="text-slate-500 text-xs">بازی</p>
              </div>
              <div className="text-center">
                <p className="text-white font-bold text-xl">{persianNum(branch.bookingsCount)}</p>
                <p className="text-slate-500 text-xs">رزرو</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href={`/branches/${branch.id}`} className="btn-secondary flex-1 justify-center text-sm">
                <Edit className="w-3.5 h-3.5" /> ویرایش
              </Link>
              <button onClick={() => setDeleteId(branch.id)} className="btn-danger px-3">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { toast.success('شعبه حذف شد'); setDeleteId(null); }}
        title="حذف شعبه"
        description="آیا از حذف این شعبه اطمینان دارید؟"
        confirmLabel="حذف"
        variant="danger"
      />
    </div>
  );
}
