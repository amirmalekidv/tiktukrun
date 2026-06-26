'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SectionHeader } from '@/components/ui';
import { FiGlobe, FiPhone, FiMail, FiMapPin, FiSave, FiAlertCircle } from 'react-icons/fi';
import { useAdminSettings } from '@/lib/hooks/useAdminSettings';

const schema = z.object({
  siteName: z.string().min(2, 'نام سایت حداقل ۲ کاراکتر'),
  siteSlogan: z.string().optional(),
  supportPhone: z.string().min(8, 'شماره تلفن معتبر وارد کنید'),
  supportEmail: z.string().email('ایمیل معتبر وارد کنید'),
  address: z.string().optional(),
  workingHours: z.string().optional(),
  timezone: z.string(),
  language: z.string(),
  maintenanceMode: z.boolean(),
  registrationEnabled: z.boolean(),
  maxBookingsPerUser: z.number().min(1).max(100),
  cancelDeadlineHours: z.number().min(1).max(72),
});

type FormData = z.infer<typeof schema>;

const defaultValues: FormData = {
  siteName: 'تیک تاک ران',
  siteSlogan: 'هیجان فرار اتاق‌های فرار',
  supportPhone: '021-12345678',
  supportEmail: 'support@tiktakrun.ir',
  address: 'تهران، خیابان ولیعصر',
  workingHours: '۹ صبح تا ۱۲ شب',
  timezone: 'Asia/Tehran',
  language: 'fa',
  maintenanceMode: false,
  registrationEnabled: true,
  maxBookingsPerUser: 5,
  cancelDeadlineHours: 24,
};

const FIELD_MAP: Record<keyof FormData, string> = {
  siteName: 'public.siteName',
  siteSlogan: 'public.siteSlogan',
  supportPhone: 'public.supportPhone',
  supportEmail: 'public.supportEmail',
  address: 'public.address',
  workingHours: 'public.workingHours',
  timezone: 'public.timezone',
  language: 'public.language',
  maintenanceMode: 'public.maintenanceMode',
  registrationEnabled: 'public.registrationEnabled',
  maxBookingsPerUser: 'booking.maxActivePerUser',
  cancelDeadlineHours: 'financial.refundWindowHours',
};

const BOOL_TRANSFORMS = {
  fromDb: {
    maintenanceMode: (v: string) => v === 'true',
    registrationEnabled: (v: string) => v === 'true',
  },
  toDb: {
    maintenanceMode: (v: unknown) => (v ? 'true' : 'false'),
    registrationEnabled: (v: unknown) => (v ? 'true' : 'false'),
  },
};

export default function GeneralSettingsPage() {
  const { loading, saving, saved, save, values } = useAdminSettings(
    'general',
    FIELD_MAP,
    defaultValues,
    BOOL_TRANSFORMS,
  );

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  useEffect(() => {
    if (!loading) reset(values);
  }, [loading, values, reset]);

  const maintenanceMode = watch('maintenanceMode');
  const registrationEnabled = watch('registrationEnabled');

  const onSubmit = async (data: FormData) => {
    await save(data);
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="تنظیمات عمومی"
        subtitle="اطلاعات پایه‌ای سایت و تنظیمات کلی پلتفرم"
        icon={<FiGlobe />}
      />

      {saved && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-center gap-3">
          <FiAlertCircle className="text-green-400 w-5 h-5" />
          <span className="text-green-400 text-sm">تنظیمات با موفقیت ذخیره شد.</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Site Info */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
            <FiGlobe className="text-red-400" />
            اطلاعات سایت
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">نام سایت</label>
              <input {...register('siteName')} className="input-field w-full" />
              {errors.siteName && <p className="text-red-400 text-xs mt-1">{errors.siteName.message}</p>}
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">شعار سایت</label>
              <input {...register('siteSlogan')} className="input-field w-full" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">زبان پیش‌فرض</label>
              <select {...register('language')} className="input-field w-full">
                <option value="fa">فارسی</option>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">منطقه زمانی</label>
              <select {...register('timezone')} className="input-field w-full">
                <option value="Asia/Tehran">Asia/Tehran (+3:30)</option>
                <option value="UTC">UTC (+0:00)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
            <FiPhone className="text-red-400" />
            اطلاعات تماس
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">تلفن پشتیبانی</label>
              <div className="relative">
                <FiPhone className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input {...register('supportPhone')} className="input-field w-full pr-9" />
              </div>
              {errors.supportPhone && <p className="text-red-400 text-xs mt-1">{errors.supportPhone.message}</p>}
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">ایمیل پشتیبانی</label>
              <div className="relative">
                <FiMail className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input {...register('supportEmail')} className="input-field w-full pr-9" />
              </div>
              {errors.supportEmail && <p className="text-red-400 text-xs mt-1">{errors.supportEmail.message}</p>}
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">ساعت کاری</label>
              <input {...register('workingHours')} className="input-field w-full" placeholder="۹ صبح تا ۱۲ شب" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">آدرس</label>
              <div className="relative">
                <FiMapPin className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input {...register('address')} className="input-field w-full pr-9" />
              </div>
            </div>
          </div>
        </div>

        {/* Booking Rules */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-semibold mb-5">قوانین رزرو</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">حداکثر رزرو فعال هر کاربر</label>
              <input type="number" {...register('maxBookingsPerUser', { valueAsNumber: true })} className="input-field w-full" min={1} max={100} />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">مهلت لغو رزرو (ساعت)</label>
              <input type="number" {...register('cancelDeadlineHours', { valueAsNumber: true })} className="input-field w-full" min={1} max={72} />
            </div>
          </div>
        </div>

        {/* System Controls */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-semibold mb-5">کنترل‌های سیستم</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-750 rounded-lg border border-slate-600">
              <div>
                <p className="text-white font-medium">حالت تعمیرات</p>
                <p className="text-slate-400 text-sm">سایت برای کاربران عادی غیرقابل دسترس می‌شود</p>
              </div>
              <button
                type="button"
                onClick={() => setValue('maintenanceMode', !maintenanceMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${maintenanceMode ? 'bg-red-500' : 'bg-slate-600'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${maintenanceMode ? 'translate-x-1' : 'translate-x-6'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-750 rounded-lg border border-slate-600">
              <div>
                <p className="text-white font-medium">ثبت‌نام کاربران</p>
                <p className="text-slate-400 text-sm">امکان ثبت‌نام کاربران جدید</p>
              </div>
              <button
                type="button"
                onClick={() => setValue('registrationEnabled', !registrationEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${registrationEnabled ? 'bg-green-500' : 'bg-slate-600'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${registrationEnabled ? 'translate-x-1' : 'translate-x-6'}`} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center gap-2 px-6 py-2.5"
          >
            <FiSave className="w-4 h-4" />
            {loading ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
          </button>
        </div>
      </form>
    </div>
  );
}
