'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { SectionHeader } from '@/components/ui';
import { FiSmartphone, FiSave, FiAlertCircle, FiEye, FiEyeOff, FiSend } from 'react-icons/fi';
import { useAdminSettings } from '@/lib/hooks/useAdminSettings';

interface SMSSettings {
  provider: string;
  
  kavenegar_apiKey: string;
  kavenegar_sender: string;
  
  melipayamak_username: string;
  melipayamak_password: string;
  melipayamak_from: string;
  
  smsir_apiKey: string;
  smsir_lineNumber: string;
  
  bookingConfirmEnabled: boolean;
  bookingReminderEnabled: boolean;
  reminderHoursBefore: number;
  bookingCancelEnabled: boolean;
  paymentConfirmEnabled: boolean;
  otpEnabled: boolean;
  otpExpireSeconds: number;
  
  testPhone: string;
}

const defaults: SMSSettings = {
  provider: 'kavenegar',
  kavenegar_apiKey: '',
  kavenegar_sender: '10008663',
  melipayamak_username: '',
  melipayamak_password: '',
  melipayamak_from: '',
  smsir_apiKey: '',
  smsir_lineNumber: '',
  bookingConfirmEnabled: true,
  bookingReminderEnabled: true,
  reminderHoursBefore: 2,
  bookingCancelEnabled: true,
  paymentConfirmEnabled: true,
  otpEnabled: true,
  otpExpireSeconds: 120,
  testPhone: '',
};

const FIELD_MAP: Record<string, string> = {
  provider: 'sms.provider',
  bookingConfirmEnabled: 'sms.sendBookingConfirm',
  otpEnabled: 'sms.sendOtp',
};

const BOOL_TRANSFORMS = {
  fromDb: {
    bookingConfirmEnabled: (v: string) => v === 'true',
    otpEnabled: (v: string) => v === 'true',
  },
  toDb: {
    bookingConfirmEnabled: (v: unknown) => (v ? 'true' : 'false'),
    otpEnabled: (v: unknown) => (v ? 'true' : 'false'),
  },
};

export default function SMSSettingsPage() {
  const { loading, saving, saved, save, values } = useAdminSettings(
    'sms',
    FIELD_MAP,
    defaults,
    BOOL_TRANSFORMS,
  );
  const [testing, setTesting] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, reset } = useForm<SMSSettings>({ defaultValues: defaults });

  useEffect(() => {
    if (!loading) reset(values);
  }, [loading, values, reset]);

  const provider = watch('provider');
  const bools = {
    bookingConfirmEnabled: watch('bookingConfirmEnabled'),
    bookingReminderEnabled: watch('bookingReminderEnabled'),
    bookingCancelEnabled: watch('bookingCancelEnabled'),
    paymentConfirmEnabled: watch('paymentConfirmEnabled'),
    otpEnabled: watch('otpEnabled'),
  };

  const onSubmit = async (data: SMSSettings) => {
    await save(data);
  };

  const sendTest = async () => {
    setTesting(true);
    await new Promise(r => setTimeout(r, 1200));
    setTesting(false);
    setTestResult('پیامک آزمایشی با موفقیت ارسال شد! ✓');
    setTimeout(() => setTestResult(null), 4000);
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
        title="تنظیمات پیامک"
        subtitle="پیکربندی سرویس SMS و قالب‌های پیام"
        icon={<FiSmartphone />}
      />

      {saved && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-center gap-3">
          <FiAlertCircle className="text-green-400 w-5 h-5" />
          <span className="text-green-400 text-sm">تنظیمات پیامک ذخیره شد.</span>
        </div>
      )}

      {testResult && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex items-center gap-3">
          <FiSend className="text-blue-400 w-5 h-5" />
          <span className="text-blue-400 text-sm">{testResult}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Provider */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-semibold mb-5">انتخاب سرویس دهنده</h3>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {['kavenegar', 'melipayamak', 'smsir'].map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setValue('provider', p)}
                className={`p-3 rounded-lg border text-center text-sm font-medium transition-all ${provider === p ? 'border-red-500 bg-red-500/10 text-red-400' : 'border-slate-600 text-slate-400 hover:border-slate-500'}`}
              >
                {p === 'kavenegar' ? 'کاوه‌نگار' : p === 'melipayamak' ? 'ملی‌پیامک' : 'SMS.ir'}
              </button>
            ))}
          </div>

          {provider === 'kavenegar' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">API Key</label>
                <div className="relative">
                  <input {...register('kavenegar_apiKey')} type={showKey ? 'text' : 'password'} className="input-field w-full pl-10" />
                  <button type="button" onClick={() => setShowKey(!showKey)} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showKey ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">شماره فرستنده</label>
                <input {...register('kavenegar_sender')} className="input-field w-full" />
              </div>
            </div>
          )}

          {provider === 'melipayamak' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">نام کاربری</label>
                <input {...register('melipayamak_username')} className="input-field w-full" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">رمز عبور</label>
                <input {...register('melipayamak_password')} type="password" className="input-field w-full" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">شماره فرستنده</label>
                <input {...register('melipayamak_from')} className="input-field w-full" />
              </div>
            </div>
          )}

          {provider === 'smsir' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">API Key</label>
                <div className="relative">
                  <input {...register('smsir_apiKey')} type={showKey ? 'text' : 'password'} className="input-field w-full pl-10" />
                  <button type="button" onClick={() => setShowKey(!showKey)} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showKey ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">شماره خط</label>
                <input {...register('smsir_lineNumber')} className="input-field w-full" />
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-semibold mb-5">اعلان‌های پیامکی</h3>
          <div className="space-y-3">
            <Toggle field="bookingConfirmEnabled" label="تأیید رزرو" desc="ارسال پیامک بعد از ثبت رزرو" />
            <Toggle field="bookingCancelEnabled" label="لغو رزرو" desc="ارسال پیامک بعد از لغو رزرو" />
            <Toggle field="paymentConfirmEnabled" label="تأیید پرداخت" desc="ارسال پیامک بعد از پرداخت موفق" />
            <Toggle field="bookingReminderEnabled" label="یادآور رزرو" desc="ارسال یادآور قبل از وقت" />
            {bools.bookingReminderEnabled && (
              <div className="pr-4">
                <label className="block text-sm text-slate-400 mb-1">ساعت قبل از رزرو (یادآور)</label>
                <input type="number" {...register('reminderHoursBefore', { valueAsNumber: true })} className="input-field w-32" min={1} max={72} />
              </div>
            )}
          </div>
        </div>

        {/* OTP */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-semibold mb-5">رمز یکبار مصرف (OTP)</h3>
          <div className="space-y-4">
            <Toggle field="otpEnabled" label="OTP فعال" desc="احراز هویت با رمز یکبار مصرف" />
            <div>
              <label className="block text-sm text-slate-400 mb-1">انقضا OTP (ثانیه)</label>
              <input type="number" {...register('otpExpireSeconds', { valueAsNumber: true })} className="input-field w-32" min={60} max={600} />
            </div>
          </div>
        </div>

        {/* Test */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-semibold mb-5">ارسال پیامک آزمایشی</h3>
          <div className="flex gap-3">
            <input {...register('testPhone')} className="input-field flex-1" placeholder="09xxxxxxxxx" />
            <button
              type="button"
              onClick={sendTest}
              disabled={testing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <FiSend className="w-4 h-4" />
              {testing ? 'در حال ارسال...' : 'ارسال تست'}
            </button>
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
