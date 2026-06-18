'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Edit, Trash2, Copy } from 'lucide-react';
import { SectionHeader, StatsCard, FilterBar, Toggle, ConfirmDialog, Pagination } from '@/components/ui';
import { toJalali, persianNum, formatToman } from '@/lib/utils/format';
import toast from 'react-hot-toast';
import type { DiscountCode } from '@/lib/types';
import { Percent, Tag } from 'lucide-react';

const MOCK_CODES: DiscountCode[] = Array(12).fill(0).map((_, i) => ({
  id: `dc${i + 1}`,
  code: ['NOWRUZ1403', 'VIP20OFF', 'FIRST50', 'BIRTHDAY30', 'INVITE10', 'SUMMER25', 'WEEKEND15', 'TEAM20', 'HORROR40', 'NEW2024', 'FRIDAY30', 'SPECIAL'][i],
  type: i % 2 === 0 ? 'PERCENT' : 'FIXED',
  value: i % 2 === 0 ? [20, 50, 30, 40, 15, 25][i % 6] : [50000, 100000, 30000, 80000, 20000, 60000][i % 6],
  minPurchase: i % 2 === 0 ? undefined : '500000',
  validUntil: new Date(Date.now() + (i + 1) * 86400000 * 10).toISOString(),
  usedCount: (i + 1) * 7,
  maxUses: (i + 1) * 50,
  targetSegment: ['ALL', 'VIP', 'NEW', 'RETURNING'][i % 4] as 'ALL',
  isActive: i % 6 !== 5,
  createdAt: new Date(Date.now() - i * 86400000 * 3).toISOString(),
}));

const SEGMENT_LABELS: Record<string, string> = {
  ALL: 'همه', VIP: 'VIP', NEW: 'جدید', RETURNING: 'بازگشتی', SPECIFIC: 'خاص',
};

export default function DiscountCodesPage() {
  const [codes, setCodes] = useState(MOCK_CODES);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const stats = [
    { label: 'کد فعال', value: persianNum(codes.filter(c => c.isActive).length), color: 'green' as const, icon: <Tag className="w-5 h-5" /> },
    { label: 'کل استفاده', value: persianNum(codes.reduce((s, c) => s + c.usedCount, 0)), color: 'blue' as const, icon: <Percent className="w-5 h-5" /> },
    { label: 'تخفیف داده‌شده', value: formatToman('12500000'), color: 'red' as const, icon: <Percent className="w-5 h-5" /> },
  ];

  const filtered = codes.filter(c =>
    !search || c.code.toLowerCase().includes(search.toLowerCase())
  );

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`کد ${code} کپی شد`);
  };

  return (
    <div className="fade-in">
      <SectionHeader
        title="کدهای تخفیف"
        breadcrumb={[{ label: 'تخفیف‌ها' }, { label: 'کدها' }]}
        actions={
          <Link href="/discounts/codes/new" className="btn-primary">
            <Plus className="w-4 h-4" /> کد جدید
          </Link>
        }
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        {stats.map((s, i) => <StatsCard key={i} {...s} />)}
      </div>

      <FilterBar onReset={() => setSearch('')}>
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" placeholder="جستجو کد..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pr-10" />
        </div>
      </FilterBar>

      <div className="admin-card">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>کد</th>
                <th>نوع</th>
                <th>مقدار</th>
                <th>حداقل خرید</th>
                <th>اعتبار تا</th>
                <th>استفاده</th>
                <th>مخاطب</th>
                <th>فعال</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(code => (
                <tr key={code.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-mono font-bold">{code.code}</span>
                      <button onClick={() => copyCode(code.code)} className="text-slate-500 hover:text-slate-300">
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                  <td>
                    <span className="badge bg-slate-700 text-slate-300 text-xs">
                      {code.type === 'PERCENT' ? 'درصدی' : 'ثابت'}
                    </span>
                  </td>
                  <td className="text-white font-bold">
                    {code.type === 'PERCENT' ? `${persianNum(code.value)}٪` : formatToman(code.value)}
                  </td>
                  <td className="text-slate-400">
                    {code.minPurchase ? formatToman(code.minPurchase) : '—'}
                  </td>
                  <td className="text-slate-400 text-sm">{toJalali(code.validUntil)}</td>
                  <td>
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-700 rounded-full h-1.5 w-24">
                          <div
                            className="bg-red-500 h-1.5 rounded-full"
                            style={{ width: code.maxUses ? `${Math.min((code.usedCount / code.maxUses) * 100, 100)}%` : '0%' }}
                          />
                        </div>
                        <span className="text-slate-400 text-xs">{persianNum(code.usedCount)}/{code.maxUses ? persianNum(code.maxUses) : '∞'}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge bg-blue-500/20 text-blue-400 text-xs">
                      {SEGMENT_LABELS[code.targetSegment]}
                    </span>
                  </td>
                  <td>
                    <Toggle
                      checked={code.isActive}
                      onChange={() => setCodes(prev => prev.map(c => c.id === code.id ? { ...c, isActive: !c.isActive } : c))}
                    />
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <Link href={`/discounts/codes/${code.id}/edit`} className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white">
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button onClick={() => setDeleteId(code.id)} className="p-1.5 hover:bg-red-900/20 rounded-lg text-slate-400 hover:text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={page} totalPages={3} onPageChange={setPage} total={filtered.length} />
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { setCodes(p => p.filter(c => c.id !== deleteId)); toast.success('کد حذف شد'); setDeleteId(null); }}
        title="حذف کد تخفیف"
        description="آیا از حذف این کد اطمینان دارید؟"
        confirmLabel="حذف"
        variant="danger"
      />
    </div>
  );
}
