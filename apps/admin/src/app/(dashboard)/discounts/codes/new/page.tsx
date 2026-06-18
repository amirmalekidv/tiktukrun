'use client';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SectionHeader } from '@/components/ui';
import { discountsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

const schema = z.object({
  code: z.string().min(4).max(20).toUpperCase(),
  type: z.enum(['PERCENT', 'FIXED']),
  value: z.number().min(1),
  minPurchase: z.string().optional(),
  maxDiscount: z.string().optional(),
  validFrom: z.string().optional(),
  validUntil: z.string().min(1, 'تاریخ انقضا الزامی است'),
  maxUses: z.number().optional(),
  targetSegment: z.enum(['ALL', 'VIP', 'NEW', 'RETURNING', 'SPECIFIC']),
  isActive: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export default function NewDiscountCodePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'PERCENT', targetSegment: 'ALL', isActive: true },
  });

  const type = watch('type');

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array(8).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await discountsApi.createCode(data);
      toast.success('کد تخفیف ایجاد شد');
      router.push('/discounts/codes');
    } catch { toast.error('خطا'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fade-in">
      <SectionHeader
        title="کد تخفیف جدید"
        breadcrumb={[{ label: 'تخفیف‌ها' }, { label: 'کدها', href: '/discounts/codes' }, { label: 'جدید' }]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-4">
        <div className="admin-card space-y-4">
          <div>
            <label className="label-field">کد تخفیف *</label>
            <div className="flex gap-2">
              <input
                {...register('code')}
                className="input-field flex-1 uppercase"
                placeholder="NOWRUZ1403"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => {/* generate */ }}
                className="btn-secondary whitespace-nowrap"
              >
                تولید خودکار
              </button>
            </div>
            {errors.code && <p className="text-red-400 text-xs mt-1">{errors.code.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">نوع تخفیف</label>
              <div className="flex gap-2">
                {[{ v: 'PERCENT', l: 'درصدی' }, { v: 'FIXED', l: 'مبلغ ثابت' }].map(o => (
                  <label key={o.v} className="flex items-center gap-2 flex-1 p-3 rounded-xl border border-slate-700 cursor-pointer hover:border-slate-600">
                    <input type="radio" value={o.v} {...register('type')} className="accent-red-600" />
                    <span className="text-slate-300 text-sm">{o.l}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="label-field">مقدار {type === 'PERCENT' ? '(%)' : '(تومان)'} *</label>
              <input type="number" {...register('value', { valueAsNumber: true })} className="input-field" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">حداقل خرید (تومان)</label>
              <input {...register('minPurchase')} className="input-field" placeholder="500000" />
            </div>
            {type === 'PERCENT' && (
              <div>
                <label className="label-field">حداکثر تخفیف (تومان)</label>
                <input {...register('maxDiscount')} className="input-field" placeholder="200000" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">از تاریخ</label>
              <input type="date" {...register('validFrom')} className="input-field" />
            </div>
            <div>
              <label className="label-field">تا تاریخ *</label>
              <input type="date" {...register('validUntil')} className="input-field" />
              {errors.validUntil && <p className="text-red-400 text-xs mt-1">{errors.validUntil.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">حداکثر استفاده</label>
              <input type="number" {...register('maxUses', { valueAsNumber: true })} className="input-field" placeholder="بی‌محدود" />
            </div>
            <div>
              <label className="label-field">مخاطبین</label>
              <select {...register('targetSegment')} className="select-field">
                <option value="ALL">همه</option>
                <option value="VIP">VIP</option>
                <option value="NEW">کاربران جدید</option>
                <option value="RETURNING">کاربران بازگشتی</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            ایجاد کد
          </button>
          <button type="button" onClick={() => router.back()} className="btn-secondary">انصراف</button>
        </div>
      </form>
    </div>
  );
}
