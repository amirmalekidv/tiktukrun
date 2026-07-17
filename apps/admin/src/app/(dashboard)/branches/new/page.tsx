'use client';
import { useForm } from 'react-hook-form';
import { SectionHeader } from '@/components/ui';
import BranchLocationPicker from '@/components/branches/BranchLocationPicker';
import { branchesApi, citiesApi, staffApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface CityOption { id: string; name: string }
interface StaffOption { id: string; fullName?: string | null; mobile?: string | null }
interface BranchFormValues {
  name: string;
  cityId: string;
  address: string;
  phone?: string;
  managerId?: string;
  lat?: string;
  lng?: string;
}

function unwrap<T>(res: unknown): T {
  const d = (res as { data?: unknown })?.data;
  if (d && typeof d === 'object' && 'data' in (d as Record<string, unknown>)) {
    return (d as { data: T }).data;
  }
  return d as T;
}

function readCoordinate(value: unknown, min: number, max: number, label: string) {
  const raw = String(value ?? '').trim();
  if (!raw) return undefined;
  const num = Number(raw);
  if (!Number.isFinite(num) || num < min || num > max) {
    throw new Error(`${label} معتبر نیست`);
  }
  return num;
}

function readCoordinateForMap(value: unknown, min: number, max: number) {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  const num = Number(raw);
  return Number.isFinite(num) && num >= min && num <= max ? num : null;
}

function buildBranchPayload(data: BranchFormValues) {
  const lat = readCoordinate(data.lat, -90, 90, 'عرض جغرافیایی');
  const lng = readCoordinate(data.lng, -180, 180, 'طول جغرافیایی');
  const payload: Record<string, unknown> = {
    name: data.name,
    cityId: data.cityId,
    address: data.address,
    isActive: true,
  };

  if (data.phone?.trim()) payload.phone = data.phone.trim();
  if (data.managerId) payload.managerId = data.managerId;
  if (lat !== undefined) payload.lat = lat;
  if (lng !== undefined) payload.lng = lng;

  return payload;
}

export default function NewBranchPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState<CityOption[]>([]);
  const [managers, setManagers] = useState<StaffOption[]>([]);
  const { register, handleSubmit, setValue, watch } = useForm<BranchFormValues>();
  const selectedLat = readCoordinateForMap(watch('lat'), -90, 90);
  const selectedLng = readCoordinateForMap(watch('lng'), -180, 180);

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

  const onSubmit = async (data: BranchFormValues) => {
    setLoading(true);
    try {
      const payload = buildBranchPayload(data);
      await branchesApi.create(payload as Parameters<typeof branchesApi.create>[0]);
      toast.success('شعبه با موفقیت ایجاد شد');
      router.push('/branches');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'خطا در ایجاد شعبه');
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
          <input {...register('lat')} type="hidden" />
          <input {...register('lng')} type="hidden" />
          <BranchLocationPicker
            lat={selectedLat}
            lng={selectedLng}
            onChange={(coords) => {
              setValue('lat', String(coords.lat), { shouldDirty: true, shouldValidate: true });
              setValue('lng', String(coords.lng), { shouldDirty: true, shouldValidate: true });
            }}
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'ایجاد شعبه'}
        </button>
      </form>
    </div>
  );
}
