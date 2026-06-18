'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SectionHeader, LoadingSpinner } from '@/components/ui';
import { bookingsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Loader2, User, Gamepad2, Calendar, CreditCard } from 'lucide-react';

const schema = z.object({
  mobile: z.string().min(11, 'شماره موبایل معتبر نیست').max(11),
  gameId: z.string().min(1, 'بازی را انتخاب کنید'),
  branchId: z.string().min(1, 'شعبه را انتخاب کنید'),
  slotDate: z.string().min(1, 'تاریخ را وارد کنید'),
  slotTime: z.string().min(1, 'ساعت را وارد کنید'),
  playersCount: z.number().min(1).max(20),
  paymentMethod: z.enum(['WALLET', 'ZARINPAL', 'CASH', 'MIXED']),
  notes: z.string().optional(),
  discountCode: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const MOCK_GAMES = [
  { id: 'g1', title: 'اتاق فرار تاریک', pricePerPerson: 250000 },
  { id: 'g2', title: 'لیزرتگ پرو', pricePerPerson: 200000 },
  { id: 'g3', title: 'VR ماجرا', pricePerPerson: 300000 },
];

const MOCK_SLOTS = ['۱۴:۰۰', '۱۶:۰۰', '۱۸:۰۰', '۲۰:۰۰'];

export default function NewBookingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedGame, setSelectedGame] = useState<typeof MOCK_GAMES[0] | null>(null);
  const [playersCount, setPlayersCount] = useState(2);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { playersCount: 2, paymentMethod: 'CASH' },
  });

  const gameId = watch('gameId');
  const total = selectedGame ? selectedGame.pricePerPerson * playersCount : 0;

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      // Real: await bookingsApi.create(data)
      await new Promise(r => setTimeout(r, 1500));
      toast.success('رزرو با موفقیت ثبت شد');
      router.push('/bookings');
    } catch {
      toast.error('خطا در ثبت رزرو');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <SectionHeader
        title="رزرو دستی"
        subtitle="ثبت رزرو توسط پشتیبانی برای مشتری"
        breadcrumb={[{ label: 'رزروها', href: '/bookings' }, { label: 'رزرو جدید' }]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
        {/* Customer */}
        <div className="admin-card">
          <h3 className="section-title flex items-center gap-2">
            <User className="w-5 h-5 text-red-400" />
            اطلاعات مشتری
          </h3>
          <div>
            <label className="label-field">شماره موبایل *</label>
            <input
              type="text"
              {...register('mobile')}
              className="input-field"
              placeholder="۰۹۱۲۱۲۳۴۵۶۷"
              dir="ltr"
            />
            {errors.mobile && <p className="text-red-400 text-xs mt-1">{errors.mobile.message}</p>}
            <p className="text-slate-500 text-xs mt-1">کاربر با این شماره جستجو می‌شود یا اکانت جدید ساخته می‌شود</p>
          </div>
        </div>

        {/* Game & Branch */}
        <div className="admin-card">
          <h3 className="section-title flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-red-400" />
            بازی و شعبه
          </h3>
          <div className="space-y-4">
            <div>
              <label className="label-field">بازی *</label>
              <select
                {...register('gameId')}
                className="select-field"
                onChange={e => {
                  register('gameId').onChange(e);
                  setSelectedGame(MOCK_GAMES.find(g => g.id === e.target.value) || null);
                }}
              >
                <option value="">انتخاب بازی...</option>
                {MOCK_GAMES.map(g => (
                  <option key={g.id} value={g.id}>{g.title} — {g.pricePerPerson.toLocaleString('fa-IR')} تومان/نفر</option>
                ))}
              </select>
              {errors.gameId && <p className="text-red-400 text-xs mt-1">{errors.gameId.message}</p>}
            </div>

            <div>
              <label className="label-field">شعبه *</label>
              <select {...register('branchId')} className="select-field">
                <option value="">انتخاب شعبه...</option>
                <option value="br1">شعبه تهران</option>
                <option value="br2">شعبه مشهد</option>
              </select>
            </div>

            <div>
              <label className="label-field">تعداد بازیکنان *</label>
              <input
                type="number"
                min={1}
                max={20}
                value={playersCount}
                onChange={e => {
                  const v = parseInt(e.target.value);
                  setPlayersCount(v);
                  setValue('playersCount', v);
                }}
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Date & Time */}
        <div className="admin-card">
          <h3 className="section-title flex items-center gap-2">
            <Calendar className="w-5 h-5 text-red-400" />
            تاریخ و ساعت
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">تاریخ (شمسی) *</label>
              <input
                type="date"
                {...register('slotDate')}
                className="input-field"
              />
              {errors.slotDate && <p className="text-red-400 text-xs mt-1">{errors.slotDate.message}</p>}
            </div>
            <div>
              <label className="label-field">ساعت *</label>
              <select {...register('slotTime')} className="select-field">
                <option value="">انتخاب ساعت...</option>
                {MOCK_SLOTS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Payment */}
        <div className="admin-card">
          <h3 className="section-title flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-red-400" />
            پرداخت
          </h3>
          <div className="space-y-4">
            <div>
              <label className="label-field">روش پرداخت</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'CASH', label: 'نقد (حضوری)' },
                  { value: 'WALLET', label: 'کیف پول کاربر' },
                  { value: 'ZARINPAL', label: 'زرین‌پال' },
                  { value: 'MIXED', label: 'ترکیبی' },
                ].map(m => (
                  <label key={m.value} className="flex items-center gap-2 p-3 rounded-xl border border-slate-700 hover:border-slate-600 cursor-pointer">
                    <input
                      type="radio"
                      value={m.value}
                      {...register('paymentMethod')}
                      className="accent-red-600"
                    />
                    <span className="text-slate-300 text-sm">{m.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="label-field">کد تخفیف (اختیاری)</label>
              <input type="text" {...register('discountCode')} className="input-field" placeholder="کد تخفیف..." />
            </div>

            {selectedGame && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                <div className="flex justify-between items-center">
                  <span className="text-green-400 font-bold">مبلغ کل تخمینی</span>
                  <span className="text-white font-black text-xl">{total.toLocaleString('fa-IR')} تومان</span>
                </div>
                <p className="text-slate-400 text-xs mt-1">{playersCount} نفر × {selectedGame.pricePerPerson.toLocaleString('fa-IR')} تومان</p>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="admin-card">
          <label className="label-field">یادداشت (اختیاری)</label>
          <textarea
            {...register('notes')}
            className="input-field resize-none h-20"
            placeholder="هرگونه توضیح خاصی برای این رزرو..."
          />
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            ثبت رزرو
          </button>
          <button type="button" onClick={() => router.back()} className="btn-secondary">
            انصراف
          </button>
        </div>
      </form>
    </div>
  );
}
