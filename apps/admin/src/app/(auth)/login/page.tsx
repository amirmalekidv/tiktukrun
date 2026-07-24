'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

type Tab = 'otp' | 'password'
type OtpStep = 'phone' | 'verify'

export default function LoginPage() {
  const router = useRouter()
  const { sendOtp, verifyOtp, loginWithPassword, isLoading } = useAuth()

  const [tab, setTab] = useState<Tab>('otp')
  const [otpStep, setOtpStep] = useState<OtpStep>('phone')
  const [mobile, setMobile] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const startCountdown = () => {
    setCountdown(120)
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timer); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mobile || mobile.length < 11) return
    const ok = await sendOtp(mobile)
    if (ok) {
      setOtpStep('verify')
      startCountdown()
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp || otp.length < 6) return
    const ok = await verifyOtp(mobile, otp)
    if (ok) router.push('/dashboard')
  }

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mobile || !password) return
    const ok = await loginWithPassword(mobile, password)
    if (ok) router.push('/dashboard')
  }

  const handleResendOtp = async () => {
    if (countdown > 0) return
    await sendOtp(mobile)
    startCountdown()
  }

  const formatCountdown = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="animate-fade-in">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.14)]">
            <img
              src="/tiktakrun-logo.svg"
              alt=""
              aria-hidden="true"
              className="h-10 w-10 object-contain"
            />
          </div>
          <div>
            <h1 className="font-cinzel text-2xl font-bold text-white tracking-widest">
              TIK TAK RUN
            </h1>
            <p className="text-slate-400 text-xs">پنل مدیریت</p>
          </div>
        </div>
        <p className="text-slate-400 text-sm">ورود به سیستم مدیریت</p>
      </div>

      {/* Card */}
      <div className="admin-card p-6">
        {/* Tabs */}
        <div className="flex gap-1 p-1 mb-6 rounded-lg" style={{ background: 'rgba(15,23,42,0.8)' }}>
          {[
            { key: 'otp', label: 'ورود با OTP' },
            { key: 'password', label: 'رمز عبور' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key as Tab); setOtpStep('phone') }}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                tab === t.key
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* OTP Form */}
        {tab === 'otp' && (
          <div>
            {otpStep === 'phone' ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">شماره موبایل</label>
                  <div className="relative">
                    <i className="fas fa-mobile-screen absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="tel"
                      value={mobile}
                      onChange={e => setMobile(e.target.value)}
                      placeholder="09xxxxxxxxx"
                      dir="ltr"
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-10 py-3 text-slate-100 placeholder:text-slate-600 text-sm"
                      maxLength={11}
                      required
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    <i className="fas fa-info-circle ml-1" />
                    فقط مدیران سیستم اجازه ورود دارند
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={isLoading || mobile.length < 11}
                  className="w-full py-3 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <><i className="fas fa-spinner fa-spin" /> در حال ارسال...</>
                  ) : (
                    <><i className="fas fa-paper-plane" /> ارسال کد تأیید</>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="flex items-center gap-2 mb-4 text-sm text-slate-400">
                  <button type="button" onClick={() => setOtpStep('phone')} className="text-red-400 hover:text-red-300">
                    <i className="fas fa-arrow-right ml-1" />
                    تغییر شماره
                  </button>
                  <span>·</span>
                  <span dir="ltr">{mobile}</span>
                </div>
                
                <div>
                  <label className="block text-sm text-slate-400 mb-2">کد تأیید</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="کد ۶ رقمی"
                    dir="ltr"
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-3 text-center text-2xl tracking-[0.5em] text-slate-100 placeholder:text-slate-600"
                    maxLength={6}
                    required
                  />
                </div>

                {/* Countdown */}
                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={countdown > 0}
                    className="text-red-400 hover:text-red-300 disabled:text-slate-600 disabled:cursor-not-allowed"
                  >
                    ارسال مجدد
                  </button>
                  {countdown > 0 && (
                    <span className="text-slate-500 font-mono" dir="ltr">
                      {formatCountdown(countdown)}
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otp.length < 6}
                  className="w-full py-3 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <><i className="fas fa-spinner fa-spin" /> در حال تأیید...</>
                  ) : (
                    <><i className="fas fa-check" /> تأیید و ورود</>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Password Form */}
        {tab === 'password' && (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">شماره موبایل</label>
              <div className="relative">
                <i className="fas fa-mobile-screen absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="tel"
                  value={mobile}
                  onChange={e => setMobile(e.target.value)}
                  placeholder="09xxxxxxxxx"
                  dir="ltr"
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-10 py-3 text-slate-100 placeholder:text-slate-600 text-sm"
                  maxLength={11}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">رمز عبور</label>
              <div className="relative">
                <i className="fas fa-lock absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="رمز عبور"
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg pr-10 pl-10 py-3 text-slate-100 placeholder:text-slate-600 text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !mobile || !password}
              className="w-full py-3 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <><i className="fas fa-spinner fa-spin" /> در حال ورود...</>
              ) : (
                <><i className="fas fa-right-to-bracket" /> ورود</>
              )}
            </button>
          </form>
        )}

        {/* Demo hint */}
        <div className="mt-6 p-3 rounded-lg text-xs text-slate-500 border border-slate-700/30" style={{ background: 'rgba(15,23,42,0.5)' }}>
          <i className="fas fa-circle-info ml-1 text-sky-500" />
          <span>حساب پیش‌فرض: موبایل </span>
          <span dir="ltr" className="font-mono text-sky-400">09120000001</span>
          <span> | رمز </span>
          <span dir="ltr" className="font-mono text-sky-400">Admin@123456</span>
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-slate-600 text-xs mt-6">
        TIK TAK RUN © {new Date().getFullYear()} — نسخه ۱.۰.۰
      </p>
    </div>
  )
}
