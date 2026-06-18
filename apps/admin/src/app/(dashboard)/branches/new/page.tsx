'use client';
import { useForm } from 'react-hook-form';
import { SectionHeader } from '@/components/ui';
import { branchesApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

export default function NewBranchPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit } = useForm();

  const onSubmit = async (data: Record<string, unknown>) => {
    setLoading(true);
    try {
      await branchesApi.create(data as Parameters<typeof branchesApi.create>[0]);
      toast.success('شعبه با موفقیت ایجاد شد');
      router.push('/branches');
    } catch { toast.error('خطا'); }
    finally { setLoading(false); }
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
              <option value="c1">تهران</option>
              <option value="c2">مشهد</option>
              <option value="c3">اصفهان</option>
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
              <label className="label-field">ایمیل</label>
              <input type="email" {...register('email')} className="input-field" dir="ltr" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">عرض جغرافیایی</label>
              <input type="number" step="any" {...register('lat')} className="input-field" dir="ltr" />
            </div>
            <div>
              <label className="label-field">طول جغرافیایی</label>
              <input type="number" step="any" {...register('lng')} className="input-field" dir="ltr" />
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            ایجاد شعبه
          </button>
          <button type="button" onClick={() => router.back()} className="btn-secondary">انصراف</button>
        </div>
      </form>
    </div>
  );
}
