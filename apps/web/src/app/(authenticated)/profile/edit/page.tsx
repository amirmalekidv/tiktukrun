'use client';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { profileApi } from '@/lib/api/profile';

const schema = z.object({
  name: z.string().min(2, 'نام باید حداقل ۲ حرف باشد').max(50),
  nickname: z
    .string()
    .min(3, 'نام کاربری باید حداقل ۳ حرف باشد')
    .max(30)
    .regex(/^[a-z0-9_]+$/, 'فقط حروف انگلیسی، اعداد و _ مجاز است')
    .optional()
    .or(z.literal('')),
  email: z.string().email('ایمیل نامعتبر است'),
  bio: z.string().max(250, 'بیو حداکثر ۲۵۰ کاراکتر').optional().or(z.literal('')),
  city: z.string().max(50).optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

export default function ProfileEditPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    profileApi.getMe().then((d) => {
      if (d?.profile) reset(d.profile);
    }).catch(() => {});
  }, [reset]);

  const onSubmit = async (data: FormValues) => {
    try {
      await profileApi.updateProfile(data);
      toast.success('پروفایل با موفقیت بروزرسانی شد');
      router.push('/profile');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطا در بروزرسانی';
      toast.error(msg);
    }
  };

  const inputClass =
    'w-full bg-gray-900/50 border border-red-900/30 rounded-xl px-4 py-3 text-gray-200 font-vazir text-sm focus:outline-none focus:border-red-600 transition-colors placeholder-gray-600';
  const labelClass = 'text-xs font-vazir text-gray-400 mb-1.5 block';
  const errorClass = 'text-xs text-red-500 font-vazir mt-1';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-lg mx-auto"
    >
      <div className="dark-card rounded-2xl p-8 border border-red-900/30 bg-[#0d0d0d]">
        <div className="mb-6">
          <h1 className="font-cinzel text-2xl text-red-500">ویرایش پروفایل</h1>
          <p className="text-gray-500 font-vazir text-sm mt-1">
            اطلاعات حساب کاربری خود را بروز کنید
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className={labelClass}>نام کامل *</label>
            <input {...register('name')} className={inputClass} placeholder="نام شما" />
            {errors.name && <p className={errorClass}>{errors.name.message}</p>}
          </div>

          <div>
            <label className={labelClass}>نام کاربری</label>
            <input
              {...register('nickname')}
              className={inputClass}
              placeholder="shadow_walker"
              dir="ltr"
            />
            {errors.nickname && (
              <p className={errorClass}>{errors.nickname.message}</p>
            )}
          </div>

          <div>
            <label className={labelClass}>ایمیل *</label>
            <input
              {...register('email')}
              type="email"
              className={inputClass}
              placeholder="email@example.com"
              dir="ltr"
            />
            {errors.email && <p className={errorClass}>{errors.email.message}</p>}
          </div>

          <div>
            <label className={labelClass}>شهر</label>
            <input
              {...register('city')}
              className={inputClass}
              placeholder="تهران"
            />
            {errors.city && <p className={errorClass}>{errors.city.message}</p>}
          </div>

          <div>
            <label className={labelClass}>بیوگرافی</label>
            <textarea
              {...register('bio')}
              className={`${inputClass} resize-none h-24`}
              placeholder="چند جمله درباره خودتان..."
            />
            {errors.bio && <p className={errorClass}>{errors.bio.message}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-gradient-to-r from-red-800 to-red-600 hover:from-red-700 hover:to-red-500 text-white font-vazir font-bold rounded-xl transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <><i className="fas fa-spinner fa-spin ml-2" />در حال ذخیره...</>
              ) : (
                <><i className="fas fa-save ml-2" />ذخیره تغییرات</>
              )}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-700 text-gray-400 rounded-xl font-vazir hover:bg-gray-900 transition-colors"
            >
              انصراف
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
