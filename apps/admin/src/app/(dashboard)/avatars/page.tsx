'use client';
import { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { SectionHeader, FilterBar, EmptyState } from '@/components/ui';
import { persianNum } from '@/lib/utils/format';
import { avatarsApi } from '@/lib/api';
import toast from 'react-hot-toast';

const AVATAR_TYPES = ['HAT', 'GLASSES', 'SKIN', 'EFFECT', 'BACKGROUND', 'ACCESSORY'];
const AVATAR_TYPE_LABELS: Record<string, string> = {
  HAT: 'کلاه', GLASSES: 'عینک', SKIN: 'پوست', EFFECT: 'افکت', BACKGROUND: 'پس‌زمینه', ACCESSORY: 'اکسسوری',
};

interface AvatarItem {
  id: string;
  code: string;
  name: string;
  type: string;
  icon?: string;
  imageUrl?: string | null;
  requiredLevel: number;
  priceDiamonds?: number | null;
  isDefault: boolean;
  isActive: boolean;
}

function unwrap<T = unknown>(res: { data?: unknown } | null | undefined): T | null {
  const d = (res as { data?: unknown } | null | undefined)?.data;
  if (d && typeof d === 'object' && 'data' in (d as Record<string, unknown>)) {
    return (d as { data: T }).data;
  }
  return (d as T) ?? null;
}

export default function AvatarsPage() {
  const [avatars, setAvatars] = useState<AvatarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await avatarsApi.getAll();
      const data = unwrap<AvatarItem[]>(res);
      setAvatars(Array.isArray(data) ? data : []);
    } catch {
      toast.error('خطا در بارگذاری کاتالوگ آواتار');
      setAvatars([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = typeFilter ? avatars.filter((a) => a.type === typeFilter) : avatars;

  return (
    <div className="fade-in">
      <SectionHeader
        title="کاتالوگ آواتارها"
        subtitle="آیتم‌های پوشیدنی و تزئینی پروفایل (فقط مشاهده)"
        breadcrumb={[{ label: 'گیمیفیکیشن' }, { label: 'آواتارها' }]}
      />

      <FilterBar onReset={() => setTypeFilter('')}>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setTypeFilter('')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${!typeFilter ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}
          >
            همه
          </button>
          {AVATAR_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${typeFilter === type ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}
            >
              {AVATAR_TYPE_LABELS[type] ?? type}
            </button>
          ))}
        </div>
      </FilterBar>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <RefreshCw className="w-8 h-8 text-red-400 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title="آیتمی یافت نشد" description="کاتالوگ آواتار خالی است یا برای این نوع آیتمی وجود ندارد." />
      ) : (
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
                  <th>وضعیت</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((avatar) => (
                  <tr key={avatar.id}>
                    <td>
                      {avatar.imageUrl ? (
                        <img src={avatar.imageUrl} alt={avatar.name} className="w-10 h-10 rounded-xl object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center text-lg">{avatar.icon ?? '🎭'}</div>
                      )}
                    </td>
                    <td>
                      <div>
                        <p className="text-white font-medium">{avatar.name}</p>
                        <p className="text-slate-500 text-xs font-mono">{avatar.code}</p>
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-purple-500/20 text-purple-400">
                        {AVATAR_TYPE_LABELS[avatar.type] ?? avatar.type}
                      </span>
                    </td>
                    <td className="text-slate-300">لول {persianNum(avatar.requiredLevel)}</td>
                    <td>
                      {avatar.priceDiamonds ? (
                        <span className="text-blue-400 font-medium">💎 {persianNum(avatar.priceDiamonds)}</span>
                      ) : (
                        <span className="text-slate-500">رایگان</span>
                      )}
                    </td>
                    <td>
                      {avatar.isDefault ? (
                        <span className="badge bg-green-500/20 text-green-400 text-xs">پیش‌فرض</span>
                      ) : (
                        <span className="text-slate-500 text-xs">—</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge text-xs ${avatar.isActive ? 'bg-green-500/20 text-green-400' : 'bg-slate-600/40 text-slate-400'}`}>
                        {avatar.isActive ? 'فعال' : 'غیرفعال'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
