'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { requestOtp, verifyOtp } from '@/lib/api'
import { setRefreshTokenCookie } from '@/lib/auth'
import { useAuthStore } from '@/store/auth.store'
import { isValidIranianMobile, normalizeMobile, toEnglishDigits, toPersianDigits } from '@/lib/utils'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuthStore()

  const [phase, setPhase] = useState<'phone' | 'otp'>('phone')
  const [mobile, setMobile] = useState('')
  const [inviteCode, setInviteCode] = useState(searchParams.get('invite') || '')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [resendCount, setResendCount] = useState(0)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  const redirectUrl = searchParams.get('redirect') || '/'

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(t)
    }
  }, [countdown])

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const normalizedMobile = normalizeMobile(mobile)
    if (!isValidIranianMobile(normalizedMobile)) {
      toast.error('شماره موبایل نامعتبر است (مثال: ۰۹۱۲۳۴۵۶۷۸۹)')
      return
    }
    setMobile(normalizedMobile)
    setIsLoading(true)
    try {
      const res = await requestOtp(normalizedMobile, inviteCode || undefined)
      if (res.success) {
        setPhase('otp')
        setCountdown(120)
        toast.success('کد تأیید ارسال شد')
        setTimeout(() => otpRefs.current[0]?.focus(), 200)
      }
    } catch (e: any) {
      toast.error(e.message || 'خطا در ارسال کد')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpChange = (idx: number, value: string) => {
    const englishValue = toEnglishDigits(value)
    if (englishValue.length > 1) {
      // Handle paste
      const digits = englishValue.replace(/\D/g, '').split('').slice(0, 6)
      const newOtp = [...otp]
      digits.forEach((d, i) => { if (idx + i < 6) newOtp[idx + i] = d })
      setOtp(newOtp)
      const nextIdx = Math.min(5, idx + digits.length)
      otpRefs.current[nextIdx]?.focus()
      return
    }
    if (!/^\d?$/.test(englishValue)) return
    const newOtp = [...otp]
    newOtp[idx] = englishValue
    setOtp(newOtp)
    if (englishValue && idx < 5) otpRefs.current[idx + 1]?.focus()
  }

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus()
    }
  }

  const handleOtpSubmit = async () => {
    const code = otp.join('')
    if (code.length !== 6) {
      toast.error('کد ۶ رقمی را وارد کنید')
      return
    }
    setIsLoading(true)
    try {
      const res = await verifyOtp(mobile, code)
      await setRefreshTokenCookie(res.refreshToken)
      login(res.user, res.accessToken, res.refreshToken)
      toast.success(res.isNewUser ? 'خوش آمدید! 🎉' : `خوش برگشتی، ${res.user.name || 'دوست'} 👋`)
      router.push(redirectUrl)
    } catch (e: any) {
      toast.error(e.message || 'کد نامعتبر است')
      setOtp(['', '', '', '', '', ''])
      otpRefs.current[0]?.focus()
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendCount >= 3) {
      toast.error('تعداد درخواست‌ها بیش از حد مجاز است')
      return
    }
    const normalizedMobile = normalizeMobile(mobile)
    setIsLoading(true)
    try {
      await requestOtp(normalizedMobile, inviteCode || undefined)
      setCountdown(120)
      setOtp(['', '', '', '', '', ''])
      setResendCount(prev => prev + 1)
      toast.success('کد جدید ارسال شد')
    } catch (e: any) {
      toast.error(e.message || 'خطا در ارسال کد')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="dark-card rounded-[18px] p-8 space-y-6">
      {/* Logo */}
      <div className="text-center">
        <Link href="/" className="mb-4 inline-flex items-center justify-center gap-2">
          <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-[11px] bg-white shadow-[0_0_20px_rgba(255,255,255,0.18)]">
            <img
              src="/tiktakrun-logo.svg"
              alt=""
              aria-hidden="true"
              className="h-9 w-9 object-contain"
            />
          </span>
          <span className="font-cinzel font-black text-2xl text-white">
            TIK TAK <span className="glow-teal">RUN</span>
          </span>
        </Link>
        <h1 className="text-white font-bold text-xl mb-1">
          {phase === 'phone' ? 'ورود / ثبت‌نام' : 'تأیید شماره موبایل'}
        </h1>
        <p className="text-gray-400 text-sm">
          {phase === 'phone'
            ? 'با شماره موبایل وارد شوید'
            : `کد ۶ رقمی ارسال شده به ${mobile} را وارد کنید`}
        </p>
      </div>

      {/* Phase: Phone */}
      {phase === 'phone' && (
        <form onSubmit={handlePhoneSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">شماره موبایل</label>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(normalizeMobile(e.target.value))}
              placeholder="09xxxxxxxxx"
              className="input-gothic text-lg tracking-widest text-center"
              dir="ltr"
              inputMode="numeric"
              required
              autoFocus
            />
            <p className="text-gray-500 text-xs mt-1 text-center">مثال: ۰۹۱۲۳۴۵۶۷۸۹</p>
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              کد دعوت (اختیاری)
              <span className="text-gray-500 font-normal mr-1">— برای تخفیف</span>
            </label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="TTR-XXXXXXXX"
              className="input-gothic uppercase"
              dir="ltr"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !mobile}
            className="btn-blood w-full py-4 text-base disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <i className="fas fa-spinner fa-spin ml-2" />
                در حال ارسال...
              </>
            ) : (
              <>
                <i className="fas fa-paper-plane ml-2" />
                ارسال کد تأیید
              </>
            )}
          </button>
        </form>
      )}

      {/* Phase: OTP */}
      {phase === 'otp' && (
        <div className="space-y-6">
          {/* OTP boxes */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-3 text-center">
              کد تأیید ۶ رقمی
            </label>
            <div className="flex justify-center gap-2 md:gap-3" dir="ltr">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => { otpRefs.current[idx] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  className="otp-input"
                  autoFocus={idx === 0}
                />
              ))}
            </div>
          </div>

          {/* Countdown */}
          <div className="text-center">
            {countdown > 0 ? (
              <p className="text-gray-400 text-sm">
                ارسال مجدد کد در
                <span className="text-[#00f5ff] font-bold mx-1 font-cinzel">
                  {toPersianDigits(Math.floor(countdown / 60).toString().padStart(2, '0'))}:
                  {toPersianDigits((countdown % 60).toString().padStart(2, '0'))}
                </span>
                ثانیه دیگر
              </p>
            ) : (
              <button
                onClick={handleResend}
                disabled={isLoading}
                className="text-[#00f5ff] hover:text-white text-sm transition-colors"
              >
                <i className="fas fa-redo ml-1" />
                ارسال مجدد کد
              </button>
            )}
          </div>

          <button
            onClick={handleOtpSubmit}
            disabled={isLoading || otp.some((d) => !d)}
            className="btn-blood w-full py-4 text-base disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <i className="fas fa-spinner fa-spin ml-2" />
                در حال تأیید...
              </>
            ) : (
              <>
                <i className="fas fa-sign-in-alt ml-2" />
                ورود
              </>
            )}
          </button>

          <button
            onClick={() => { setPhase('phone'); setOtp(['', '', '', '', '', '']) }}
            className="w-full text-center text-gray-400 hover:text-white text-sm transition-colors"
          >
            <i className="fas fa-arrow-right ml-1" />
            تغییر شماره
          </button>
        </div>
      )}

      {/* Terms */}
      <p className="text-gray-500 text-xs text-center">
        با ورود، <Link href="/terms" className="text-[#00f5ff] hover:text-white">قوانین و مقررات</Link> و{' '}
        <Link href="/privacy" className="text-[#00f5ff] hover:text-white">حریم خصوصی</Link> را می‌پذیرید
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="dark-card rounded-[18px] p-8 h-96 skeleton" />
    }>
      <LoginForm />
    </Suspense>
  )
}
