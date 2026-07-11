'use client';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { bookingsApi } from '@/lib/api/bookings';

interface CancelBookingDialogProps {
  bookingId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CancelBookingDialog({
  bookingId,
  isOpen,
  onClose,
  onSuccess,
}: CancelBookingDialogProps) {
  const [reason, setReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await bookingsApi.cancelBooking(bookingId, reason.trim() || undefined);
      toast.success('رزرو با موفقیت لغو شد');
      onClose();
      onSuccess?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطا در لغو رزرو';
      toast.error(msg);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white/[0.03] border border-red-900/50 rounded-2xl p-6 max-w-sm w-full"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-red-900/30 border-2 border-red-700 flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-times text-2xl text-red-500" />
              </div>
              <h3 className="font-cinzel text-white text-lg mb-1">لغو رزرو</h3>
              <p className="text-gray-500 font-vazir text-sm">
                آیا مطمئن هستید که می‌خواهید این رزرو را لغو کنید؟
              </p>
            </div>

            <div className="mb-5">
              <label className="text-xs text-gray-400 font-vazir mb-1.5 block">
                دلیل لغو (اختیاری)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-gray-900/50 border border-red-900/30 rounded-xl px-4 py-3 text-gray-200 font-vazir text-sm resize-none h-20 focus:outline-none focus:border-red-600 transition-colors placeholder-gray-600"
                placeholder="دلیل لغو را بنویسید..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 py-3 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-vazir rounded-xl transition-colors"
              >
                {cancelling ? (
                  <i className="fas fa-spinner fa-spin" />
                ) : (
                  'لغو رزرو'
                )}
              </button>
              <button
                onClick={onClose}
                disabled={cancelling}
                className="flex-1 py-3 border border-gray-700 text-gray-400 font-vazir rounded-xl hover:bg-gray-900 transition-colors"
              >
                بازگشت
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
