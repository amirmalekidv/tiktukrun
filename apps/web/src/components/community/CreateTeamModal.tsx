'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import useSWR, { mutate } from 'swr';
import { getGames } from '@/lib/api';
import { TEAMS_SWR_KEYS, teamsApi } from '@/lib/api/teams';

const schema = z.object({
  name: z.string().min(3, 'نام تیم باید حداقل ۳ حرف باشد').max(50),
  description: z.string().max(200).optional(),
  maxMembers: z.coerce.number().min(2).max(12),
  gameId: z.string().min(1, 'انتخاب بازی الزامی است'),
});

type FormValues = z.infer<typeof schema>;

function upsertTeamInCache(
  cachedValue: unknown,
  createdTeam: Record<string, unknown>
) {
  const addTeam = (items: unknown[]) => [
    createdTeam,
    ...items.filter((item) => {
      if (!item || typeof item !== 'object') return true;
      return (item as { id?: unknown }).id !== createdTeam.id;
    }),
  ];

  if (Array.isArray(cachedValue)) {
    return addTeam(cachedValue);
  }

  if (cachedValue && typeof cachedValue === 'object') {
    const payload = cachedValue as { data?: unknown[]; teams?: unknown[] };

    if (Array.isArray(payload.data)) {
      return { ...payload, data: addTeam(payload.data) };
    }

    if (Array.isArray(payload.teams)) {
      return { ...payload, teams: addTeam(payload.teams) };
    }
  }

  return [createdTeam];
}

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
      const createdTeam = await teamsApi.createTeam(data);
      const optimisticTeam =
        createdTeam && typeof createdTeam === 'object'
          ? {
              ...(createdTeam as Record<string, unknown>),
              currentMembers: 1,
              isCurrentUserOwner: true,
              isCurrentUserMember: true,
            }
          : null;

      if (optimisticTeam) {
        await mutate(
          TEAMS_SWR_KEYS.mine,
          (currentValue: unknown) =>
            upsertTeamInCache(currentValue, optimisticTeam),
          { revalidate: false }
        );
      }

      await Promise.all([
        mutate(TEAMS_SWR_KEYS.mine),
        mutate(TEAMS_SWR_KEYS.active),
      ]);
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
    'input-gothic text-sm';

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
            className="dark-card rounded-[18px] p-6 max-w-md w-full"
          >
            <h2 className="font-cinzel text-[#00f5ff] text-xl mb-6 flex items-center gap-2">
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
                  className="btn-blood flex-1 py-3 font-vazir font-bold disabled:opacity-50"
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
