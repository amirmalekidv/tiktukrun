'use client';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { ticketsApi } from '@/lib/api/tickets';

const schema = z.object({ subject: z.string().min(5), category: z.string().min(1), message: z.string().min(20) });
type F = z.infer<typeof schema>;
const CATS = ['مالی', 'فنی', 'رزرو', 'گزارش باگ', 'سایر'];

export default function NewTicketPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<F>({ resolver: zodResolver(schema) });
  const ic = 'w-full bg-gray-900/50 border border-red-900/30 rounded-xl px-4 py-3 text-gray-200 font-vazir text-sm focus:outline-none focus:border-red-600 transition-colors';
  const onSubmit = async (data: F) => {
    try { await ticketsApi.createTicket(data); toast.success('تیکت ارسال شد!'); router.push('/tickets'); }
    catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'خطا'); }
  };
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto">
      <div className="flex items-center gap-4 mb-6"><button onClick={() => router.back()} className="text-gray-500 hover:text-red-400"><i className="fas fa-arrow-right text-lg" /></button><h1 className="font-cinzel text-2xl text-red-500">تیکت جدید</h1></div>
      <div className="dark-card rounded-2xl p-6 border border-red-900/30 bg-white/[0.03]">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div><label className="text-xs text-gray-400 font-vazir mb-1.5 block">موضوع *</label><input {...register('subject')} className={ic} placeholder="موضوع تیکت..." />{errors.subject && <p className="text-xs text-red-500 font-vazir mt-1">{errors.subject.message}</p>}</div>
          <div><label className="text-xs text-gray-400 font-vazir mb-1.5 block">دسته‌بندی *</label><select {...register('category')} className={`${ic} cursor-pointer`}><option value="">انتخاب...</option>{CATS.map(c => <option key={c}>{c}</option>)}</select></div>
          <div><label className="text-xs text-gray-400 font-vazir mb-1.5 block">پیام *</label><textarea {...register('message')} className={`${ic} resize-none h-32`} placeholder="توضیح کامل مشکل..." />{errors.message && <p className="text-xs text-red-500 font-vazir mt-1">{errors.message.message}</p>}</div>
          <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-gradient-to-r from-red-800 to-red-600 text-white font-vazir font-bold rounded-xl disabled:opacity-50">{isSubmitting ? 'در حال ارسال...' : 'ارسال تیکت'}</button>
        </form>
      </div>
    </motion.div>
  );
}
