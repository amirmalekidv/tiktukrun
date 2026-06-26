'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SectionHeader } from '@/components/ui';
import { FiShield, FiArrowRight, FiUsers } from 'react-icons/fi';
import { rolesApi } from '@/lib/api';
import { getRoleLabel } from '@/lib/permissions';

interface RoleDetail {
  id: number | string;
  name: string;
  displayName?: string;
  description?: string;
  permissions?: string[];
  users?: { id: string; fullName?: string; mobile?: string; avatarUrl?: string }[];
}

export default function RoleDetailPage({ params }: { params: { id: string } }) {
  const [role, setRole] = useState<RoleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await rolesApi.getById(params.id);
        if (!cancelled) setRole((res.data as { data: RoleDetail }).data);
      } catch {
        if (!cancelled) setError('نقش یافت نشد');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [params.id]);

  if (loading) {
    return <div className="text-slate-400 p-6">در حال بارگذاری...</div>;
  }

  if (error || !role) {
    return (
      <div className="p-6">
        <p className="text-red-400">{error ?? 'نقش یافت نشد'}</p>
        <Link href="/roles" className="text-blue-400 text-sm mt-2 inline-block">بازگشت به لیست نقش‌ها</Link>
      </div>
    );
  }

  const users = role.users ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/roles" className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
          <FiArrowRight className="w-5 h-5" />
        </Link>
        <SectionHeader
          title={role.displayName ?? getRoleLabel(role.name)}
          subtitle="نقش سیستمی — فقط خواندنی"
          icon={<FiShield />}
        />
      </div>

      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-amber-200 text-sm">
        نقش‌ها از enum سیستمی هستند و قابل ویرایش نیستند. برای تخصیص نقش به کاربر از بخش کارکنان استفاده کنید.
      </div>

      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-red-500/20 rounded-xl flex items-center justify-center">
            <FiShield className="w-7 h-7 text-red-400" />
          </div>
          <div>
            <h2 className="text-white text-xl font-bold">{role.displayName ?? getRoleLabel(role.name)}</h2>
            <p className="text-slate-400 text-sm font-mono">{role.name}</p>
            {role.description && <p className="text-slate-500 text-sm mt-1">{role.description}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-white font-semibold mb-3">دسترسی‌های فعال ({role.permissions?.length ?? 0})</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {(role.permissions ?? []).map((p) => (
                <div key={p} className="flex items-center gap-2 p-2 bg-green-500/5 border border-green-500/20 rounded-lg">
                  <div className="w-2 h-2 bg-green-400 rounded-full shrink-0" />
                  <span className="text-slate-300 text-sm font-mono">{p}</span>
                </div>
              ))}
              {(role.permissions ?? []).length === 0 && (
                <p className="text-slate-500 text-sm">بدون دسترسی خاص</p>
              )}
            </div>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <FiUsers className="text-blue-400 w-4 h-4" />
              کاربران با این نقش ({users.length})
            </h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {users.map((u) => (
                <div key={u.id} className="flex items-center gap-2 p-2 bg-slate-750 rounded-lg">
                  <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {(u.fullName ?? u.mobile ?? '?')[0]}
                  </div>
                  <div>
                    <span className="text-slate-300 text-sm block">{u.fullName ?? 'بدون نام'}</span>
                    <span className="text-slate-500 text-xs">{u.mobile}</span>
                  </div>
                </div>
              ))}
              {users.length === 0 && (
                <p className="text-slate-500 text-sm">هیچ کاربری با این نقش یافت نشد</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
