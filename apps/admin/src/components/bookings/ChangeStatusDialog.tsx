'use client';
import { useState } from 'react';
import { Modal } from '@/components/ui';
import { bookingsApi } from '@/lib/api';
import type { BookingStatus } from '@/lib/types';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

const STATUSES: { value: BookingStatus; label: string; color: string }[] = [
  { value: 'PENDING', label: 'در انتظار', color: 'border-yellow-500 text-yellow-400' },
  { value: 'CONFIRMED', label: 'تأیید شده', color: 'border-blue-500 text-blue-400' },
  { value: 'COMPLETED', label: 'تکمیل شده', color: 'border-green-500 text-green-400' },
  { value: 'CANCELLED', label: 'لغو شده', color: 'border-red-500 text-red-400' },
  { value: 'REFUNDED', label: 'بازگشت وجه', color: 'border-purple-500 text-purple-400' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  bookingId: string;
  currentStatus: BookingStatus;
  onSuccess: () => void;
}

export default function ChangeStatusDialog({ open, onClose, bookingId, currentStatus, onSuccess }: Props) {
  const [selected, setSelected] = useState<BookingStatus>(currentStatus);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await bookingsApi.changeStatus(bookingId, selected, note);
      toast.success('وضعیت رزرو تغییر کرد');
      onSuccess();
      onClose();
    } catch {
      toast.error('خطا در تغییر وضعیت');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="تغییر وضعیت رزرو"
      size="md"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">انصراف</button>
          <button
            onClick={handleSubmit}
            disabled={loading || selected === currentStatus}
            className="btn-primary"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            ذخیره تغییرات
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => setSelected(s.value)}
              disabled={s.value === currentStatus}
              className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                selected === s.value
                  ? s.color + ' bg-white/5'
                  : 'border-slate-700 text-slate-400 hover:border-slate-500'
              } ${s.value === currentStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {s.label}
              {s.value === currentStatus && ' (فعلی)'}
            </button>
          ))}
        </div>

        <div>
          <label className="label-field">یادداشت (اختیاری)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="input-field resize-none h-24"
            placeholder="دلیل تغییر وضعیت را بنویسید..."
          />
        </div>
      </div>
    </Modal>
  );
}
