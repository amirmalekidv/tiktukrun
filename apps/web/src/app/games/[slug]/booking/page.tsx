'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import useSWR from 'swr'
import toast from 'react-hot-toast'
import { getGameBySlug, getAvailability, validateDiscountCode, createBooking } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { formatToman, toPersianDigits } from '@/lib/utils'
import type { TimeSlot } from '@/types'

type Step = 1 | 2 | 3 | 4

function BookingContent({ params }: { params: { slug: string } }) {
  const { slug } = params
  const searchParams = useSearchParams()
  const router = useRouter()
  const { isAuthenticated, isLoading, hasHydrated, user, setUser } = useAuthStore()

  const [step, setStep] = useState<Step>(1)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [players, setPlayers] = useState(Number(searchParams.get('players') || 2))
  const [discountCode, setDiscountCode] = useState('')
  const [discountResult, setDiscountResult] = useState<{ valid: boolean; amount: number; message?: string } | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'WALLET' | 'ZARINPAL'>('ZARINPAL')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookingResult, setBookingResult] = useState<any>(null)

  const { data: game } = useSWR(slug ? `game-${slug}` : null, () => getGameBySlug(slug))
  const { data: availability } = useSWR(
    selectedDate && game ? `availability-${game.id}-${selectedDate}` : null,
    () => getAvailability(game!.id, selectedDate)
  )

  // Auth guard
  useEffect(() => {
    if (!hasHydrated || isLoading) return

    if (!isAuthenticated) {
      router.push(`/login?redirect=/games/${slug}/booking`)
    }
  }, [hasHydrated, isAuthenticated, isLoading, slug, router])

  const handleValidateDiscount = async () => {
    if (!discountCode || !game || !selectedSlot) return
    try {
      const result = await validateDiscountCode(
        discountCode,
        game.id,
        players,
        selectedSlot.slotDateTime ?? selectedSlot.id,
      )
      setDiscountResult({ valid: result.valid, amount: result.discountAmount, message: result.message })
      if (result.valid) {
        toast.success(result.message || 'کد تخفیف اعمال شد!')
      } else {
        toast.error(result.message || 'کد تخفیف نامعتبر است')
      }
    } catch (e: any) {
      toast.error(e.message || 'خطا در بررسی کد تخفیف')
    }
  }

  const handleSubmitBooking = async () => {
    if (!game || !selectedSlot) return
    setIsSubmitting(true)
    try {
      const result = await createBooking({
        gameId: game.id,
        slotDateTime: selectedSlot.slotDateTime ?? selectedSlot.id,
        playersCount: players,
        discountCode: discountResult?.valid ? discountCode : undefined,
        paymentMethod,
      })

      if (paymentMethod === 'ZARINPAL' && result.paymentUrl) {
        window.location.href = result.paymentUrl
      } else {
        if (paymentMethod === 'WALLET' && typeof result.walletBalance === 'number' && user) {
          setUser({ ...user, walletBalance: result.walletBalance })
        }
        toast.success(
          result.message
            || (paymentMethod === 'WALLET'
              ? 'پرداخت با کیف پول با موفقیت انجام شد'
              : 'پرداخت آزمایشی با موفقیت انجام شد'),
        )
        setBookingResult(result.booking ?? {
          id: result.bookingId,
          code: result.code,
          status: result.status,
        })
        setStep(4)
      }
    } catch (e: any) {
      toast.error(e.message || 'خطا در ثبت رزرو')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get today's date and next 7 days
  const getDateOptions = () => {
    const dates = []
    const today = new Date()
    for (let i = 0; i < 7; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      dates.push({
        value: toIsoLocalDate(d),
        label: i === 0 ? 'امروز' : i === 1 ? 'فردا' : formatPersianDate(d),
        dayOfWeek: getDayOfWeek(d),
      })
    }
    return dates
  }

  const unitPrice = selectedSlot?.price || game?.pricePerPlayer || game?.basePrice || 0
  const baseAmount = unitPrice * players
  const discountAmount = discountResult?.valid ? discountResult.amount : 0
  const finalAmount = Math.max(0, baseAmount - discountAmount)

  if (!hasHydrated || isLoading || !isAuthenticated) return null

  if (!game) return (
    <div className="min-h-screen pt-24 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">⏳</div>
        <p className="text-gray-400">در حال بارگذاری...</p>
      </div>
    </div>
  )

  const steps = [
    { num: 1, label: 'انتخاب زمان', icon: 'fas fa-calendar' },
    { num: 2, label: 'تعداد + تخفیف', icon: 'fas fa-users' },
    { num: 3, label: 'پرداخت', icon: 'fas fa-credit-card' },
    { num: 4, label: 'تأیید', icon: 'fas fa-check' },
  ]

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-cinzel font-bold text-2xl text-white mb-1">
            رزرو: <span className="blood-text">{game.title}</span>
          </h1>
          <p className="text-gray-400 text-sm">{game.branch.name} — {game.branch.city.name}</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-between mb-10 relative">
          <div className="absolute top-5 right-6 left-6 h-px bg-red-950/60 -z-0" />
          {steps.map((s) => (
            <div key={s.num} className="flex flex-col items-center gap-2 relative z-10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                step === s.num
                  ? 'bg-red-700 border-red-500 text-white shadow-lg shadow-red-900/50'
                  : step > s.num
                  ? 'bg-green-800/40 border-green-600 text-green-400'
                  : 'bg-bg-card border-red-950/40 text-gray-500'
              }`}>
                {step > s.num ? <i className="fas fa-check text-xs" /> : <i className={`${s.icon} text-xs`} />}
              </div>
              <span className={`text-xs ${step >= s.num ? 'text-gray-300' : 'text-gray-600'} hidden md:block`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Step 1: Date & Time */}
        {step === 1 && (
          <div className="dark-card rounded-2xl p-6 space-y-6 fade-in">
            <h2 className="font-cinzel font-bold text-lg text-white flex items-center gap-2">
              <i className="fas fa-calendar text-red-500" />
              انتخاب تاریخ
            </h2>

            {/* Date picker */}
            <div>
              <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                {getDateOptions().map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setSelectedDate(d.value)}
                    className={`flex flex-col items-center p-3 rounded-xl border transition-all text-sm ${
                      selectedDate === d.value
                        ? 'border-red-500 bg-red-900/30 text-white'
                        : 'border-red-950/30 text-gray-400 hover:border-red-700/50 hover:text-white'
                    }`}
                  >
                    <span className="text-xs opacity-70">{d.dayOfWeek}</span>
                    <span className="font-medium">{d.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Time slots */}
            {selectedDate && (
              <div>
                <h3 className="text-gray-300 text-sm font-medium mb-3">
                  <i className="fas fa-clock text-red-500 ml-1" />
                  زمان‌های موجود
                </h3>
                {!availability ? (
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-16 skeleton rounded-xl" />
                    ))}
                  </div>
                ) : availability.slots.length === 0 ? (
                  <p className="text-gray-400 text-center py-6">هیچ زمانی برای این روز موجود نیست</p>
                ) : (
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                    {availability.slots.map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() => slot.isAvailable && setSelectedSlot(slot)}
                        disabled={!slot.isAvailable}
                        className={`p-3 rounded-xl border text-center transition-all text-sm ${
                          selectedSlot?.id === slot.id
                            ? 'border-red-500 bg-red-900/30 text-white'
                            : !slot.isAvailable
                            ? 'border-gray-800 bg-gray-900/30 text-gray-600 cursor-not-allowed line-through'
                            : 'border-red-950/30 text-gray-300 hover:border-red-700/50 hover:text-white'
                        }`}
                      >
                        <div className="font-bold">{slot.startTime}</div>
                        <div className="text-xs opacity-70">{formatToman(slot.price)} ت</div>
                        {!slot.isAvailable && <div className="text-xs text-red-600">پر</div>}
                        {slot.isAvailable && slot.availableCapacity <= 2 && (
                          <div className="text-xs text-yellow-500">{toPersianDigits(slot.availableCapacity)} جا</div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => setStep(2)}
                disabled={!selectedDate || !selectedSlot}
                className="btn-blood py-3 px-8 disabled:opacity-50"
              >
                مرحله بعد
                <i className="fas fa-arrow-left mr-2" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Players + Discount */}
        {step === 2 && (
          <div className="dark-card rounded-2xl p-6 space-y-6 fade-in">
            <h2 className="font-cinzel font-bold text-lg text-white flex items-center gap-2">
              <i className="fas fa-users text-red-500" />
              تعداد بازیکن و تخفیف
            </h2>

            {/* Selected time summary */}
            <div className="bg-red-950/20 border border-red-900/20 rounded-xl p-4 text-sm">
              <div className="flex items-center gap-3">
                <i className="fas fa-calendar-check text-red-500" />
                <div>
                  <span className="text-white">{formatSelectedDate(selectedDate)}</span>
                  <span className="text-gray-400 mx-2">—</span>
                  <span className="text-red-400">{selectedSlot?.startTime} تا {selectedSlot?.endTime}</span>
                </div>
              </div>
            </div>

            {/* Players counter */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-3">تعداد بازیکن</label>
              <div className="flex items-center justify-center gap-8 bg-red-950/20 rounded-xl p-6 border border-red-900/20">
                <button
                  onClick={() => setPlayers(Math.max(game!.minPlayers, players - 1))}
                  className="w-12 h-12 rounded-full bg-red-900/50 text-white text-2xl font-bold hover:bg-red-800/70 transition-all disabled:opacity-40"
                  disabled={players <= game!.minPlayers}
                >
                  −
                </button>
                <div className="text-center">
                  <div className="font-cinzel font-black text-5xl text-white">{toPersianDigits(players)}</div>
                  <div className="text-gray-400 text-sm mt-1">نفر</div>
                </div>
                <button
                  onClick={() => setPlayers(Math.min(game!.maxPlayers, players + 1))}
                  className="w-12 h-12 rounded-full bg-red-900/50 text-white text-2xl font-bold hover:bg-red-800/70 transition-all disabled:opacity-40"
                  disabled={players >= game!.maxPlayers}
                >
                  +
                </button>
              </div>
            </div>

            {/* Discount code */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                <i className="fas fa-tag text-red-500 ml-1" />
                کد تخفیف (اختیاری)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                  placeholder="مثال: TAKTIK20"
                  className="input-gothic flex-1 uppercase"
                />
                <button
                  onClick={handleValidateDiscount}
                  disabled={!discountCode}
                  className="btn-ghost px-4 disabled:opacity-40"
                >
                  اعمال
                </button>
              </div>
              {discountResult && (
                <div className={`mt-2 text-sm flex items-center gap-2 ${discountResult.valid ? 'text-green-400' : 'text-red-400'}`}>
                  <i className={`fas ${discountResult.valid ? 'fa-check-circle' : 'fa-times-circle'}`} />
                  {discountResult.message}
                  {discountResult.valid && <span className="text-yellow-400 font-bold">(−{formatToman(discountResult.amount)} ت)</span>}
                </div>
              )}
            </div>

            {/* Price summary */}
            <div className="bg-black/30 rounded-xl p-4 space-y-2 border border-red-950/20">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">قیمت اصلی</span>
                <span className="text-gray-200">{formatToman(baseAmount)} ت</span>
              </div>
              {discountResult?.valid && (
                <div className="flex justify-between text-sm text-green-400">
                  <span>تخفیف</span>
                  <span>−{formatToman(discountResult.amount)} ت</span>
                </div>
              )}
              <div className="border-t border-red-950/40 pt-2 flex justify-between font-bold">
                <span className="text-gray-300">مجموع</span>
                <span className="text-yellow-400 text-lg">{formatToman(finalAmount)} ت</span>
              </div>
            </div>

            <div className="flex justify-between gap-4">
              <button onClick={() => setStep(1)} className="btn-ghost py-3 px-6">
                <i className="fas fa-arrow-right ml-2" />
                قبلی
              </button>
              <button onClick={() => setStep(3)} className="btn-blood py-3 px-8">
                مرحله بعد
                <i className="fas fa-arrow-left mr-2" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Payment */}
        {step === 3 && (
          <div className="dark-card rounded-2xl p-6 space-y-6 fade-in">
            <h2 className="font-cinzel font-bold text-lg text-white flex items-center gap-2">
              <i className="fas fa-credit-card text-red-500" />
              روش پرداخت
            </h2>

            {/* Summary */}
            <div className="bg-red-950/20 border border-red-900/20 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">بازی</span>
                <span className="text-white">{game.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">زمان</span>
                <span className="text-white">{formatSelectedDate(selectedDate)} — {selectedSlot?.startTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">تعداد</span>
                <span className="text-white">{toPersianDigits(players)} نفر</span>
              </div>
              <div className="flex justify-between font-bold border-t border-red-950/40 pt-2">
                <span className="text-gray-300">مبلغ نهایی</span>
                <span className="text-yellow-400 text-lg">{formatToman(finalAmount)} تومان</span>
              </div>
            </div>

            {/* Payment methods */}
            <div className="space-y-3">
              <label className="block text-gray-300 text-sm font-medium">انتخاب روش پرداخت</label>

              {[
                { key: 'WALLET', icon: 'fas fa-wallet', label: 'کیف پول', desc: 'پرداخت از موجودی کیف پول' },
                { key: 'ZARINPAL', icon: 'fas fa-credit-card', label: 'درگاه بانکی', desc: 'پرداخت آنلاین با کارت بانکی' },
              ].map((pm) => (
                <label
                  key={pm.key}
                  className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === pm.key
                      ? 'border-red-500 bg-red-900/20'
                      : 'border-red-950/30 hover:border-red-700/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={pm.key}
                    checked={paymentMethod === pm.key as any}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="accent-red-600"
                  />
                  <i className={`${pm.icon} text-red-500 text-xl w-6`} />
                  <div>
                    <div className="text-white font-medium">{pm.label}</div>
                    <div className="text-gray-400 text-xs">{pm.desc}</div>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex justify-between gap-4">
              <button onClick={() => setStep(2)} className="btn-ghost py-3 px-6">
                <i className="fas fa-arrow-right ml-2" />
                قبلی
              </button>
              <button
                onClick={handleSubmitBooking}
                disabled={isSubmitting}
                className="btn-blood py-3 px-8 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin ml-2" />
                    در حال پردازش...
                  </>
                ) : (
                  <>
                    <i className="fas fa-lock ml-2" />
                    پرداخت {formatToman(finalAmount)} ت
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <div className="dark-card rounded-2xl p-8 text-center space-y-6 fade-in">
            <div className="text-7xl">✅</div>
            <h2 className="font-cinzel font-bold text-2xl text-white">رزرو با موفقیت ثبت شد!</h2>
            <p className="text-gray-300">کد رزرو شما: <span className="font-cinzel font-bold text-yellow-400">{bookingResult?.code || bookingResult?.id || 'BK-MOCK-001'}</span></p>
            <p className="text-gray-400 text-sm">پیامک تأیید به شماره‌تان ارسال خواهد شد</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="/bookings" className="btn-blood py-3 px-8">مشاهده رزروهای من</a>
              <a href="/games" className="btn-ghost py-3 px-8">بازی‌های دیگر</a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function BookingPage({ params }: { params: { slug: string } }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 heartbeat inline-block">⏳</div>
          <p className="text-gray-400">در حال بارگذاری...</p>
        </div>
      </div>
    }>
      <BookingContent params={params} />
    </Suspense>
  )
}

function formatPersianDate(date: Date): string {
  return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    day: 'numeric',
    month: 'long',
  }).format(date)
}

function getDayOfWeek(date: Date): string {
  return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    weekday: 'short',
  }).format(date)
}

function formatSelectedDate(value: string): string {
  if (!value) return ''
  return formatPersianDate(new Date(`${value}T00:00:00`))
}

function toIsoLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
