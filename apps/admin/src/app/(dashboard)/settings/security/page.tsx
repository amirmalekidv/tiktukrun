'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { SectionHeader } from '@/components/ui';
import { FiShield, FiSave, FiAlertCircle, FiLock } from 'react-icons/fi';
import { useAdminSettings } from '@/lib/hooks/useAdminSettings';

interface SecuritySettings {
  twoFactorRequired: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSpecial: boolean;
  ipWhitelistEnabled: boolean;
  ipWhitelist: string;
  jwtExpireHours: number;
  refreshTokenExpireDays: number;
  auditLogEnabled: boolean;
  sensitiveActionConfirm: boolean;
}

const defaults: SecuritySettings = {
  twoFactorRequired: false,
  sessionTimeout: 120,
  maxLoginAttempts: 5,
  lockoutDuration: 30,
  passwordMinLength: 8,
  passwordRequireUppercase: true,
  passwordRequireNumbers: true,
  passwordRequireSpecial: false,
  ipWhitelistEnabled: false,
  ipWhitelist: '',
  jwtExpireHours: 24,
  refreshTokenExpireDays: 30,
  auditLogEnabled: true,
  sensitiveActionConfirm: true,
};

const FIELD_MAP: Record<string, string> = {
  maxLoginAttempts: 'security.maxLoginAttempts',
  lockoutDuration: 'security.lockoutMinutes',
  jwtExpireHours: 'security.jwtExpiry',
  otpExpireSeconds: 'security.otpExpiry',
};

export default function SecuritySettingsPage() {
  const { loading, saving, saved, save, values } = useAdminSettings('security', FIELD_MAP, defaults);

  const { register, handleSubmit, watch, setValue, reset } = useForm<SecuritySettings>({ defaultValues: defaults });

  useEffect(() => {
    if (!loading) reset(values);
  }, [loading, values, reset]);

  const boolFields = {
    twoFactorRequired: watch('twoFactorRequired'),
    passwordRequireUppercase: watch('passwordRequireUppercase'),
    passwordRequireNumbers: watch('passwordRequireNumbers'),
    passwordRequireSpecial: watch('passwordRequireSpecial'),
    ipWhitelistEnabled: watch('ipWhitelistEnabled'),
    auditLogEnabled: watch('auditLogEnabled'),
    sensitiveActionConfirm: watch('sensitiveActionConfirm'),
  };

  const onSubmit = async (data: SecuritySettings) => {
    await save(data);
  };

  const Toggle = ({ field, label, desc }: { field: keyof typeof boolFields; label: string; desc: string }) => (
    <div className="flex items-center justify-between p-4 bg-slate-750 rounded-lg border border-slate-600">
      <div>
        <p className="text-white font-medium">{label}</p>
        <p className="text-slate-400 text-sm">{desc}</p>
      </div>
      <button
        type="button"
        onClick={() => setValue(field, !boolFields[field])}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${boolFields[field] ? 'bg-green-500' : 'bg-slate-600'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${boolFields[field] ? 'translate-x-1' : 'translate-x-6'}`} />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <SectionHeader
        title="تنظیمات امنیتی"
        subtitle="پیکربندی احراز هویت، رمز عبور و کنترل دسترسی"
        icon={<FiShield />}
      />

      {saved && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-center gap-3">
          <FiAlertCircle className="text-green-400 w-5 h-5" />
          <span className="text-green-400 text-sm">تنظیمات امنیتی ذخیره شد.</span>
        </div>
      )}

      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex items-center gap-3">
        <FiAlertCircle className="text-amber-400 w-5 h-5 flex-shrink-0" />
        <span className="text-amber-400 text-sm">تغییرات در این بخش ممکن است جلسات کاربران را به پایان برساند. با احتیاط اعمال کنید.</span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Authentication */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
            <FiLock className="text-red-400" />
            احراز هویت
          </h3>
          <div className="space-y-4">
            <Toggle field="twoFactorRequired" label="احراز هویت دو مرحله‌ای اجباری" desc="کاربران ملزم به فعال‌سازی 2FA هستند" />
            <Toggle field="sensitiveActionConfirm" label="تأیید عملیات حساس" desc="درخواست تأیید برای عملیات‌های مهم" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">زمان انقضا جلسه (دقیقه)</label>
                <input type="number" {...register('sessionTimeout', { valueAsNumber: true })} className="input-field w-full" min={10} />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">انقضا JWT (ساعت)</label>
                <input type="number" {...register('jwtExpireHours', { valueAsNumber: true })} className="input-field w-full" min={1} />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">انقضا Refresh Token (روز)</label>
                <input type="number" {...register('refreshTokenExpireDays', { valueAsNumber: true })} className="input-field w-full" min={1} />
              </div>
            </div>
          </div>
        </div>

        {/* Login Protection */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-semibold mb-5">محافظت در برابر ورود ناموفق</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">حداکثر تلاش‌های ناموفق</label>
              <input type="number" {...register('maxLoginAttempts', { valueAsNumber: true })} className="input-field w-full" min={3} max={20} />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">مدت قفل شدن حساب (دقیقه)</label>
              <input type="number" {...register('lockoutDuration', { valueAsNumber: true })} className="input-field w-full" min={5} />
            </div>
          </div>
        </div>

        {/* Password Policy */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-semibold mb-5">سیاست رمز عبور</h3>
          <div className="mb-4">
            <label className="block text-sm text-slate-400 mb-1">حداقل طول رمز عبور</label>
            <input type="number" {...register('passwordMinLength', { valueAsNumber: true })} className="input-field w-48" min={6} max={32} />
          </div>
          <div className="space-y-3">
            <Toggle field="passwordRequireUppercase" label="حرف بزرگ انگلیسی اجباری" desc="حداقل یک حرف بزرگ" />
            <Toggle field="passwordRequireNumbers" label="عدد اجباری" desc="حداقل یک عدد" />
            <Toggle field="passwordRequireSpecial" label="کاراکتر خاص اجباری" desc="مثل !@#$%^&*" />
          </div>
        </div>

        {/* IP Whitelist */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-white font-semibold">لیست سفید IP</h3>
            <button
              type="button"
              onClick={() => setValue('ipWhitelistEnabled', !boolFields.ipWhitelistEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${boolFields.ipWhitelistEnabled ? 'bg-green-500' : 'bg-slate-600'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${boolFields.ipWhitelistEnabled ? 'translate-x-1' : 'translate-x-6'}`} />
            </button>
          </div>
          {boolFields.ipWhitelistEnabled && (
            <div>
              <label className="block text-sm text-slate-400 mb-1">آدرس‌های IP مجاز (هر خط یک IP)</label>
              <textarea {...register('ipWhitelist')} rows={4} className="input-field w-full resize-none font-mono text-sm" placeholder="192.168.1.1&#10;10.0.0.0/24" />
            </div>
          )}
        </div>

        {/* Audit */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-semibold mb-5">لاگ‌گیری و ممیزی</h3>
          <Toggle field="auditLogEnabled" label="لاگ ممیزی فعال" desc="ثبت تمام اقدامات ادمین‌ها" />
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
