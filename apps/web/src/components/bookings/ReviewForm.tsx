'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { bookingsApi } from '@/lib/api/bookings';
interface Props { bookingId: string; onSuccess?: () => void; }
export default function ReviewForm({ bookingId, onSuccess }: Props) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const handle = async () => {
    if (!comment.trim()) { toast.error('لطفاً نظر خود را بنویسید'); return; }
    setLoading(true);
    try { await bookingsApi.submitReview(bookingId, { rating, comment }); toast.success('نظر ثبت شد!'); onSuccess?.(); }
    catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'خطا'); }
    finally { setLoading(false); }
  };
  return (
    <div className="dark-card rounded-2xl p-5 border border-red-900/30 bg-[#0d0d0d]">
      <h3 className="font-cinzel text-red-500 text-sm mb-4"><i className="fas fa-star ml-2" />ثبت نظر</h3>
      <div className="flex gap-2 mb-4">{[1,2,3,4,5].map(s => (
        <button key={s} onClick={() => setRating(s)} className={`text-2xl transition-all ${s <= rating ? 'text-yellow-400' : 'text-gray-700'}`}>★</button>
      ))}</div>
      <textarea value={comment} onChange={e => setComment(e.target.value)} className="w-full bg-gray-900/50 border border-red-900/30 rounded-xl px-4 py-3 text-gray-200 font-vazir text-sm resize-none h-24 mb-4 focus:outline-none" placeholder="تجربه خود را بنویسید..." />
      <button onClick={handle} disabled={loading} className="w-full py-3 bg-gradient-to-r from-red-800 to-red-600 text-white font-vazir rounded-xl disabled:opacity-50">{loading ? 'در حال ارسال...' : 'ثبت نظر'}</button>
    </div>
  );
}
