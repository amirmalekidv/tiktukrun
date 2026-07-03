'use client';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { chatApi } from '@/lib/api/chat';

const REPORT_REASONS = [
  'محتوای توهین‌آمیز',
  'هرزه‌نگاری',
  'اسپم',
  'تهدید',
  'سایر',
];

interface ReportModalProps {
  messageId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ReportModal({ messageId, isOpen, onClose }: ReportModalProps) {
  const [selected, setSelected] = useState('');
  const [sending, setSending] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setSelected('');
      return;
    }

    const { body } = document;
    const scrollY = window.scrollY;
    const previousOverflow = body.style.overflow;
    const previousPosition = body.style.position;
    const previousTop = body.style.top;
    const previousWidth = body.style.width;

    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('keydown', handleEscape);
      body.style.overflow = previousOverflow;
      body.style.position = previousPosition;
      body.style.top = previousTop;
      body.style.width = previousWidth;
      window.scrollTo({ top: scrollY });
    };
  }, [isOpen, onClose]);

  const handleReport = async () => {
    if (!selected) {
      toast.error('لطفاً دلیل گزارش را انتخاب کنید');
      return;
    }
    setSending(true);
    try {
      await chatApi.reportMessage(messageId, selected);
      toast.success('گزارش شما ثبت شد');
      onClose();
      setSelected('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطا در ثبت گزارش';
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  if (!mounted) {
    return null;
  }

  return createPortal(
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
            className="bg-[#0d0d0d] border border-red-900/50 rounded-2xl p-6 max-w-sm w-full"
          >
            <h3 className="font-cinzel text-red-500 text-lg mb-4 flex items-center gap-2">
              <i className="fas fa-flag" />
              گزارش پیام
            </h3>

            <div className="space-y-2 mb-6">
              {REPORT_REASONS.map((reason) => (
                <button
                  type="button"
                  key={reason}
                  onClick={() => setSelected(reason)}
                  className={`
                    w-full text-right px-4 py-3 rounded-xl text-sm font-vazir transition-all border
                    ${selected === reason
                      ? 'border-red-600 bg-red-900/30 text-red-300'
                      : 'border-gray-700/50 text-gray-400 hover:border-red-900/50 hover:text-gray-300'
                    }
                  `}
                >
                  {selected === reason && (
                    <i className="fas fa-check text-red-500 ml-2 text-xs" />
                  )}
                  {reason}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleReport}
                disabled={!selected || sending}
                className="flex-1 py-2.5 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl font-vazir text-sm transition-colors"
              >
                {sending ? <i className="fas fa-spinner fa-spin" /> : 'ارسال گزارش'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 border border-gray-700 text-gray-400 rounded-xl font-vazir text-sm hover:bg-gray-900 transition-colors"
              >
                انصراف
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    ,
    document.body
  );
}
