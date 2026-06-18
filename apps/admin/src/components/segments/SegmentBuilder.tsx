'use client'
import { useState, useEffect, useCallback } from 'react'
import { segmentsApi } from '@/lib/api/segments'
import { toPersianNum, debounce } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { SegmentRule } from '@/types'

const FIELDS = [
  { value: 'ltv', label: 'LTV (ارزش طول عمر)' },
  { value: 'level', label: 'سطح بازی' },
  { value: 'totalBookings', label: 'تعداد رزرو' },
  { value: 'tier', label: 'رده مشتری' },
  { value: 'city', label: 'شهر' },
  { value: 'registeredAt', label: 'تاریخ ثبت‌نام (روز)' },
  { value: 'lastActiveAt', label: 'آخرین فعالیت (روز)' },
]

const OPERATORS = [
  { value: 'eq', label: 'مساوی' },
  { value: 'ne', label: 'نامساوی' },
  { value: 'gt', label: 'بزرگتر از' },
  { value: 'gte', label: 'بزرگتر یا مساوی' },
  { value: 'lt', label: 'کوچکتر از' },
  { value: 'lte', label: 'کوچکتر یا مساوی' },
  { value: 'contains', label: 'شامل' },
]

interface Props { onClose: () => void; onSave: () => void }

export function SegmentBuilder({ onClose, onSave }: Props) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#dc2626')
  const [icon, setIcon] = useState('fa-layer-group')
  const [logic, setLogic] = useState<'AND' | 'OR'>('AND')
  const [rules, setRules] = useState<SegmentRule[]>([{ id: 'r1', field: 'ltv', operator: 'gte', value: 1000000 }])
  const [previewCount, setPreviewCount] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const updatePreview = useCallback(
    debounce(async (r: SegmentRule[], l: 'AND' | 'OR') => {
      const res = await segmentsApi.preview(r, l)
      if (res.success && res.data && typeof (res.data as Record<string, unknown>).count === 'number') {
        setPreviewCount((res.data as { count: number }).count)
      }
    }, 600),
    [] // intentionally empty — debounced function is stable
  )

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { updatePreview(rules, logic) }, [rules, logic])

  const addRule = () => setRules(p => [...p, { id: `r${Date.now()}`, field: 'level', operator: 'gte', value: 1 }])
  const removeRule = (id: string) => setRules(p => p.filter(r => r.id !== id))
  const updateRule = (id: string, updates: Partial<SegmentRule>) =>
    setRules(p => p.map(r => r.id === id ? { ...r, ...updates } : r))

  const handleSave = async () => {
    if (!name.trim()) return toast.error('نام سگمنت را وارد کنید')
    setSaving(true)
    try {
      await segmentsApi.create({ name, color, icon, logic, rules })
      toast.success('سگمنت ایجاد شد')
      onSave()
    } catch { toast.error('خطا در ایجاد سگمنت') }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative admin-card w-full max-w-lg animate-fade-in overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-slate-700/30">
          <h3 className="font-semibold text-slate-200">سگمنت جدید</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white p-2"><i className="fas fa-xmark" /></button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">نام سگمنت</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="مثال: مشتریان VIP" className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-200" />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm text-slate-400 mb-1.5">رنگ</label>
              <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-full h-9 rounded-lg cursor-pointer bg-slate-800/50 border border-slate-700/50" />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-slate-400 mb-1.5">منطق</label>
              <select value={logic} onChange={e => setLogic(e.target.value as 'AND' | 'OR')} className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-300">
                <option value="AND">AND — همه شرط‌ها</option>
                <option value="OR">OR — هر شرطی</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-slate-400">قوانین فیلتر</label>
              <button onClick={addRule} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                <i className="fas fa-plus" /> اضافه کردن قانون
              </button>
            </div>
            <div className="space-y-2">
              {rules.map(rule => (
                <div key={rule.id} className="flex items-center gap-2 p-3 rounded-xl bg-slate-800/50 border border-slate-700/30">
                  <select value={rule.field} onChange={e => updateRule(rule.id, { field: e.target.value })} className="flex-1 bg-slate-900/50 border border-slate-700/50 rounded-lg px-2 py-1.5 text-xs text-slate-300">
                    {FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                  <select value={rule.operator} onChange={e => updateRule(rule.id, { operator: e.target.value as SegmentRule['operator'] })} className="bg-slate-900/50 border border-slate-700/50 rounded-lg px-2 py-1.5 text-xs text-slate-300">
                    {OPERATORS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <input value={rule.value as string} onChange={e => updateRule(rule.id, { value: e.target.value })} className="w-20 bg-slate-900/50 border border-slate-700/50 rounded-lg px-2 py-1.5 text-xs text-slate-300" dir="ltr" />
                  {rules.length > 1 && (
                    <button onClick={() => removeRule(rule.id)} className="text-slate-600 hover:text-red-400 transition-colors p-1">
                      <i className="fas fa-xmark text-xs" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {previewCount !== null && (
            <div className="flex items-center gap-2 p-3 rounded-xl text-sm border border-emerald-500/20 bg-emerald-500/5">
              <i className="fas fa-users text-emerald-400" />
              <span className="text-slate-300">این سگمنت شامل <strong className="text-emerald-400">{toPersianNum(previewCount)}</strong> کاربر می‌شود</span>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-4 border-t border-slate-700/30">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-slate-700/50 text-slate-400 text-sm">انصراف</button>
          <button onClick={handleSave} disabled={saving || !name.trim()} className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2">
            {saving && <i className="fas fa-spinner fa-spin" />}
            ذخیره سگمنت
          </button>
        </div>
      </div>
    </div>
  )
}
