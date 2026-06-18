'use client';
import { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { SectionHeader, FilterBar, Toggle, ConfirmDialog } from '@/components/ui';
import { persianNum } from '@/lib/utils/format';
import toast from 'react-hot-toast';

const AVATAR_TYPES = ['HAT', 'GLASSES', 'SKIN', 'EFFECT', 'BACKGROUND'];
const AVATAR_TYPE_LABELS: Record<string, string> = {
  HAT: 'کلاه', GLASSES: 'عینک', SKIN: 'پوست', EFFECT: 'افکت', BACKGROUND: 'پس‌زمینه',
};

const MOCK_AVATARS = Array(12).fill(0).map((_, i) => ({
  id: `av${i + 1}`,
  code: `AVATAR_${String(i + 1).padStart(3, '0')}`,
  name: ['کلاه کابوی', 'عینک آفتابی', 'پوست طلایی', 'افکت آتش', 'پس‌زمینه کهکشان', 'کلاه جادوگر', 'عینک VR', 'پوست نقره', 'افکت برق', 'پس‌زمینه تاریکی', 'کلاه سیاه', 'عینک کلاسیک'][i],
  type: AVATAR_TYPES[i % 5],
  thumbnail: `https://picsum.photos/80/80?random=${i + 1}`,
  requiredLevel: (i + 1) * 2,
  priceDiamonds: (i + 1) * 5,
  isDefault: i === 0,
  isActive: i % 7 !== 6,
}));

export default function AvatarsPage() {
  const [avatars, setAvatars] = useState(MOCK_AVATARS);
  const [typeFilter, setTypeFilter] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = typeFilter ? avatars.filter(a => a.type === typeFilter) : avatars;

  return (
    <div className="fade-in">
      <SectionHeader
        title="مدیریت آواتارها"
        subtitle="آیتم‌های پوشیدنی و تزئینی پروفایل"
        breadcrumb={[{ label: 'گیمیفیکیشن' }, { label: 'آواتارها' }]}
        actions={
          <button className="btn-primary">
            <Plus className="w-4 h-4" /> آیتم جدید
          </button>
        }
      />

      <FilterBar onReset={() => setTypeFilter('')}>
        <div className="flex gap-2">
          <button
            onClick={() => setTypeFilter('')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${!typeFilter ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}
          >
            همه
          </button>
          {AVATAR_TYPES.map(type => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${typeFilter === type ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}
            >
              {AVATAR_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </FilterBar>

      <div className="admin-card">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>تصویر</th>
                <th>نام</th>
                <th>نوع</th>
                <th>لول نیاز</th>
                <th>قیمت الماس</th>
                <th>پیش‌فرض</th>
                <th>فعال</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(avatar => (
                <tr key={avatar.id}>
                  <td>
                    <img src={avatar.thumbnail} alt={avatar.name} className="w-10 h-10 rounded-xl object-cover" />
                  </td>
                  <td>
                    <div>
                      <p className="text-white font-medium">{avatar.name}</p>
                      <p className="text-slate-500 text-xs font-mono">{avatar.code}</p>
                    </div>
                  </td>
                  <td>
                    <span className="badge bg-purple-500/20 text-purple-400">
                      {AVATAR_TYPE_LABELS[avatar.type]}
                    </span>
                  </td>
                  <td className="text-slate-300">لول {persianNum(avatar.requiredLevel)}</td>
                  <td>
                    <span className="text-blue-400 font-medium">💎 {persianNum(avatar.priceDiamonds)}</span>
                  </td>
                  <td>
                    <Toggle
                      checked={avatar.isDefault}
                      onChange={() => {}}
                      disabled={avatar.isDefault}
                    />
                  </td>
                  <td>
                    <Toggle
                      checked={avatar.isActive}
                      onChange={() => setAvatars(prev => prev.map(a => a.id === avatar.id ? { ...a, isActive: !a.isActive } : a))}
                    />
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteId(avatar.id)} className="p-1.5 hover:bg-red-900/20 rounded-lg text-slate-400 hover:text-red-400" disabled={avatar.isDefault}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { setAvatars(p => p.filter(a => a.id !== deleteId)); toast.success('حذف شد'); setDeleteId(null); }}
        title="حذف آیتم"
        description="آیا از حذف این آیتم آواتار اطمینان دارید؟"
        confirmLabel="حذف"
        variant="danger"
      />
    </div>
  );
}
