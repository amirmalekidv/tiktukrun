'use client';

import { useState, useEffect, useCallback } from 'react';
import { SectionHeader, EmptyState } from '@/components/ui';
import { FiShield, FiUsers } from 'react-icons/fi';
import { RefreshCw } from 'lucide-react';
import { rolesApi } from '@/lib/api';
import { persianNum } from '@/lib/utils/format';
import toast from 'react-hot-toast';

// Backend Role (from hard-coded enum): { id, name, displayName, description, permissions[], isSystem, createdAt }
interface Role {
  id: number | string;
  name: string;
  displayName?: string;
  description?: string;
  permissions: string[];
  isSystem?: boolean;
  createdAt?: string;
}

// Persian labels for permission prefixes (groups)
const GROUP_LABELS: Record<string, string> = {
  users: 'کاربران',
  games: 'بازی‌ها',
  bookings: 'رزروها',
  wallet: 'کیف پول',
  chats: 'چت‌ها',
  crm: 'CRM',
  finance: 'مالی',
  settings: 'تنظیمات',
  gamification: 'گیمیفیکیشن',
  branch: 'شعبه',
  analytics: 'آنالیتیکس',
  tickets: 'تیکت‌ها',
  campaigns: 'کمپین‌ها',
  pipeline: 'پایپ‌لاین',
};

function readData<T = unknown>(res: { data?: unknown } | null | undefined): T | null {
  const d = (res as { data?: unknown } | null | undefined)?.data;
  if (d && typeof d === 'object' && 'data' in (d as Record<string, unknown>)) {
    return (d as { data: T }).data;
  }
  return (d as T) ?? null;
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await rolesApi.getAll();
      const data = readData<Role[]>(res);
      setRoles(Array.isArray(data) ? data : []);
    } catch {
      toast.error('خطا در بارگذاری نقش‌ها');
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function groupPermissions(perms: string[]): Record<string, string[]> {
    const groups: Record<string, string[]> = {};
    for (const p of perms) {
      const prefix = p.split('.')[0];
      if (!groups[prefix]) groups[prefix] = [];
      groups[prefix].push(p);
    }
    return groups;
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="نقش‌ها و دسترسی‌ها"
        subtitle="نقش‌های سیستمی و سطوح دسترسی (فقط مشاهده — نقش‌ها در enum سیستم تعریف شده‌اند)"
        icon={<FiShield />}
      />

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <RefreshCw className="w-8 h-8 text-red-400 animate-spin" />
        </div>
      ) : roles.length === 0 ? (
        <EmptyState title="نقشی یافت نشد" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {roles.map((role) => {
            const groups = groupPermissions(role.permissions || []);
            return (
              <div key={role.id} className="bg-slate-800 rounded-xl p-5 border border-slate-700">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-red-500/20">
                      <FiShield className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">{role.displayName ?? role.name}</h3>
                      <p className="text-slate-500 text-xs">{role.name}</p>
                    </div>
                  </div>
                  {role.isSystem && (
                    <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded">سیستمی</span>
                  )}
                </div>
                {role.description && <p className="text-slate-400 text-sm mb-4">{role.description}</p>}

                <div className="flex items-center gap-2 text-slate-400 text-sm mb-3">
                  <FiUsers className="w-4 h-4" />
                  <span>{persianNum(role.permissions?.length ?? 0)} دسترسی</span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {Object.entries(groups).map(([prefix, perms]) => (
                    <div key={prefix} className="bg-slate-900/50 rounded-lg p-2">
                      <p className="text-slate-300 text-xs font-medium mb-1">{GROUP_LABELS[prefix] ?? prefix}</p>
                      <div className="flex flex-wrap gap-1">
                        {perms.map((p) => (
                          <span key={p} className="text-[10px] bg-red-500/10 text-red-300 px-1.5 py-0.5 rounded font-mono">
                            {p.split('.')[1] ?? p}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
