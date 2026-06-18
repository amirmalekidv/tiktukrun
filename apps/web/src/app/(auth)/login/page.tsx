'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { requestOtp, verifyOtp } from '@/lib/api'
import { setRefreshTokenCookie } from '@/lib/auth'
import { useAuthStore } from '@/store/auth.store'
import { isValidIranianMobile, toPersianDigits } from '@/lib/utils'

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
    if (!isValidIranianMobile(mobile)) {
      toast.error('شماره موبایل نامعتبر است (مثال: ۰۹۱۲۳۴۵۶۷۸۹)')
      return
    }
    setIsLoading(true)
    try {
      const res = await requestOtp(mobile, inviteCode || undefined)
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
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, '').split('').slice(0, 6)
      const newOtp = [...otp]
      digits.forEach((d, i) => { if (idx + i < 6) newOtp[idx + i] = d })
      setOtp(newOtp)
      const nextIdx = Math.min(5, idx + digits.length)
      otpRefs.current[nextIdx]?.focus()
      return
    }
    if (!/^\d?$/.test(value)) return
    const newOtp = [...otp]
    newOtp[idx] = value
    setOtp(newOtp)
    if (value && idx < 5) otpRefs.current[idx + 1]?.focus()
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
      login(res.user, res.accessToken)
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
    setIsLoading(true)
    try {
      await requestOtp(mobile, inviteCode || undefined)
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
    <div className="dark-card rounded-2xl p-8 space-y-6">
      {/* Logo */}
      <div className="text-center">
        <Link href="/" className="inline-block mb-4">
          <span className="font-cinzel font-black text-3xl text-white flicker">TIK TAK RUN</span>
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
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 11))}
              placeholder="09xxxxxxxxx"
              className="input-gothic text-lg tracking-widest text-center"
              dir="ltr"
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
            <p className="text-gray-500 text-xs text-center mt-2">
              کد demo: <span className="text-yellow-400 font-bold" dir="ltr">123456</span>
            </p>
          </div>

          {/* Countdown */}
          <div className="text-center">
            {countdown > 0 ? (
              <p className="text-gray-400 text-sm">
                ارسال مجدد کد در
                <span className="text-red-400 font-bold mx-1 font-cinzel">
                  {toPersianDigits(Math.floor(countdown / 60).toString().padStart(2, '0'))}:
                  {toPersianDigits((countdown % 60).toString().padStart(2, '0'))}
                </span>
                ثانیه دیگر
              </p>
            ) : (
              <button
                onClick={handleResend}
                disabled={isLoading}
                className="text-red-400 hover:text-red-300 text-sm transition-colors"
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
        با ورود، <Link href="/terms" className="text-red-400 hover:text-red-300">قوانین و مقررات</Link> و{' '}
        <Link href="/privacy" className="text-red-400 hover:text-red-300">حریم خصوصی</Link> را می‌پذیرید
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="dark-card rounded-2xl p-8 h-96 skeleton" />
    }>
      <LoginForm />
    </Suspense>
  )
}
