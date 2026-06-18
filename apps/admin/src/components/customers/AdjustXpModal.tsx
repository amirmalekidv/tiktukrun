'use client'
import { useState } from 'react'
import { toPersianNum } from '@/lib/utils'

interface Props {
  onConfirm: (amount: number, reason: string) => void
  onClose: () => void
}

export function AdjustXpModal({ onConfirm, onClose }: Props) {
  const [amount, setAmount] = useState(0)
  const [reason, setReason] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative admin-card p-6 w-full max-w-sm animate-fade-in">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">تنظیم XP</h3>
        <div className="space-y-4 mb-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">مقدار XP (منفی برای کم کردن)</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(Number(e.target.value))}
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2.5 text-sm text-slate-200"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">دلیل</label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="دلیل تغییر XP..."
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600"
            />
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-slate-700/50 text-slate-400 text-sm">انصراف</button>
          <button
            onClick={() => onConfirm(amount, reason)}
            disabled={amount === 0 || !reason}
            className="flex-1 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            اعمال {amount > 0 ? '+' : ''}{toPersianNum(amount)} XP
          </button>
        </div>
      </div>
    </div>
  )
}
