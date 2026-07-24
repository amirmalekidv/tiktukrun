'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import {
  branchManagersApi,
  branchesApi,
  type BranchManagerCredentials,
} from '@/lib/api'
import { can } from '@/lib/permissions'
import { useAuthStore } from '@/stores/authStore'
import type { Branch } from '@/lib/types'

type FormState = {
  fullName: string
  mobile: string
  email: string
  branchId: string
}

function readData<T>(res: { data?: unknown } | null | undefined): T | null {
  const d = (res as { data?: unknown } | null | undefined)?.data
  if (d && typeof d === 'object' && 'data' in (d as Record<string, unknown>)) {
    return (d as { data: T }).data
  }
  return (d as T) ?? null
}

export default function NewBranchManagerPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const allowed = can(user, 'users.write')

  const [form, setForm] = useState<FormState>({
    fullName: '',
    mobile: '',
    email: '',
    branchId: '',
  })
  const [branches, setBranches] = useState<Branch[]>([])
  const [saving, setSaving] = useState(false)
  const [credentials, setCredentials] = useState<BranchManagerCredentials | null>(null)

  useEffect(() => {
    if (!allowed) {
      toast.error('دسترسی ایجاد مدیر شعبه را ندارید')
      router.replace('/branch-managers')
      return
    }
    branchesApi
      .getAll({ limit: 200 })
      .then((res) => {
        const body = readData<Branch[] | { data?: Branch[] }>(res)
        if (Array.isArray(body)) setBranches(body)
        else if (body && Array.isArray((body as { data?: Branch[] }).data)) {
          setBranches((body as { data: Branch[] }).data)
        } else setBranches([])
      })
      .catch(() => {
        toast.error('خطا در بارگذاری شعب')
        setBranches([])
      })
  }, [allowed, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.fullName.trim() || !form.mobile.trim() || !form.branchId) {
      toast.error('نام، موبایل و شعبه الزامی است')
      return
    }
    setSaving(true)
    try {
      const res = await branchManagersApi.create({
        fullName: form.fullName.trim(),
        mobile: form.mobile.trim(),
        branchId: form.branchId,
        email: form.email.trim() || undefined,
      })
      const data = readData<{ credentials: BranchManagerCredentials }>(res)
      if (!data?.credentials) {
        toast.error('پاسخ سرور نامعتبر بود')
        return
      }
      setCredentials(data.credentials)
      toast.success('مدیر شعبه ایجاد شد')
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string }; message?: string } } })?.response?.data
          ?.error?.message ||
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'خطا در ایجاد مدیر شعبه'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const copyText = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(`${label} کپی شد`)
    } catch {
      toast.error('کپی نشد')
    }
  }

  if (credentials) {
    return (
      <div className="max-w-lg space-y-4 animate-fade-in">
        <h1 className="text-xl font-bold text-slate-100">اطلاعات ورود مدیر شعبه</h1>
        <div className="admin-card p-6 space-y-4 border border-amber-500/30 bg-amber-500/5">
          <p className="text-sm text-amber-200/90 leading-relaxed">
            این رمز فقط یک‌بار نمایش داده می‌شود. آن را همین حالا برای مدیر شعبه ارسال کنید تا بتواند با موبایل و رمز وارد پنل ادمین شود.
          </p>
          <CredentialRow label="موبایل" value={credentials.mobile} onCopy={() => copyText('موبایل', credentials.mobile)} />
          <CredentialRow label="رمز عبور موقت" value={credentials.password} onCopy={() => copyText('رمز', credentials.password)} mono />
          <CredentialRow label="شعبه" value={credentials.branch.name} />
          <CredentialRow label="نقش" value="مدیر شعبه (BRANCH_MANAGER)" />
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push('/branch-managers')}
            className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium"
          >
            بازگشت به لیست
          </button>
          <button
            type="button"
            onClick={() => {
              setCredentials(null)
              setForm({ fullName: '', mobile: '', email: '', branchId: '' })
            }}
            className="flex-1 py-2.5 rounded-lg border border-slate-700/50 text-slate-300 text-sm"
          >
            ایجاد یکی دیگر
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-white transition-colors"
        >
          <i className="fas fa-arrow-right" />
        </button>
        <h1 className="text-xl font-bold text-slate-100">مدیر شعبه جدید</h1>
      </div>

      <form onSubmit={handleSubmit} className="admin-card p-6 space-y-4">
        <Field
          label="نام و نام‌خانوادگی"
          required
          icon="fa-user"
          value={form.fullName}
          onChange={(v) => setForm((p) => ({ ...p, fullName: v }))}
          placeholder="علی رضایی"
        />
        <Field
          label="موبایل"
          required
          icon="fa-mobile-screen"
          value={form.mobile}
          onChange={(v) => setForm((p) => ({ ...p, mobile: v }))}
          placeholder="09xxxxxxxxx"
          dir="ltr"
        />
        <Field
          label="ایمیل"
          icon="fa-envelope"
          value={form.email}
          onChange={(v) => setForm((p) => ({ ...p, email: v }))}
          placeholder="email@example.com"
          dir="ltr"
        />

        <div>
          <label className="block text-sm text-slate-400 mb-2">
            شعبه <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <i className="fas fa-store absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm" />
            <select
              value={form.branchId}
              onChange={(e) => setForm((p) => ({ ...p, branchId: e.target.value }))}
              required
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg pr-9 pl-4 py-2.5 text-sm text-slate-200 appearance-none"
            >
              <option value="">انتخاب شعبه...</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                  {(b as Branch & { city?: { name?: string } }).city?.name
                    ? ` — ${(b as Branch & { city?: { name?: string } }).city?.name}`
                    : ''}
                </option>
              ))}
            </select>
          </div>
          <p className="mt-1.5 text-xs text-slate-500">
            برای ورود به پنل، مدیر شعبه باید حداقل به یک شعبه متصل باشد.
          </p>
        </div>

        <div className="rounded-lg bg-slate-800/40 border border-slate-700/40 p-3 text-xs text-slate-400 leading-relaxed">
          پس از ایجاد، یک رمز عبور پیش‌فرض ساخته می‌شود تا بتوانید اطلاعات ورود را با مدیر شعبه به اشتراک بگذارید.
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 py-2.5 rounded-lg border border-slate-700/50 text-slate-400 text-sm"
          >
            انصراف
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <i className="fas fa-spinner fa-spin" />}
            ایجاد مدیر شعبه
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  icon,
  required,
  dir,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  icon: string
  required?: boolean
  dir?: 'ltr' | 'rtl'
}) {
  return (
    <div>
      <label className="block text-sm text-slate-400 mb-2">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <div className="relative">
        <i className={`fas ${icon} absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm`} />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          dir={dir}
          required={required}
          className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg pr-9 pl-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600"
        />
      </div>
    </div>
  )
}

function CredentialRow({
  label,
  value,
  onCopy,
  mono,
}: {
  label: string
  value: string
  onCopy?: () => void
  mono?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3 bg-slate-900/60 border border-slate-700/50 rounded-lg px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-xs text-slate-500 mb-0.5">{label}</p>
        <p className={`text-sm text-slate-100 truncate ${mono ? 'font-mono' : ''}`} dir="ltr">
          {value}
        </p>
      </div>
      {onCopy && (
        <button
          type="button"
          onClick={onCopy}
          className="shrink-0 px-2.5 py-1.5 text-xs rounded-md bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
        >
          کپی
        </button>
      )}
    </div>
  )
}
