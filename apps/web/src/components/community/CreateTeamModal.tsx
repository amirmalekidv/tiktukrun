'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import useSWR from 'swr';
import { getGames } from '@/lib/api';
import { teamsApi } from '@/lib/api/teams';

const schema = z.object({
  name: z.string().min(3, 'نام تیم باید حداقل ۳ حرف باشد').max(50),
  description: z.string().max(200).optional(),
  maxMembers: z.coerce.number().min(2).max(12),
  gameId: z.string().min(1, 'انتخاب بازی الزامی است'),
});

type FormValues = z.infer<typeof schema>;

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateTeamModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateTeamModalProps) {
  const { data: gamesResponse, isLoading: isGamesLoading } = useSWR(
    'team-create-games',
    () => getGames({ limit: 100 })
  );
  const games = gamesResponse?.data ?? [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { maxMembers: 6 },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      await teamsApi.createTeam(data);
      toast.success('تیم با موفقیت ساخته شد!');
      reset();
      onClose();
      onSuccess?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطا در ساخت تیم';
      toast.error(msg);
    }
  };

  const inputClass =
    'w-full bg-gray-900/50 border border-red-900/30 rounded-xl px-4 py-3 text-gray-200 font-vazir text-sm focus:outline-none focus:border-red-600 transition-colors';

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
            className="bg-[#0d0d0d] border border-red-900/50 rounded-2xl p-6 max-w-md w-full"
          >
            <h2 className="font-cinzel text-red-500 text-xl mb-6 flex items-center gap-2">
              <i className="fas fa-users" />
              ساخت تیم جدید
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 font-vazir mb-1.5 block">نام تیم *</label>
                <input {...register('name')} className={inputClass} placeholder="نام تیم شما..." />
                {errors.name && <p className="text-xs text-red-500 font-vazir mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="text-xs text-gray-400 font-vazir mb-1.5 block">توضیحات</label>
                <textarea {...register('description')} className={`${inputClass} resize-none h-20`} placeholder="توضیحی کوتاه..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 font-vazir mb-1.5 block">حداکثر اعضا *</label>
                  <input {...register('maxMembers')} type="number" min={2} max={12} className={inputClass} />
                  {errors.maxMembers && <p className="text-xs text-red-500 font-vazir mt-1">{errors.maxMembers.message}</p>}
                </div>

                <div>
                  <label className="text-xs text-gray-400 font-vazir mb-1.5 block">بازی *</label>
                  <select
                    {...register('gameId')}
                    className={`${inputClass} cursor-pointer`}
                    disabled={isGamesLoading || games.length === 0}
                  >
                    <option value="">
                      {isGamesLoading ? 'در حال دریافت بازی‌ها...' : 'انتخاب کنید'}
                    </option>
                    {games.map((game) => (
                      <option key={game.id} value={game.id}>
                        {game.title}
                      </option>
                    ))}
                  </select>
                  {errors.gameId && <p className="text-xs text-red-500 font-vazir mt-1">{errors.gameId.message}</p>}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-gradient-to-r from-red-800 to-red-600 hover:from-red-700 hover:to-red-500 text-white font-vazir font-bold rounded-xl transition-all disabled:opacity-50"
                >
                  {isSubmitting ? <i className="fas fa-spinner fa-spin" /> : 'ساخت تیم'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 border border-gray-700 text-gray-400 rounded-xl font-vazir hover:bg-gray-900 transition-colors"
                >
                  انصراف
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
