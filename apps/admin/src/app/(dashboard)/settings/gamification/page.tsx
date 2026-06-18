'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { SectionHeader } from '@/components/ui';
import { FiAward, FiSave, FiAlertCircle, FiStar, FiGift } from 'react-icons/fi';

interface GamificationSettings {
  xpEnabled: boolean;
  levelEnabled: boolean;
  badgeEnabled: boolean;
  wheelEnabled: boolean;
  monthlyEnabled: boolean;
  leaderboardEnabled: boolean;
  
  xpPerBooking: number;
  xpPerReview: number;
  xpPerReferral: number;
  xpPerDayLogin: number;
  
  wheelSpinsPerMonth: number;
  wheelSpinCostXP: number;
  
  streakEnabled: boolean;
  streakBonusXP: number;
  
  referralBonusXP: number;
  referralBonusToman: number;
  
  leaderboardResetDay: number;
  showPublicLeaderboard: boolean;
}

const defaults: GamificationSettings = {
  xpEnabled: true,
  levelEnabled: true,
  badgeEnabled: true,
  wheelEnabled: true,
  monthlyEnabled: true,
  leaderboardEnabled: true,
  
  xpPerBooking: 100,
  xpPerReview: 50,
  xpPerReferral: 200,
  xpPerDayLogin: 10,
  
  wheelSpinsPerMonth: 2,
  wheelSpinCostXP: 0,
  
  streakEnabled: true,
  streakBonusXP: 20,
  
  referralBonusXP: 200,
  referralBonusToman: 50000,
  
  leaderboardResetDay: 1,
  showPublicLeaderboard: false,
};

export default function GamificationSettingsPage() {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, setValue } = useForm<GamificationSettings>({ defaultValues: defaults });

  const bools = {
    xpEnabled: watch('xpEnabled'),
    levelEnabled: watch('levelEnabled'),
    badgeEnabled: watch('badgeEnabled'),
    wheelEnabled: watch('wheelEnabled'),
    monthlyEnabled: watch('monthlyEnabled'),
    leaderboardEnabled: watch('leaderboardEnabled'),
    streakEnabled: watch('streakEnabled'),
    showPublicLeaderboard: watch('showPublicLeaderboard'),
  };

  const onSubmit = async (data: GamificationSettings) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
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
        title="تنظیمات گیمیفیکیشن"
        subtitle="پیکربندی سیستم XP، سطوح، نشان‌ها و چرخ شانس"
        icon={<FiAward />}
      />

      {saved && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-center gap-3">
          <FiAlertCircle className="text-green-400 w-5 h-5" />
          <span className="text-green-400 text-sm">تنظیمات گیمیفیکیشن ذخیره شد.</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Feature Toggles */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
            <FiStar className="text-red-400" />
            قابلیت‌های گیمیفیکیشن
          </h3>
          <div className="space-y-3">
            <Toggle field="xpEnabled" label="سیستم XP" desc="امتیاز تجربه برای فعالیت‌های کاربران" />
            <Toggle field="levelEnabled" label="سیستم سطح" desc="ارتقاء سطح بر اساس XP" />
            <Toggle field="badgeEnabled" label="نشان‌ها (Badge)" desc="اعطای نشان‌های ویژه" />
            <Toggle field="wheelEnabled" label="چرخ شانس" desc="قرعه‌کشی روزانه/ماهانه" />
            <Toggle field="monthlyEnabled" label="برنامه ماهانه" desc="جوایز برترین کاربران ماه" />
            <Toggle field="leaderboardEnabled" label="جدول برترین‌ها" desc="لیدربورد عمومی" />
          </div>
        </div>

        {/* XP Rules */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-semibold mb-5">قوانین کسب XP</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">XP هر رزرو</label>
              <input type="number" {...register('xpPerBooking', { valueAsNumber: true })} className="input-field w-full" min={0} />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">XP هر نظر</label>
              <input type="number" {...register('xpPerReview', { valueAsNumber: true })} className="input-field w-full" min={0} />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">XP معرفی دوست</label>
              <input type="number" {...register('xpPerReferral', { valueAsNumber: true })} className="input-field w-full" min={0} />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">XP ورود روزانه</label>
              <input type="number" {...register('xpPerDayLogin', { valueAsNumber: true })} className="input-field w-full" min={0} />
            </div>
          </div>
        </div>

        {/* Streak */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-white font-semibold">پشت سر هم (Streak)</h3>
            <button
              type="button"
              onClick={() => setValue('streakEnabled', !bools.streakEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${bools.streakEnabled ? 'bg-green-500' : 'bg-slate-600'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${bools.streakEnabled ? 'translate-x-1' : 'translate-x-6'}`} />
            </button>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">XP جایزه هر روز پشت سر هم</label>
            <input type="number" {...register('streakBonusXP', { valueAsNumber: true })} className="input-field w-48" min={0} />
          </div>
        </div>

        {/* Wheel Settings */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
            <FiGift className="text-red-400" />
            چرخ شانس
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">تعداد چرخش ماهانه رایگان</label>
              <input type="number" {...register('wheelSpinsPerMonth', { valueAsNumber: true })} className="input-field w-full" min={0} max={10} />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">هزینه XP هر چرخش اضافی</label>
              <input type="number" {...register('wheelSpinCostXP', { valueAsNumber: true })} className="input-field w-full" min={0} />
              <p className="text-slate-500 text-xs mt-1">۰ = رایگان</p>
            </div>
          </div>
        </div>

        {/* Referral */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-semibold mb-5">برنامه معرف</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">جایزه XP معرف</label>
              <input type="number" {...register('referralBonusXP', { valueAsNumber: true })} className="input-field w-full" min={0} />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">جایزه تومانی معرف</label>
              <input type="number" {...register('referralBonusToman', { valueAsNumber: true })} className="input-field w-full" min={0} />
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-semibold mb-5">جدول برترین‌ها</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">روز ریست ماهانه</label>
              <input type="number" {...register('leaderboardResetDay', { valueAsNumber: true })} className="input-field w-full" min={1} max={28} />
            </div>
          </div>
          <Toggle field="showPublicLeaderboard" label="لیدربورد عمومی" desc="نمایش جدول برترین‌ها برای همه کاربران" />
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
