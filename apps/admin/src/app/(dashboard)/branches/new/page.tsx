'use client';
import { useForm } from 'react-hook-form';
import { SectionHeader } from '@/components/ui';
import { branchesApi, citiesApi, staffApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface CityOption { id: string; name: string }
interface StaffOption { id: string; fullName?: string | null; mobile?: string | null }

function unwrap<T>(res: unknown): T {
  const d = (res as { data?: unknown })?.data;
  if (d && typeof d === 'object' && 'data' in (d as Record<string, unknown>)) {
    return (d as { data: T }).data;
  }
  return d as T;
}

export default function NewBranchPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState<CityOption[]>([]);
  const [managers, setManagers] = useState<StaffOption[]>([]);
  const { register, handleSubmit } = useForm();

  useEffect(() => {
    Promise.all([
      citiesApi.getAll().then((r) => unwrap<CityOption[]>(r)).catch(() => []),
      staffApi.getAll({ role: 'BRANCH_MANAGER', limit: 100 }).then((r) => {
        const body = unwrap<{ data?: StaffOption[] } | StaffOption[]>(r);
        return Array.isArray(body) ? body : body?.data ?? [];
      }).catch(() => []),
    ]).then(([c, m]) => {
      setCities(Array.isArray(c) ? c : []);
      setManagers(Array.isArray(m) ? m : []);
    });
  }, []);

  const onSubmit = async (data: Record<string, unknown>) => {
    setLoading(true);
    try {
      const payload = { ...data };
      if (!payload.managerId) delete payload.managerId;
      await branchesApi.create(payload as Parameters<typeof branchesApi.create>[0]);
      toast.success('شعبه با موفقیت ایجاد شد');
      router.push('/branches');
    } catch {
      toast.error('خطا در ایجاد شعبه');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <SectionHeader title="شعبه جدید" breadcrumb={[{ label: 'شعب', href: '/branches' }, { label: 'جدید' }]} />
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-4">
        <div className="admin-card space-y-4">
          <div>
            <label className="label-field">نام شعبه *</label>
            <input {...register('name', { required: true })} className="input-field" placeholder="مثال: شعبه تهران" />
          </div>
          <div>
            <label className="label-field">شهر *</label>
            <select {...register('cityId', { required: true })} className="select-field">
              <option value="">انتخاب شهر...</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-field">آدرس *</label>
            <textarea {...register('address', { required: true })} className="input-field resize-none h-20" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">تلفن</label>
              <input {...register('phone')} className="input-field" dir="ltr" />
            </div>
            <div>
              <label className="label-field">مالک / مدیر شعبه</label>
              <select {...register('managerId')} className="select-field">
                <option value="">بدون مدیر</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName || m.mobile || m.id}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">عرض جغرافیایی</label>
              <input {...register('lat')} type="number" step="any" className="input-field" dir="ltr" />
            </div>
            <div>
              <label className="label-field">طول جغرافیایی</label>
              <input {...register('lng')} type="number" step="any" className="input-field" dir="ltr" />
            </div>
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'ایجاد شعبه'}
        </button>
      </form>
    </div>
  );
}
