'use client';
import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import BookingStatusBadge from '@/components/bookings/BookingStatusBadge';
import CancelBookingDialog from '@/components/bookings/CancelBookingDialog';
import ReviewForm from '@/components/bookings/ReviewForm';
import { bookingsApi } from '@/lib/api/bookings';

function BookingDetailContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [booking, setBooking] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCancel, setShowCancel] = useState(false);
  const [reviewed, setReviewed] = useState(false);

  useEffect(() => {
    const paymentStatus = searchParams.get('status');
    if (paymentStatus === 'success') {
      toast.success('پرداخت رزرو با موفقیت انجام شد');
    } else if (paymentStatus === 'failed') {
      toast.error('پرداخت رزرو ناموفق بود');
    }
  }, [searchParams]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    bookingsApi
      .getById(id)
      .then((data) => {
        setBooking(data as Record<string, unknown>);
        setError(null);
      })
      .catch((e: Error) => setError(e.message || 'خطا در بارگذاری رزرو'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="text-center text-gray-400 py-20 font-vazir">در حال بارگذاری...</div>;
  }

  if (error || !booking) {
    return (
      <div className="text-center text-red-400 py-20 font-vazir">
        {error ?? 'رزرو یافت نشد'}
      </div>
    );
  }

  const b = booking as {
    id: string;
    status: string;
    code?: string;
    gameName?: string;
    game?: { title?: string };
    scheduledAt?: string;
    slotDateTime?: string;
    totalAmount?: number;
  };
  const scheduledAt = b.scheduledAt ?? b.slotDateTime;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-red-400">
          <i className="fas fa-arrow-right text-lg" />
        </button>
        <h1 className="font-cinzel text-xl text-red-500">جزئیات رزرو</h1>
      </div>
      <div className="dark-card rounded-2xl p-6 border border-red-900/30 bg-[#0d0d0d] space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-vazir text-white text-lg">{b.gameName ?? b.game?.title ?? 'رزرو'}</h2>
          <BookingStatusBadge status={b.status as never} />
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm font-vazir">
          <div className="text-gray-500 col-span-2">
            زمان:
            <span className="text-gray-300 mr-2">
              {scheduledAt ? new Date(scheduledAt).toLocaleString('fa-IR') : '—'}
            </span>
          </div>
          <div className="text-gray-500">
            مبلغ:
            <span className="text-red-400 mr-2 font-cinzel">
              {Number(b.totalAmount ?? 0).toLocaleString('fa-IR')} ت
            </span>
          </div>
          <div className="text-gray-500">
            کد رزرو:
            <span className="text-gray-600 mr-2 text-xs">{b.code ?? b.id}</span>
          </div>
        </div>
        {(b.status === 'PENDING' || b.status === 'CONFIRMED') && (
          <button
            onClick={() => setShowCancel(true)}
            className="w-full py-2.5 border border-red-900/50 text-red-500 rounded-xl font-vazir text-sm hover:bg-red-900/20"
          >
            لغو رزرو
          </button>
        )}
      </div>
      {b.status === 'COMPLETED' && !reviewed && (
        <ReviewForm bookingId={id} onSuccess={() => setReviewed(true)} />
      )}
      {reviewed && (
        <div className="text-center p-6 text-green-500 font-vazir">
          <i className="fas fa-check-circle text-3xl mb-2" />
          <p>نظر شما ثبت شد</p>
        </div>
      )}
      {showCancel && (
        <CancelBookingDialog
          bookingId={id}
          isOpen={showCancel}
          onClose={() => setShowCancel(false)}
          onSuccess={() => router.push('/bookings')}
        />
      )}
    </motion.div>
  );
}

export default function BookingDetailPage() {
  return (
    <Suspense fallback={<div className="text-center text-gray-400 py-20">...</div>}>
      <BookingDetailContent />
    </Suspense>
  );
}
