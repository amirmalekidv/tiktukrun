'use client';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { teamsApi } from '@/lib/api/teams';

const schema = z.object({
  name: z.string().min(3).max(50),
  description: z.string().max(200).optional(),
  maxMembers: z.coerce.number().min(2).max(12),
  gameType: z.string().optional(),
});
type F = z.infer<typeof schema>;

export default function NewTeamPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<F>({ resolver: zodResolver(schema), defaultValues: { maxMembers: 6 } });
  const ic = 'w-full bg-gray-900/50 border border-red-900/30 rounded-xl px-4 py-3 text-gray-200 font-vazir text-sm focus:outline-none focus:border-red-600 transition-colors';
  const onSubmit = async (data: F) => {
    try { await teamsApi.createTeam(data); toast.success('تیم ساخته شد!'); router.push('/community'); }
    catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'خطا'); }
  };
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-red-400 transition-colors"><i className="fas fa-arrow-right text-lg" /></button>
        <h1 className="font-cinzel text-2xl text-red-500">ساخت تیم جدید</h1>
      </div>
      <div className="dark-card rounded-2xl p-6 border border-red-900/30 bg-[#0d0d0d]">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div><label className="text-xs text-gray-400 font-vazir mb-1.5 block">نام تیم *</label><input {...register('name')} className={ic} placeholder="نام تیم..." />{errors.name && <p className="text-xs text-red-500 font-vazir mt-1">{errors.name.message}</p>}</div>
          <div><label className="text-xs text-gray-400 font-vazir mb-1.5 block">توضیحات</label><textarea {...register('description')} className={`${ic} resize-none h-20`} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs text-gray-400 font-vazir mb-1.5 block">حداکثر اعضا</label><input {...register('maxMembers')} type="number" min={2} max={12} className={ic} /></div>
            <div><label className="text-xs text-gray-400 font-vazir mb-1.5 block">نوع بازی</label><select {...register('gameType')} className={`${ic} cursor-pointer`}><option value="">انتخاب...</option><option>فرار از اتاق</option><option>وحشت</option><option>معمایی</option></select></div>
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-gradient-to-r from-red-800 to-red-600 text-white font-vazir font-bold rounded-xl disabled:opacity-50">{isSubmitting ? 'در حال ذخیره...' : 'ساخت تیم'}</button>
        </form>
      </div>
    </motion.div>
  );
}
