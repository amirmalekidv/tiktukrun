'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import BookingStatusBadge from '@/components/bookings/BookingStatusBadge';
import CancelBookingDialog from '@/components/bookings/CancelBookingDialog';
import ReviewForm from '@/components/bookings/ReviewForm';
import { bookingsApi } from '@/lib/api/bookings';

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<any>(null);
  const [showCancel, setShowCancel] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  useEffect(() => {
    if (!id) return;
    bookingsApi.getBooking(id).then(d => setBooking(d?.booking ?? null)).catch(() => {});
  }, [id]);
  const b = booking ?? { roomName: 'اتاق فرار نمونه', date: '۱۴۰۳/۰۹/۲۰', time: '۱۸:۰۰', price: 120000, status: 'COMPLETED', id };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-red-400"><i className="fas fa-arrow-right text-lg" /></button>
        <h1 className="font-cinzel text-xl text-red-500">جزئیات رزرو</h1>
      </div>
      <div className="dark-card rounded-2xl p-6 border border-red-900/30 bg-[#0d0d0d] space-y-4">
        <div className="flex items-center justify-between"><h2 className="font-vazir text-white text-lg">{b.roomName}</h2><BookingStatusBadge status={b.status} /></div>
        <div className="grid grid-cols-2 gap-3 text-sm font-vazir">
          <div className="text-gray-500">تاریخ:<span className="text-gray-300 mr-2">{b.date}</span></div>
          <div className="text-gray-500">ساعت:<span className="text-gray-300 mr-2">{b.time}</span></div>
          <div className="text-gray-500">مبلغ:<span className="text-red-400 mr-2 font-cinzel">{b.price?.toLocaleString('fa-IR')} ت</span></div>
          <div className="text-gray-500">شناسه:<span className="text-gray-600 mr-2 text-xs">{b.id}</span></div>
        </div>
        {(b.status === 'PENDING' || b.status === 'CONFIRMED') && (
          <button onClick={() => setShowCancel(true)} className="w-full py-2.5 border border-red-900/50 text-red-500 rounded-xl font-vazir text-sm hover:bg-red-900/20">لغو رزرو</button>
        )}
      </div>
      {b.status === 'COMPLETED' && !reviewed && <ReviewForm bookingId={id} onSuccess={() => setReviewed(true)} />}
      {reviewed && <div className="text-center p-6 text-green-500 font-vazir"><i className="fas fa-check-circle text-3xl mb-2" /><p>نظر شما ثبت شد</p></div>}
      <CancelBookingDialog bookingId={id} isOpen={showCancel} onClose={() => setShowCancel(false)} onSuccess={() => router.push('/bookings')} />
    </motion.div>
  );
}
