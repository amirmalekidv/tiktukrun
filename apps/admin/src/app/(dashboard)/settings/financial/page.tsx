'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { SectionHeader } from '@/components/ui';
import { FiDollarSign, FiSave, FiAlertCircle, FiPercent } from 'react-icons/fi';
import { useAdminSettings } from '@/lib/hooks/useAdminSettings';

interface FinancialSettings {
  currency: string;
  vatPercent: number;
  platformFeePercent: number;
  minWithdrawal: number;
  maxWithdrawal: number;
  withdrawalDays: string;
  autoRefundDays: number;
  walletEnabled: boolean;
  giftCardEnabled: boolean;
  invoicePrefix: string;
  invoiceStartNumber: number;
}

const defaults: FinancialSettings = {
  currency: 'IRR',
  vatPercent: 9,
  platformFeePercent: 10,
  minWithdrawal: 500000,
  maxWithdrawal: 50000000,
  withdrawalDays: '1,2,3,4,5',
  autoRefundDays: 7,
  walletEnabled: true,
  giftCardEnabled: true,
  invoicePrefix: 'TTR',
  invoiceStartNumber: 10000,
};

const FIELD_MAP: Record<string, string> = {
  currency: 'public.currency',
  minWithdrawal: 'financial.minTopup',
  maxWithdrawal: 'financial.maxTopup',
  autoRefundDays: 'financial.refundWindowHours',
  vatPercent: 'financial.vatPercent',
  platformFeePercent: 'financial.platformFeePercent',
};

const TRANSFORMS = {
  fromDb: {
    autoRefundDays: (v: string, d: FinancialSettings) => {
      const hours = Number(v);
      return Number.isFinite(hours) ? Math.round(hours / 24) : d.autoRefundDays;
    },
  },
  toDb: {
    autoRefundDays: (v: unknown) => String(Number(v) * 24),
  },
};

export default function FinancialSettingsPage() {
  const { loading, saving, saved, save, values } = useAdminSettings(
    'financial',
    FIELD_MAP,
    defaults,
    TRANSFORMS,
  );

  const { register, handleSubmit, watch, setValue, reset } = useForm<FinancialSettings>({ defaultValues: defaults });

  useEffect(() => {
    if (!loading) reset(values);
  }, [loading, values, reset]);

  const walletEnabled = watch('walletEnabled');
  const giftCardEnabled = watch('giftCardEnabled');

  const onSubmit = async (data: FinancialSettings) => {
    await save(data);
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="تنظیمات مالی"
        subtitle="پیکربندی درگاه‌های پرداخت، کیف‌پول و قوانین مالی"
        icon={<FiDollarSign />}
      />

      {saved && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-center gap-3">
          <FiAlertCircle className="text-green-400 w-5 h-5" />
          <span className="text-green-400 text-sm">تنظیمات مالی ذخیره شد.</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Tax & Fees */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
            <FiPercent className="text-red-400" />
            مالیات و کارمزد
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">ارز پایه</label>
              <select {...register('currency')} className="input-field w-full">
                <option value="IRR">ریال ایران (IRR)</option>
                <option value="IRT">تومان (IRT)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">درصد مالیات بر ارزش افزوده (%)</label>
              <input type="number" {...register('vatPercent', { valueAsNumber: true })} className="input-field w-full" min={0} max={50} />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">کارمزد پلتفرم (%)</label>
              <input type="number" {...register('platformFeePercent', { valueAsNumber: true })} className="input-field w-full" min={0} max={50} />
            </div>
          </div>
        </div>

        {/* Withdrawal */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-semibold mb-5">تنظیمات برداشت</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">حداقل مبلغ برداشت (تومان)</label>
              <input type="number" {...register('minWithdrawal', { valueAsNumber: true })} className="input-field w-full" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">حداکثر مبلغ برداشت (تومان)</label>
              <input type="number" {...register('maxWithdrawal', { valueAsNumber: true })} className="input-field w-full" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">روزهای مجاز برداشت (1=شنبه ... 7=جمعه)</label>
              <input {...register('withdrawalDays')} className="input-field w-full" placeholder="1,2,3,4,5" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">مهلت استرداد خودکار (روز)</label>
              <input type="number" {...register('autoRefundDays', { valueAsNumber: true })} className="input-field w-full" min={1} max={30} />
            </div>
          </div>
        </div>

        {/* Invoice */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-semibold mb-5">شماره‌گذاری فاکتور</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">پیشوند فاکتور</label>
              <input {...register('invoicePrefix')} className="input-field w-full" placeholder="TTR" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">شماره شروع</label>
              <input type="number" {...register('invoiceStartNumber', { valueAsNumber: true })} className="input-field w-full" />
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-semibold mb-5">قابلیت‌های مالی</h3>
          <div className="space-y-4">
            {[
              { key: 'walletEnabled', label: 'کیف پول کاربران', desc: 'امکان شارژ و استفاده از کیف پول', val: walletEnabled },
              { key: 'giftCardEnabled', label: 'گیفت کارت', desc: 'امکان خرید و استفاده از گیفت کارت', val: giftCardEnabled },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between p-4 bg-slate-750 rounded-lg border border-slate-600">
                <div>
                  <p className="text-white font-medium">{item.label}</p>
                  <p className="text-slate-400 text-sm">{item.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setValue(item.key as any, !item.val)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${item.val ? 'bg-green-500' : 'bg-slate-600'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${item.val ? 'translate-x-1' : 'translate-x-6'}`} />
                </button>
              </div>
            ))}
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
