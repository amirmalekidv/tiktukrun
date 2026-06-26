'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { SectionHeader } from '@/components/ui';
import { FiDroplet, FiSave, FiAlertCircle, FiImage, FiType } from 'react-icons/fi';
import { useAdminSettings } from '@/lib/hooks/useAdminSettings';

interface ThemeSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  dangerColor: string;
  
  fontFamilyFa: string;
  fontFamilyEn: string;
  fontSize: string;
  
  logoUrl: string;
  faviconUrl: string;
  loginBgUrl: string;
  
  borderRadius: string;
  sidebarStyle: string;
  tableStyle: string;
  
  darkMode: boolean;
  animationsEnabled: boolean;
  compactMode: boolean;
}

const defaults: ThemeSettings = {
  primaryColor: '#dc2626',
  secondaryColor: '#0f172a',
  accentColor: '#f97316',
  dangerColor: '#ef4444',
  
  fontFamilyFa: 'Vazirmatn',
  fontFamilyEn: 'Inter',
  fontSize: 'md',
  
  logoUrl: '/logo.png',
  faviconUrl: '/favicon.ico',
  loginBgUrl: '',
  
  borderRadius: 'lg',
  sidebarStyle: 'dark',
  tableStyle: 'striped',
  
  darkMode: true,
  animationsEnabled: true,
  compactMode: false,
};

const COLOR_PRESETS = [
  { name: 'قرمز (پیش‌فرض)', primary: '#dc2626', secondary: '#0f172a' },
  { name: 'آبی', primary: '#2563eb', secondary: '#1e1b4b' },
  { name: 'سبز', primary: '#16a34a', secondary: '#052e16' },
  { name: 'بنفش', primary: '#7c3aed', secondary: '#1e1b4b' },
  { name: 'نارنجی', primary: '#ea580c', secondary: '#0c0a09' },
];

const FIELD_MAP: Record<string, string> = {
  darkMode: 'public.theme',
  primaryColor: 'theme.primaryColor',
  secondaryColor: 'theme.secondaryColor',
  logoUrl: 'theme.logoUrl',
};

const THEME_TRANSFORMS = {
  fromDb: {
    darkMode: (v: string) => v === 'dark',
  },
  toDb: {
    darkMode: (v: unknown) => (v ? 'dark' : 'light'),
  },
};

