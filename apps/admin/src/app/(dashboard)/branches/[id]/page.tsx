'use client';

import { useState, useEffect, useCallback } from 'react';
import { SectionHeader, StatusBadge } from '@/components/ui';
import BranchLocationPicker from '@/components/branches/BranchLocationPicker';
import { FiMapPin, FiEdit2, FiSave, FiArrowRight, FiPhone } from 'react-icons/fi';
import { RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { branchesApi, staffApi } from '@/lib/api';
import { persianNum } from '@/lib/utils/format';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';
import { isPlatformAdmin } from '@/lib/route-permissions';

interface BranchGame {
  id: string;
  title?: string;
  name?: string;
  category?: { name: string } | null;
  durationMin?: number;
  price?: number;
  isActive?: boolean;
}

interface Branch {
  id: string;
  name: string;
  address: string;
  phone?: string | null;
  lat?: number | null;
  lng?: number | null;
  isActive: boolean;
  cityId: string;
  city?: { id: string; name: string } | null;
  managerId?: string | null;
  manager?: { id: string; fullName?: string | null; mobile?: string | null } | null;
  games?: BranchGame[];
  createdAt?: string;
}

interface StaffOption {
  id: string;
  fullName?: string | null;
  mobile?: string | null;
}

interface BranchFormState {
  name: string;
  address: string;
  phone: string;
  lat: string;
  lng: string;
  managerId: string;
}

function unwrap<T = any>(res: any): T {
  const d = res?.data;
  if (d && typeof d === 'object' && 'data' in d) return d.data as T;
  return d as T;
}

function unwrapList<T = any>(res: any): T[] {
  const body = res?.data;
  const inner = body && typeof body === 'object' && 'data' in body ? body.data : body;
  if (Array.isArray(inner?.data)) return inner.data as T[];
  return Array.isArray(inner) ? inner as T[] : [];
}

function coordToString(value?: number | null) {
  return typeof value === 'number' && Number.isFinite(value) ? String(value) : '';
}

function readCoordinate(value: string, min: number, max: number, label: string) {
  const raw = value.trim();
  if (!raw) return null;
  const num = Number(raw);
  if (!Number.isFinite(num) || num < min || num > max) {
    throw new Error(`${label} معتبر نیست`);
  }
  return num;
}

function readCoordinateForMap(value: string, min: number, max: number) {
  const raw = value.trim();
  if (!raw) return null;
  const num = Number(raw);
  return Number.isFinite(num) && num >= min && num <= max ? num : null;
}

export default function BranchDetailPage({ params }: { params: { id: string } }) {
  const user = useAuthStore((s) => s.user);
  const canAssignManager = isPlatformAdmin(user);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<BranchFormState>({ name: '', address: '', phone: '', lat: '', lng: '', managerId: '' });
  const [managers, setManagers] = useState<StaffOption[]>([]);

  useEffect(() => {
    if (!canAssignManager) return;
    staffApi
      .getAll({ role: 'BRANCH_MANAGER', limit: 100 })
      .then((res) => setManagers(unwrapList<StaffOption>(res)))
      .catch(() => setManagers([]));
  }, [canAssignManager]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await branchesApi.getById(params.id);
      const b = unwrap<Branch>(res);
      setBranch(b);
      setForm({
        name: b?.name ?? '',
        address: b?.address ?? '',
        phone: b?.phone ?? '',
        lat: coordToString(b?.lat),
        lng: coordToString(b?.lng),
        managerId: b?.managerId ?? b?.manager?.id ?? '',
      });
    } catch {
      toast.error('خطا در بارگذاری شعبه');
      setBranch(null);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!branch) return;
    setSaving(true);
    try {
      const lat = readCoordinate(form.lat, -90, 90, 'عرض جغرافیایی');
      const lng = readCoordinate(form.lng, -180, 180, 'طول جغرافیایی');
      const payload: Record<string, unknown> = {
        name: form.name,
        address: form.address,
        phone: form.phone || undefined,
        lat,
        lng,
      };
      if (canAssignManager) {
        payload.managerId = form.managerId || null;
      }

      const res = await branchesApi.update(branch.id, payload as any);
      const updated = unwrap<Branch>(res);
      setBranch(prev => prev
        ? { ...prev, ...updated, games: updated?.games ?? prev.games, phone: form.phone || null }
        : updated);
      setEditing(false);
      toast.success('تغییرات ذخیره شد');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'خطا در ذخیره تغییرات');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-slate-500">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" /> در حال بارگذاری...
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="space-y-6">
        <Link href="/branches" className="inline-flex items-center gap-2 text-slate-400 hover:text-white">
          <FiArrowRight className="w-5 h-5" /> بازگشت به شعب
        </Link>
        <div className="admin-card text-center py-10 text-slate-400">شعبه یافت نشد.</div>
      </div>
    );
  }

  const games = branch.games ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/branches" className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
          <FiArrowRight className="w-5 h-5" />
        </Link>
        <SectionHeader
          title={branch.name}
          subtitle={`${branch.city?.name ?? '—'} · ${persianNum(games.length)} بازی`}
          icon={<FiMapPin />}
          action={
            editing ? (
              <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-2 px-4 py-2 disabled:opacity-50">
                <FiSave className="w-4 h-4" />
                {saving ? 'در حال ذخیره...' : 'ذخیره'}
              </button>
            ) : (
              <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors text-sm">
                <FiEdit2 className="w-4 h-4" />
                ویرایش
              </button>
            )
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branch Info */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-semibold mb-5">اطلاعات شعبه</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">نام شعبه</label>
              {editing ? (
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="input-field w-full" />
              ) : (
                <p className="text-white">{branch.name}</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">آدرس</label>
              {editing ? (
                <textarea value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} className="input-field w-full resize-none" rows={2} />
              ) : (
                <div className="flex items-start gap-2">
                  <FiMapPin className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                  <p className="text-white text-sm">{branch.address}</p>
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">تلفن</label>
              {editing ? (
                <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="input-field w-full" />
              ) : (
                <div className="flex items-center gap-2">
                  <FiPhone className="w-4 h-4 text-slate-500" />
                  <p className="text-white">{branch.phone || '—'}</p>
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">مالک / مدیر شعبه</label>
              {editing && canAssignManager ? (
                <select
                  value={form.managerId}
                  onChange={e => setForm(p => ({ ...p, managerId: e.target.value }))}
                  className="select-field w-full"
                >
                  <option value="">بدون مدیر</option>
                  {managers.map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.fullName || manager.mobile || manager.id}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-white text-sm">
                  {branch.manager?.fullName || branch.manager?.mobile || '—'}
                </p>
              )}
            </div>
            {editing ? (
              <BranchLocationPicker
                lat={readCoordinateForMap(form.lat, -90, 90)}
                lng={readCoordinateForMap(form.lng, -180, 180)}
                onChange={(coords) => {
                  setForm(p => ({
                    ...p,
                    lat: String(coords.lat),
                    lng: String(coords.lng),
                  }));
                }}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">عرض جغرافیایی</label>
                  <p className="text-white ltr-num">{branch.lat ?? '—'}</p>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">طول جغرافیایی</label>
                  <p className="text-white ltr-num">{branch.lng ?? '—'}</p>
                </div>
              </div>
            )}
            {!editing && branch.lat != null && branch.lng != null && (
              <a
                href={`https://www.openstreetmap.org/?mlat=${branch.lat}&mlon=${branch.lng}#map=17/${branch.lat}/${branch.lng}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm text-cyan-300 hover:text-cyan-200"
              >
                <FiMapPin className="w-4 h-4" />
                مشاهده موقعیت روی نقشه
              </a>
            )}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs text-slate-400 mb-1">وضعیت</label>
                <StatusBadge
                  status={branch.isActive ? 'success' : 'default'}
                  label={branch.isActive ? 'فعال' : 'غیرفعال'}
                />
              </div>
              <div className="text-left">
                <label className="block text-xs text-slate-400 mb-1">شهر</label>
                <p className="text-white text-sm">{branch.city?.name ?? '—'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-semibold mb-5">خلاصه</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-700/30 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-white">{persianNum(games.length)}</p>
              <p className="text-slate-400 text-sm mt-1">بازی فعال</p>
            </div>
            <div className="bg-slate-700/30 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-green-400">{persianNum(games.filter(g => g.isActive !== false).length)}</p>
              <p className="text-slate-400 text-sm mt-1">در دسترس</p>
            </div>
          </div>
        </div>
      </div>

      {/* Games in Branch */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-700">
          <h3 className="text-white font-semibold">بازی‌های این شعبه ({persianNum(games.length)})</h3>
        </div>
        {games.length === 0 ? (
          <div className="p-8 text-center text-slate-500">بازی‌ای برای این شعبه ثبت نشده است.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-right text-slate-400 text-sm font-medium p-4">بازی</th>
                <th className="text-right text-slate-400 text-sm font-medium p-4">دسته‌بندی</th>
                <th className="text-right text-slate-400 text-sm font-medium p-4">مدت</th>
                <th className="text-right text-slate-400 text-sm font-medium p-4">قیمت</th>
                <th className="text-right text-slate-400 text-sm font-medium p-4">وضعیت</th>
              </tr>
            </thead>
            <tbody>
              {games.map(g => (
                <tr key={g.id} className="border-b border-slate-700/50 hover:bg-slate-750 transition-colors">
                  <td className="p-4">
                    <Link href={`/games/${g.id}`} className="text-white hover:text-red-400 font-medium text-sm transition-colors">{g.title || g.name}</Link>
                  </td>
                  <td className="p-4"><span className="text-slate-300 text-sm">{g.category?.name ?? '—'}</span></td>
                  <td className="p-4"><span className="text-slate-300 text-sm">{g.durationMin ? `${persianNum(g.durationMin)} دقیقه` : '—'}</span></td>
                  <td className="p-4"><span className="text-green-400 text-sm">{g.price != null ? `${g.price.toLocaleString('fa-IR')} ت` : '—'}</span></td>
                  <td className="p-4"><StatusBadge status={g.isActive !== false ? 'success' : 'default'} label={g.isActive !== false ? 'فعال' : 'غیرفعال'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
