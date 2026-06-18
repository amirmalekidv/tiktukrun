'use client';

import { useState, useEffect, useCallback } from 'react';
import { SectionHeader, Modal, StatusBadge, Avatar, EmptyState, Pagination } from '@/components/ui';
import { FiUsers, FiPhone, FiShield, FiEdit2 } from 'react-icons/fi';
import { RefreshCw } from 'lucide-react';
import { staffApi, rolesApi } from '@/lib/api';
import { toJalali } from '@/lib/utils/format';
import toast from 'react-hot-toast';

interface StaffUser {
  id: string;
  fullName?: string | null;
  nickname?: string | null;
  mobile?: string | null;
  email?: string | null;
  isBanned?: boolean;
  createdAt?: string;
  roles?: string[];
}

interface RoleOption {
  id: number | string;
  name: string;
  displayName?: string;
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'سوپر ادمین',
  ADMIN: 'ادمین',
  SUPPORT: 'پشتیبانی',
  MARKETING: 'بازاریابی',
  BRANCH_MANAGER: 'مدیر شعبه',
  CUSTOMER: 'کاربر عادی',
};

const PAGE_SIZE = 20;

function readList(res: { data?: unknown } | null | undefined): { items: StaffUser[]; total: number } {
  const body = (res as { data?: unknown } | null | undefined)?.data;
  if (body && typeof body === 'object' && 'data' in (body as Record<string, unknown>)) {
    const inner = body as { data: StaffUser[]; total?: number };
    return { items: Array.isArray(inner.data) ? inner.data : [], total: inner.total ?? inner.data?.length ?? 0 };
  }
  const arr = Array.isArray(body) ? (body as StaffUser[]) : [];
  return { items: arr, total: arr.length };
}

function readData<T = unknown>(res: { data?: unknown } | null | undefined): T | null {
  const d = (res as { data?: unknown } | null | undefined)?.data;
  if (d && typeof d === 'object' && 'data' in (d as Record<string, unknown>)) {
    return (d as { data: T }).data;
  }
  return (d as T) ?? null;
}

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [allRoles, setAllRoles] = useState<RoleOption[]>([]);

  // role editing modal
  const [editUser, setEditUser] = useState<StaffUser | null>(null);
  const [editRoles, setEditRoles] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: PAGE_SIZE };
      if (search) params.q = search;
      if (filterRole) params.role = filterRole;
      const res = await staffApi.getAll(params);
      const { items, total: t } = readList(res);
      setStaff(items);
      setTotal(t);
    } catch {
      toast.error('خطا در بارگذاری کاربران');
      setStaff([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterRole]);

  const loadRoles = useCallback(async () => {
    try {
      const res = await rolesApi.getAll();
      const data = readData<RoleOption[]>(res);
      setAllRoles(Array.isArray(data) ? data : []);
    } catch {
      setAllRoles([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const openEdit = (u: StaffUser) => {
    setEditUser(u);
    setEditRoles([...(u.roles ?? [])]);
  };

  const toggleRole = (role: string) => {
    setEditRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));
  };

  const saveRoles = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      await staffApi.updateRoles(editUser.id, editRoles);
      toast.success('نقش‌ها به‌روزرسانی شد');
      setEditUser(null);
      await load();
    } catch {
      toast.error('خطا در به‌روزرسانی نقش‌ها');
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <SectionHeader
        title="مدیریت کارمندان و نقش‌ها"
        subtitle="انتساب نقش‌های سیستمی به کاربران"
        icon={<FiUsers />}
      />

      {/* Filters */}
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="جستجو نام، موبایل، ایمیل..."
          className="input-field flex-1 min-w-48"
        />
        <select value={filterRole} onChange={(e) => { setFilterRole(e.target.value); setPage(1); }} className="input-field">
          <option value="">همه نقش‌ها</option>
          {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <RefreshCw className="w-8 h-8 text-red-400 animate-spin" />
        </div>
      ) : staff.length === 0 ? (
        <EmptyState title="کاربری یافت نشد" />
      ) : (
        <>
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-right text-slate-400 text-sm font-medium p-4">کاربر</th>
                  <th className="text-right text-slate-400 text-sm font-medium p-4">تماس</th>
                  <th className="text-right text-slate-400 text-sm font-medium p-4">نقش‌ها</th>
                  <th className="text-right text-slate-400 text-sm font-medium p-4">وضعیت</th>
                  <th className="text-right text-slate-400 text-sm font-medium p-4">عضویت</th>
                  <th className="text-right text-slate-400 text-sm font-medium p-4">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((s) => (
                  <tr key={s.id} className="border-b border-slate-700/50 hover:bg-slate-750 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={s.fullName ?? s.nickname ?? undefined} size="sm" />
                        <div>
                          <p className="text-white font-medium text-sm">{s.fullName ?? s.nickname ?? 'بدون نام'}</p>
                          <p className="text-slate-500 text-xs">{s.email ?? '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-slate-300 text-xs">
                        <FiPhone className="w-3 h-3 text-slate-500" />
                        {s.mobile ?? '-'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {(s.roles ?? []).length === 0 ? (
                          <span className="text-slate-500 text-xs">—</span>
                        ) : (
                          (s.roles ?? []).map((r) => (
                            <span key={r} className="inline-flex items-center gap-1 text-xs bg-red-500/10 text-red-300 px-2 py-0.5 rounded">
                              <FiShield className="w-3 h-3" />
                              {ROLE_LABELS[r] ?? r}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <StatusBadge status={s.isBanned ? 'BANNED' : 'ACTIVE'} label={s.isBanned ? 'مسدود' : 'فعال'} />
                    </td>
                    <td className="p-4">
                      <span className="text-slate-400 text-sm">{s.createdAt ? toJalali(s.createdAt) : '-'}</span>
                    </td>
                    <td className="p-4">
                      <button onClick={() => openEdit(s)} className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors" title="مدیریت نقش‌ها">
                        <FiEdit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} total={total} />
        </>
      )}

      {/* Role assignment Modal */}
      <Modal
        open={!!editUser}
        onClose={() => setEditUser(null)}
        title={`مدیریت نقش‌ها — ${editUser?.fullName ?? editUser?.mobile ?? ''}`}
        footer={
          <>
            <button onClick={() => setEditUser(null)} className="btn-secondary">انصراف</button>
            <button onClick={saveRoles} disabled={saving} className="btn-primary">
              {saving ? 'در حال ذخیره...' : 'ذخیره نقش‌ها'}
            </button>
          </>
        }
      >
        <div className="space-y-2">
          <p className="text-slate-400 text-sm mb-2">نقش‌های سیستمی را برای این کاربر انتخاب کنید:</p>
          {(allRoles.length ? allRoles.map((r) => r.name) : Object.keys(ROLE_LABELS)).map((roleName) => (
            <label key={roleName} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={editRoles.includes(roleName)}
                onChange={() => toggleRole(roleName)}
                className="w-4 h-4 accent-red-500"
              />
              <FiShield className="w-4 h-4 text-red-400" />
              <span className="text-slate-200 text-sm">{ROLE_LABELS[roleName] ?? roleName}</span>
              <span className="text-slate-500 text-xs mr-auto font-mono">{roleName}</span>
            </label>
          ))}
        </div>
      </Modal>
    </div>
  );
}