export default function ThemeSettingsPage() {
  const { loading, saving, saved, save, values } = useAdminSettings(
    'general',
    FIELD_MAP,
    defaults,
    THEME_TRANSFORMS,
  );

  const { register, handleSubmit, watch, setValue, reset } = useForm<ThemeSettings>({ defaultValues: defaults });

  useEffect(() => {
    if (!loading) reset(values);
  }, [loading, values, reset]);

  const bools = {
    darkMode: watch('darkMode'),
    animationsEnabled: watch('animationsEnabled'),
    compactMode: watch('compactMode'),
  };

  const primaryColor = watch('primaryColor');
  const secondaryColor = watch('secondaryColor');

  const onSubmit = async (data: ThemeSettings) => {
    await save(data);
  };

  const Toggle = ({ field, label, desc }: { field: keyof typeof bools; label: string; desc?: string }) => (
    <div className="flex items-center justify-between p-4 bg-slate-750 rounded-lg border border-slate-600">
      <div>
        <p className="text-white font-medium">{label}</p>
        {desc && <p className="text-slate-400 text-sm">{desc}</p>}
      </div>
      <button
        type="button"
        onClick={() => setValue(field, !bools[field])}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${bools[field] ? 'bg-green-500' : 'bg-slate-600'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${bools[field] ? 'translate-x-1' : 'translate-x-6'}`} />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <SectionHeader
        title="تنظیمات ظاهری"
        subtitle="شخصی‌سازی رنگ‌ها، فونت‌ها و استایل داشبورد"
        icon={<FiDroplet />}
      />

      {saved && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-center gap-3">
          <FiAlertCircle className="text-green-400 w-5 h-5" />
          <span className="text-green-400 text-sm">تنظیمات ظاهری ذخیره شد.</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Color Presets */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
            <FiDroplet className="text-red-400" />
            پالت رنگ
          </h3>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-6">
            {COLOR_PRESETS.map(preset => (
              <button
                key={preset.name}
                type="button"
                onClick={() => { setValue('primaryColor', preset.primary); setValue('secondaryColor', preset.secondary); }}
                className={`p-3 rounded-lg border text-center text-xs transition-all ${primaryColor === preset.primary ? 'border-white' : 'border-slate-600'}`}
              >
                <div className="w-8 h-8 rounded-full mx-auto mb-2" style={{ background: preset.primary }} />
                <span className="text-slate-300">{preset.name}</span>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">رنگ اصلی</label>
              <div className="flex gap-2 items-center">
                <input type="color" {...register('primaryColor')} className="w-10 h-10 rounded cursor-pointer bg-transparent border-0" />
                <input {...register('primaryColor')} className="input-field flex-1 text-xs" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">رنگ ثانویه</label>
              <div className="flex gap-2 items-center">
                <input type="color" {...register('secondaryColor')} className="w-10 h-10 rounded cursor-pointer bg-transparent border-0" />
                <input {...register('secondaryColor')} className="input-field flex-1 text-xs" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">رنگ تاکید</label>
              <div className="flex gap-2 items-center">
                <input type="color" {...register('accentColor')} className="w-10 h-10 rounded cursor-pointer bg-transparent border-0" />
                <input {...register('accentColor')} className="input-field flex-1 text-xs" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">رنگ خطر</label>
              <div className="flex gap-2 items-center">
                <input type="color" {...register('dangerColor')} className="w-10 h-10 rounded cursor-pointer bg-transparent border-0" />
                <input {...register('dangerColor')} className="input-field flex-1 text-xs" />
              </div>
            </div>
          </div>
        </div>

        {/* Typography */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
            <FiType className="text-red-400" />
            تایپوگرافی
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">فونت فارسی</label>
              <select {...register('fontFamilyFa')} className="input-field w-full">
                <option value="Vazirmatn">Vazirmatn</option>
                <option value="IRANSans">IRANSans</option>
                <option value="Shabnam">Shabnam</option>
                <option value="Dana">Dana</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">فونت انگلیسی</label>
              <select {...register('fontFamilyEn')} className="input-field w-full">
                <option value="Inter">Inter</option>
                <option value="Roboto">Roboto</option>
                <option value="Poppins">Poppins</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">اندازه فونت پایه</label>
              <select {...register('fontSize')} className="input-field w-full">
                <option value="sm">کوچک (14px)</option>
                <option value="md">متوسط (16px)</option>
                <option value="lg">بزرگ (18px)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
            <FiImage className="text-red-400" />
            هویت بصری
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">آدرس لوگو</label>
              <input {...register('logoUrl')} className="input-field w-full" placeholder="/logo.png" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">آدرس فاوآیکن</label>
              <input {...register('faviconUrl')} className="input-field w-full" placeholder="/favicon.ico" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">تصویر پس‌زمینه صفحه ورود</label>
              <input {...register('loginBgUrl')} className="input-field w-full" placeholder="https://..." />
            </div>
          </div>
        </div>

        {/* Style Options */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-semibold mb-5">گزینه‌های استایل</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm text-slate-400 mb-1">گردی گوشه‌ها</label>
              <select {...register('borderRadius')} className="input-field w-full">
                <option value="none">بدون گردی</option>
                <option value="sm">کم (4px)</option>
                <option value="md">متوسط (8px)</option>
                <option value="lg">زیاد (12px)</option>
                <option value="xl">خیلی زیاد (16px)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">استایل سایدبار</label>
              <select {...register('sidebarStyle')} className="input-field w-full">
                <option value="dark">تیره</option>
                <option value="colored">رنگی</option>
                <option value="light">روشن</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">استایل جدول</label>
              <select {...register('tableStyle')} className="input-field w-full">
                <option value="striped">راه‌راه</option>
                <option value="bordered">کادردار</option>
                <option value="minimal">ساده</option>
              </select>
            </div>
          </div>
          <div className="space-y-3">
            <Toggle field="darkMode" label="حالت تاریک" desc="رابط کاربری در تم تاریک" />
            <Toggle field="animationsEnabled" label="انیمیشن‌ها" desc="انیمیشن‌های رابط کاربری" />
            <Toggle field="compactMode" label="حالت فشرده" desc="فضای کمتر بین المان‌ها" />
          </div>
        </div>

        {/* Preview */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-semibold mb-4">پیش‌نمایش رنگ‌ها</h3>
          <div className="flex gap-4 flex-wrap">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-lg" style={{ background: primaryColor }}>
              اصلی
            </div>
            <div className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-lg" style={{ background: secondaryColor }}>
              ثانویه
            </div>
            <div className="flex-1 p-4 rounded-xl" style={{ background: secondaryColor }}>
              <div className="text-sm font-bold mb-1" style={{ color: primaryColor }}>عنوان نمونه</div>
              <div className="text-xs text-slate-400">متن توضیحی نمونه در این رنگ نمایش داده می‌شود</div>
              <button className="mt-2 px-3 py-1 rounded-lg text-xs text-white font-medium" style={{ background: primaryColor }}>
                دکمه نمونه
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2 px-6 py-2.5">
            <FiSave className="w-4 h-4" />
            {loading ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
          </button>
        </div>
      </form>
    </div>
  );
}
