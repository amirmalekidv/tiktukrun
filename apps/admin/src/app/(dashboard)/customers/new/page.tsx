'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

type FormKey = 'name' | 'mobile' | 'email' | 'city'

interface FieldConfig {
  field: FormKey
  label: string
  placeholder: string
  icon: string
  required?: boolean
  dir?: 'ltr' | 'rtl'
}

export default function NewCustomerPage() {
  const router = useRouter()
  const [form, setForm] = useState<Record<FormKey, string>>({ name: '', mobile: '', email: '', city: '' })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await new Promise(r => setTimeout(r, 600))
    toast.success('مشتری جدید ایجاد شد')
    router.push('/customers')
  }

  const fields: FieldConfig[] = [
    { field: 'name', label: 'نام و نام‌خانوادگی', placeholder: 'محمد رضایی', icon: 'fa-user', required: true },
    { field: 'mobile', label: 'موبایل', placeholder: '09xxxxxxxxx', icon: 'fa-mobile-screen', required: true, dir: 'ltr' },
    { field: 'email', label: 'ایمیل', placeholder: 'email@example.com', icon: 'fa-envelope', dir: 'ltr' },
    { field: 'city', label: 'شهر', placeholder: 'تهران', icon: 'fa-location-dot' },
  ]

  return (
    <div className="max-w-lg space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-white transition-colors">
          <i className="fas fa-arrow-right" />
        </button>
        <h1 className="text-xl font-bold text-slate-100">مشتری جدید</h1>
      </div>
      <form onSubmit={handleSubmit} className="admin-card p-6 space-y-4">
        {fields.map(f => (
          <div key={f.field}>
            <label className="block text-sm text-slate-400 mb-2">{f.label} {f.required && <span className="text-red-400">*</span>}</label>
            <div className="relative">
              <i className={`fas ${f.icon} absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm`} />
              <input
                type="text"
                value={form[f.field]}
                onChange={e => setForm(p => ({ ...p, [f.field]: e.target.value }))}
                placeholder={f.placeholder}
                dir={f.dir}
                required={f.required}
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg pr-9 pl-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600"
              />
            </div>
          </div>
        ))}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()} className="flex-1 py-2.5 rounded-lg border border-slate-700/50 text-slate-400 text-sm">انصراف</button>
          <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {saving && <i className="fas fa-spinner fa-spin" />}
            ایجاد مشتری
          </button>
        </div>
      </form>
    </div>
  )
}
