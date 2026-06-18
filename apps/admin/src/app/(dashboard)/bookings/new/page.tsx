'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, User, Loader2, CalendarPlus, ArrowRight } from 'lucide-react';
import { SectionHeader } from '@/components/ui';
import { bookingsApi, gamesApi, adminCustomersApi } from '@/lib/api';
import { persianNum } from '@/lib/utils/format';
import toast from 'react-hot-toast';

interface CustomerLite { id: string; fullName?: string; mobile?: string }
interface GameLite { id: string; title: string; pricePerPerson?: number }

function readList<T>(res: any): T[] {
  const body = res?.data;
  if (Array.isArray(body?.data)) return body.data as T[];
  if (Array.isArray(body)) return body as T[];
  if (Array.isArray(body?.data?.data)) return body.data.data as T[];
  return [];
}

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'نقدی (حضوری)' },
  { value: 'BANK_TRANSFER', label: 'کارت‌به‌کارت / انتقال بانکی' },
  { value: 'WALLET', label: 'کیف پول' },
  { value: 'ZARINPAL', label: 'زرین‌پال' },
] as const;

export default function NewBookingPage() {
  const router = useRouter();

  // customer search
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CustomerLite[]>([]);
  const [searching, setSearching] = useState(false);
  const [customer, setCustomer] = useState<CustomerLite | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // games
  const [games, setGames] = useState<GameLite[]>([]);
  const [gameId, setGameId] = useState('');

  // form
  const [slotDateTime, setSlotDateTime] = useState('');
  const [playersCount, setPlayersCount] = useState(2);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER' | 'WALLET' | 'ZARINPAL'>('CASH');
  const [totalAmount, setTotalAmount] = useState<string>('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // load games once
  useEffect(() => {
    gamesApi
      .getAll({ limit: 200 })
      .then((res) => setGames(readList<GameLite>(res)))
      .catch(() => setGames([]));
  }, []);

  // debounced customer search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query || query.length < 2 || customer) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await adminCustomersApi.search(query, 8);
        setResults(readList<CustomerLite>(res));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, customer]);

  const selectedGame = games.find((g) => g.id === gameId);
  const computedTotal =
    selectedGame?.pricePerPerson != null ? selectedGame.pricePerPerson * playersCount : null;

  const handleSubmit = useCallback(async () => {
    if (!customer) return toast.error('یک مشتری انتخاب کنید');
    if (!gameId) return toast.error('یک بازی انتخاب کنید');
    if (!slotDateTime) return toast.error('تاریخ و ساعت را وارد کنید');

    setSubmitting(true);
    try {
      await bookingsApi.create({
        userId: customer.id,
        gameId,
        slotDateTime: new Date(slotDateTime).toISOString(),
        playersCount,
        paymentMethod,
        totalAmount: totalAmount ? Number(totalAmount) : undefined,
        note: note || undefined,
      });
      toast.success('رزرو دستی با موفقیت ثبت شد');
      router.push('/bookings');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'خطا در ثبت رزرو');
    } finally {
      setSubmitting(false);
    }
  }, [customer, gameId, slotDateTime, playersCount, paymentMethod, totalAmount, note, router]);

  return (
    <div className="fade-in">
      <SectionHeader
        title="رزرو دستی"
        subtitle="ثبت رزرو حضوری/تلفنی به‌جای مشتری"
        breadcrumb={[{ label: 'رزروها', href: '/bookings' }, { label: 'رزرو جدید' }]}
      />

      <div className="admin-card max-w-2xl space-y-5">
        {/* Customer picker */}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">مشتری</label>
          {customer ? (
            <div className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-red-400" />
                <div>
                  <p className="text-white font-medium">{customer.fullName || 'بدون نام'}</p>
                  <p className="text-slate-500 text-xs">{persianNum(customer.mobile || '')}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setCustomer(null);
                  setQuery('');
                }}
                className="text-xs text-red-400 hover:text-red-300"
              >
                تغییر
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="جستجو با نام یا شماره موبایل..."
                  className="admin-input w-full pr-10"
                />
                {searching && (
                  <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 animate-spin" />
                )}
              </div>
              {results.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                  {results.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setCustomer(c);
                        setResults([]);
                      }}
                      className="w-full text-right px-4 py-2.5 hover:bg-slate-700/50 flex items-center justify-between"
                    >
                      <span className="text-white text-sm">{c.fullName || 'بدون نام'}</span>
                      <span className="text-slate-500 text-xs">{persianNum(c.mobile || '')}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Game */}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">بازی</label>
          <select value={gameId} onChange={(e) => setGameId(e.target.value)} className="admin-input w-full">
            <option value="">انتخاب بازی...</option>
            {games.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
                {g.pricePerPerson != null ? ` — ${persianNum(g.pricePerPerson.toLocaleString())} تومان/نفر` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Slot + players */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">تاریخ و ساعت</label>
            <input
              type="datetime-local"
              value={slotDateTime}
              onChange={(e) => setSlotDateTime(e.target.value)}
              className="admin-input w-full"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">تعداد بازیکن</label>
            <input
              type="number"
              min={1}
              value={playersCount}
              onChange={(e) => setPlayersCount(Math.max(1, Number(e.target.value)))}
              className="admin-input w-full"
            />
          </div>
        </div>

        {/* Payment + amount */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">روش پرداخت</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              className="admin-input w-full"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">
              مبلغ کل (تومان){computedTotal != null ? ` — پیش‌فرض: ${persianNum(computedTotal.toLocaleString())}` : ''}
            </label>
            <input
              type="number"
              min={0}
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              placeholder={computedTotal != null ? String(computedTotal) : 'محاسبه خودکار'}
              className="admin-input w-full"
            />
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">یادداشت (اختیاری)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="admin-input w-full"
            placeholder="توضیحات رزرو..."
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex items-center gap-2">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarPlus className="w-4 h-4" />}
            ثبت رزرو
          </button>
          <button onClick={() => router.push('/bookings')} className="btn-secondary flex items-center gap-2">
            <ArrowRight className="w-4 h-4" />
            انصراف
          </button>
        </div>
      </div>
    </div>
  );
}
