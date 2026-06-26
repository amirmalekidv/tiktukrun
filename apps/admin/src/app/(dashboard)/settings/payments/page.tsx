'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { SectionHeader } from '@/components/ui';
import { FiCreditCard, FiSave, FiAlertCircle, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAdminSettings } from '@/lib/hooks/useAdminSettings';

interface PaymentsSettings {
  zarinpalEnabled: boolean;
  zarinpalMerchant: string;
  zarinpalSandbox: boolean;
  
  idpayEnabled: boolean;
  idpayApiKey: string;
  idpayWebsitePaths: string;
  
  nextpayEnabled: boolean;
  nextpayToken: string;
  
  paystarEnabled: boolean;
  paystarId: string;
  paystarKey: string;
  
  defaultGateway: string;
  callbackUrl: string;
  cancelUrl: string;
  
  paymentExpireMinutes: number;
  maxPaymentRetries: number;
}

const defaults: PaymentsSettings = {
  zarinpalEnabled: true,
  zarinpalMerchant: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  zarinpalSandbox: true,
  
  idpayEnabled: false,
  idpayApiKey: '',
  idpayWebsitePaths: '',
  
  nextpayEnabled: false,
  nextpayToken: '',
  
  paystarEnabled: false,
  paystarId: '',
  paystarKey: '',
  
  defaultGateway: 'zarinpal',
  callbackUrl: 'https://tiktakrun.ir/payment/verify',
  cancelUrl: 'https://tiktakrun.ir/payment/cancel',
  
  paymentExpireMinutes: 30,
  maxPaymentRetries: 3,
};

const FIELD_MAP: Record<string, string> = {
  defaultGateway: 'payments.gateway',
  zarinpalSandbox: 'payments.sandboxMode',
};

const BOOL_TRANSFORMS = {
  fromDb: {
    zarinpalSandbox: (v: string) => v === 'true',
  },
  toDb: {
    zarinpalSandbox: (v: unknown) => (v ? 'true' : 'false'),
  },
};

export default function PaymentsSettingsPage() {
  const { loading, saving, saved, save, values } = useAdminSettings(
    'payments',
    FIELD_MAP,
    defaults,
    BOOL_TRANSFORMS,
  );
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const { register, handleSubmit, watch, setValue, reset } = useForm<PaymentsSettings>({ defaultValues: defaults });

  useEffect(() => {
    if (!loading) reset(values);
  }, [loading, values, reset]);

  const bools = {
    zarinpalEnabled: watch('zarinpalEnabled'),
    zarinpalSandbox: watch('zarinpalSandbox'),
    idpayEnabled: watch('idpayEnabled'),
    nextpayEnabled: watch('nextpayEnabled'),
    paystarEnabled: watch('paystarEnabled'),
  };

  const onSubmit = async (data: PaymentsSettings) => {
    await save(data);
  };

  const Toggle = ({ field, label }: { field: keyof typeof bools; label: string }) => (
    <button
      type="button"
      onClick={() => setValue(field, !bools[field])}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${bools[field] ? 'bg-green-500' : 'bg-slate-600'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${bools[field] ? 'translate-x-1' : 'translate-x-6'}`} />
    </button>
  );

  const SecretInput = ({ name, label }: { name: string; label: string }) => (
    <div>
      <label className="block text-sm text-slate-400 mb-1">{label}</label>
      <div className="relative">
        <input
          {...register(name as any)}
          type={showKeys[name] ? 'text' : 'password'}
          className="input-field w-full pl-10"
        />
        <button
          type="button"
          onClick={() => setShowKeys(p => ({ ...p, [name]: !p[name] }))}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        >
          {showKeys[name] ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <SectionHeader
        title="تنظیمات درگاه‌های پرداخت"
        subtitle="پیکربندی ZarinPal، IDPay، NextPay و PayStar"
        icon={<FiCreditCard />}
      />

      {saved && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-center gap-3">
          <FiAlertCircle className="text-green-400 w-5 h-5" />
          <span className="text-green-400 text-sm">تنظیمات درگاه پرداخت ذخیره شد.</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* General */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-semibold mb-5">تنظیمات عمومی</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">درگاه پیش‌فرض</label>
              <select {...register('defaultGateway')} className="input-field w-full">
                <option value="zarinpal">زرین‌پال</option>
                <option value="idpay">IDPay</option>
                <option value="nextpay">NextPay</option>
                <option value="paystar">PayStar</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">انقضا پرداخت (دقیقه)</label>
              <input type="number" {...register('paymentExpireMinutes', { valueAsNumber: true })} className="input-field w-full" min={5} max={120} />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">حداکثر تلاش مجدد</label>
              <input type="number" {...register('maxPaymentRetries', { valueAsNumber: true })} className="input-field w-full" min={1} max={10} />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm text-slate-400 mb-1">آدرس Callback</label>
              <input {...register('callbackUrl')} className="input-field w-full" />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm text-slate-400 mb-1">آدرس لغو پرداخت</label>
              <input {...register('cancelUrl')} className="input-field w-full" />
            </div>
          </div>
        </div>

        {/* ZarinPal */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center text-xs font-bold text-black">Z</div>
              <h3 className="text-white font-semibold">زرین‌پال</h3>
            </div>
            <Toggle field="zarinpalEnabled" label="" />
          </div>
          {bools.zarinpalEnabled && (
            <div className="space-y-4">
              <SecretInput name="zarinpalMerchant" label="Merchant ID" />
              <div className="flex items-center justify-between p-4 bg-slate-750 rounded-lg border border-slate-600">
                <div>
                  <p className="text-white font-medium">حالت آزمایشی (Sandbox)</p>
                  <p className="text-slate-400 text-sm">برای تست بدون پرداخت واقعی</p>
                </div>
                <Toggle field="zarinpalSandbox" label="" />
              </div>
            </div>
          )}
        </div>

        {/* IDPay */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-xs font-bold text-white">ID</div>
              <h3 className="text-white font-semibold">IDPay</h3>
            </div>
            <Toggle field="idpayEnabled" label="" />
          </div>
          {bools.idpayEnabled && (
            <div className="space-y-4">
              <SecretInput name="idpayApiKey" label="API Key" />
              <div>
                <label className="block text-sm text-slate-400 mb-1">مسیر وب‌سایت</label>
                <input {...register('idpayWebsitePaths')} className="input-field w-full" />
              </div>
            </div>
          )}
        </div>

        {/* NextPay */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-xs font-bold text-white">NP</div>
              <h3 className="text-white font-semibold">NextPay</h3>
            </div>
            <Toggle field="nextpayEnabled" label="" />
          </div>
          {bools.nextpayEnabled && (
            <SecretInput name="nextpayToken" label="API Token" />
          )}
        </div>

        {/* PayStar */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center text-xs font-bold text-white">PS</div>
              <h3 className="text-white font-semibold">PayStar</h3>
            </div>
            <Toggle field="paystarEnabled" label="" />
          </div>
          {bools.paystarEnabled && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">شناسه فروشگاه</label>
                <input {...register('paystarId')} className="input-field w-full" />
              </div>
              <SecretInput name="paystarKey" label="کلید مخفی" />
            </div>
          )}
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
