'use client'
import { useState } from 'react'
import type { Customer } from '@/types'

interface Props {
  customer: Customer
  onConfirm: (reason: string) => void
  onClose: () => void
}

export function BanUserModal({ customer, onConfirm, onClose }: Props) {
  const [reason, setReason] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = async () => {
    if (!reason.trim()) return
    setIsLoading(true)
    await onConfirm(reason)
    setIsLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative admin-card p-6 w-full max-w-sm animate-fade-in">
        <div className="w-12 h-12 rounded-xl bg-red-600/20 flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-ban text-2xl text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-100 text-center mb-1">مسدود کردن کاربر</h3>
        <p className="text-sm text-slate-400 text-center mb-4">{customer.name}</p>
        
        <div className="mb-4">
          <label className="block text-sm text-slate-400 mb-2">دلیل مسدود کردن</label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="دلیل مسدود کردن کاربر را وارد کنید..."
            rows={3}
            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 resize-none"
          />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-slate-700/50 text-slate-400 hover:text-slate-200 text-sm transition-colors">
            انصراف
          </button>
          <button
            onClick={handleConfirm}
            disabled={!reason.trim() || isLoading}
            className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isLoading && <i className="fas fa-spinner fa-spin" />}
            تأیید مسدودی
          </button>
        </div>
      </div>
    </div>
  )
}
