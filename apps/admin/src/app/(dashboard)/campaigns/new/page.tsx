'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSegments } from '@/hooks/useSegments'
import { campaignsApi } from '@/lib/api/campaigns'
import { toPersianNum } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Segment } from '@/types'

const STEPS = ['اطلاعات پایه', 'انتخاب مخاطب', 'محتوا', 'زمان‌بندی']

const TYPES = [
  { value: 'SMS', label: 'پیامک', icon: 'fa-message-sms', color: 'text-sky-400' },
  { value: 'EMAIL', label: 'ایمیل', icon: 'fa-envelope', color: 'text-emerald-400' },
  { value: 'IN_APP', label: 'درون‌برنامه', icon: 'fa-bell', color: 'text-amber-400' },
  { value: 'PUSH', label: 'پوش نوتیف', icon: 'fa-mobile-screen', color: 'text-purple-400' },
]

const SMS_VARS = ['{{name}}', '{{firstName}}', '{{level}}', '{{coins}}', '{{ltv}}']

export default function NewCampaignPage() {
  const router = useRouter()
  const { data: segsRes } = useSegments()
  const segments: Segment[] = (segsRes?.data || []) as Segment[]
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: '', type: 'SMS', description: '', budget: '',
    segmentId: '', body: '', subject: '', link: '',
    scheduleType: 'immediate', scheduledAt: '',
  })

  const setF = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const isStepValid = () => {
    if (step === 0) return form.name.trim().length > 0
    if (step === 2) return form.body.trim().length > 0
    return true
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      await campaignsApi.create({
        name: form.name, type: form.type, segmentId: form.segmentId || undefined,
        content: { body: form.body, subject: form.subject, link: form.link },
        scheduledAt: form.scheduleType === 'scheduled' ? form.scheduledAt : undefined,
        status: form.scheduleType === 'immediate' ? 'ACTIVE' : 'SCHEDULED',
      })
      toast.success('کمپین ایجاد شد')
      router.push('/campaigns')
    } catch { toast.error('خطا در ایجاد کمپین') }
    setSaving(false)
  }

  return (
    <div className="max-w-2xl space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-white transition-colors">
          <i className="fas fa-arrow-right" />
        </button>
        <h1 className="text-xl font-bold text-slate-100">کمپین جدید</h1>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 flex-shrink-0 ${
              i < step ? 'step-completed' : i === step ? 'step-active' : 'step-pending'
            }`}>
              {i < step ? <i className="fas fa-check text-[10px]" /> : toPersianNum(i + 1)}
            </div>
            <span className={`text-xs hidden sm:block ${i === step ? 'text-red-400 font-medium' : i < step ? 'text-emerald-400' : 'text-slate-600'}`}>{s}</span>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${i < step ? 'bg-emerald-600' : 'bg-slate-700'}`} />}
          </div>
        ))}
      </div>

      <div className="admin-card p-6">
        {/* Step 0: Basic Info */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-slate-200">اطلاعات پایه</h2>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">نام کمپین <span className="text-red-400">*</span></label>
              <input value={form.name} onChange={e => setF('name', e.target.value)} placeholder="مثال: جشنواره پاییز" className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">نوع کمپین</label>
              <div className="grid grid-cols-4 gap-2">
                {TYPES.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setF('type', t.value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${form.type === t.value ? 'border-red-500/50 bg-red-500/10' : 'border-slate-700/30 hover:border-slate-600/50'}`}
                  >
                    <i className={`fas ${t.icon} ${t.color} text-lg`} />
                    <span className="text-xs text-slate-400">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">توضیحات</label>
              <textarea value={form.description} onChange={e => setF('description', e.target.value)} rows={2} placeholder="توضیح مختصری از هدف کمپین..." className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 resize-none" />
            </div>
          </div>
        )}

        {/* Step 1: Segment */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-slate-200">انتخاب مخاطب</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={() => setF('segmentId', '')}
                className={`p-3 rounded-xl border text-right transition-all ${!form.segmentId ? 'border-red-500/50 bg-red-500/10' : 'border-slate-700/30 hover:border-slate-600/50'}`}
              >
                <i className="fas fa-users text-slate-400 mb-1 block" />
                <p className="text-sm font-medium text-slate-200">همه کاربران</p>
                <p className="text-xs text-slate-500">ارسال به تمام مشتریان</p>
              </button>
              {segments.map((seg: Segment) => (
                <button
                  key={seg.id}
                  onClick={() => setF('segmentId', seg.id)}
                  className={`p-3 rounded-xl border text-right transition-all ${form.segmentId === seg.id ? 'border-red-500/50 bg-red-500/10' : 'border-slate-700/30 hover:border-slate-600/50'}`}
                >
                  <i className={`fas ${seg.icon} mb-1 block`} style={{ color: seg.color }} />
                  <p className="text-sm font-medium text-slate-200">{seg.name}</p>
                  <p className="text-xs text-slate-500">{toPersianNum(seg.count)} عضو</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Content */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-slate-200">محتوای پیام</h2>
            {form.type === 'SMS' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm text-slate-400">متن پیامک <span className="text-red-400">*</span></label>
                  <span className="text-xs text-slate-600">{toPersianNum(form.body.length)} کاراکتر</span>
                </div>
                <textarea
                  value={form.body}
                  onChange={e => setF('body', e.target.value)}
                  rows={4}
                  placeholder="سلام {{name}} عزیز! ..."
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 resize-none"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {SMS_VARS.map(v => (
                    <button key={v} onClick={() => setF('body', form.body + v)} className="px-2 py-0.5 text-xs bg-slate-800/80 text-sky-400 rounded border border-slate-700/30 hover:border-sky-500/30 transition-colors font-mono">
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {(form.type === 'EMAIL' || form.type === 'IN_APP') && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">عنوان</label>
                  <input value={form.subject} onChange={e => setF('subject', e.target.value)} placeholder="موضوع پیام..." className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2.5 text-sm text-slate-200" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">متن <span className="text-red-400">*</span></label>
                  <textarea value={form.body} onChange={e => setF('body', e.target.value)} rows={4} className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-200 resize-none" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">لینک</label>
                  <input value={form.link} onChange={e => setF('link', e.target.value)} placeholder="https://..." dir="ltr" className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2.5 text-sm text-slate-200" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Schedule */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-slate-200">زمان‌بندی ارسال</h2>
            <div className="space-y-2">
              {[
                { value: 'immediate', label: 'ارسال فوری', icon: 'fa-bolt', desc: 'بلافاصله پس از تأیید ارسال می‌شود' },
                { value: 'scheduled', label: 'زمان‌بندی شده', icon: 'fa-calendar', desc: 'در تاریخ و ساعت مشخص ارسال می‌شود' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setF('scheduleType', opt.value)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border text-right transition-all ${form.scheduleType === opt.value ? 'border-red-500/50 bg-red-500/10' : 'border-slate-700/30 hover:border-slate-600/50'}`}
                >
                  <i className={`fas ${opt.icon} w-5 text-center ${form.scheduleType === opt.value ? 'text-red-400' : 'text-slate-500'}`} />
                  <div>
                    <p className="text-sm font-medium text-slate-200">{opt.label}</p>
                    <p className="text-xs text-slate-500">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
            {form.scheduleType === 'scheduled' && (
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">تاریخ و ساعت ارسال</label>
                <input type="datetime-local" value={form.scheduledAt} onChange={e => setF('scheduledAt', e.target.value)} className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2.5 text-sm text-slate-200" dir="ltr" />
              </div>
            )}
            <div className="p-4 rounded-xl border border-slate-700/30 bg-slate-800/20 space-y-2 text-sm">
              <p className="font-medium text-slate-300">خلاصه کمپین</p>
              <div className="text-slate-500 space-y-1">
                <p>نام: <span className="text-slate-300">{form.name}</span></p>
                <p>نوع: <span className="text-slate-300">{form.type}</span></p>
                <p>مخاطب: <span className="text-slate-300">{form.segmentId ? segments.find((s) => s.id === form.segmentId)?.name : 'همه کاربران'}</span></p>
                <p>زمان: <span className="text-slate-300">{form.scheduleType === 'immediate' ? 'فوری' : form.scheduledAt}</span></p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          onClick={() => step > 0 ? setStep(s => s - 1) : router.back()}
          className="flex-1 py-2.5 rounded-lg border border-slate-700/50 text-slate-400 hover:text-slate-200 text-sm transition-colors"
        >
          {step === 0 ? 'انصراف' : 'مرحله قبل'}
        </button>
        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!isStepValid()}
            className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            مرحله بعد <i className="fas fa-arrow-left mr-1" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            {saving && <i className="fas fa-spinner fa-spin" />}
            ایجاد و ارسال کمپین
          </button>
        )}
      </div>
    </div>
  )
}
