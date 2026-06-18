'use client';
import { useState } from 'react';
import { Modal } from '@/components/ui';
import { bookingsApi } from '@/lib/api';
import { formatToman } from '@/lib/utils/format';
import toast from 'react-hot-toast';
import { Loader2, AlertTriangle } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  bookingId: string;
  totalAmount: string;
  onSuccess: () => void;
}

export default function RefundDialog({ open, onClose, bookingId, totalAmount, onSuccess }: Props) {
  const [reason, setReason] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [fullRefund, setFullRefund] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error('دلیل بازگشت وجه را وارد کنید');
      return;
    }
    setLoading(true);
    try {
      await bookingsApi.refund(bookingId, reason, fullRefund ? undefined : customAmount);
      toast.success('درخواست بازگشت وجه ثبت شد');
      onSuccess();
      onClose();
    } catch {
      toast.error('خطا در ثبت بازگشت وجه');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="بازگشت وجه (Refund)"
      size="md"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">انصراف</button>
          <button onClick={handleSubmit} disabled={loading} className="btn-danger">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            تأیید بازگشت وجه
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
          <p className="text-yellow-300 text-sm">این عملیات در زرین‌پال ثبت شده و قابل بازگشت نیست.</p>
        </div>

        <div className="p-4 bg-slate-700/30 rounded-xl">
          <p className="text-slate-400 text-sm">مبلغ کل رزرو</p>
          <p className="text-white font-bold text-xl mt-1">{formatToman(totalAmount)}</p>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => setFullRefund(true)}
            className={`w-full p-3 rounded-xl border text-right text-sm transition-all ${
              fullRefund ? 'border-green-500 bg-green-500/10 text-green-400' : 'border-slate-700 text-slate-400 hover:border-slate-600'
            }`}
          >
            بازگشت کامل — {formatToman(totalAmount)}
          </button>
          <button
            onClick={() => setFullRefund(false)}
            className={`w-full p-3 rounded-xl border text-right text-sm transition-all ${
              !fullRefund ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-slate-700 text-slate-400 hover:border-slate-600'
            }`}
          >
            مبلغ دلخواه
          </button>
        </div>

        {!fullRefund && (
          <div>
            <label className="label-field">مبلغ بازگشتی (تومان)</label>
            <input
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="input-field"
              placeholder="مثال: 500000"
            />
          </div>
        )}

        <div>
          <label className="label-field">دلیل بازگشت وجه *</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="input-field resize-none h-20"
            placeholder="دلیل بازگشت وجه را توضیح دهید..."
          />
        </div>
      </div>
    </Modal>
  );
}
