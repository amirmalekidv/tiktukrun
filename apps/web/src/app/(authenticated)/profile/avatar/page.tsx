'use client';
import { motion } from 'framer-motion';
import AvatarCustomizer from '@/components/profile/AvatarCustomizer';
import { useRouter } from 'next/navigation';

export default function AvatarPage() {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="text-gray-500 hover:text-red-400 transition-colors"
        >
          <i className="fas fa-arrow-right text-lg" />
        </button>
        <div>
          <h1 className="font-cinzel text-2xl text-red-500">تنظیم آواتار</h1>
          <p className="text-gray-500 font-vazir text-sm mt-1">
            آواتار منحصربه‌فرد خود را بسازید
          </p>
        </div>
      </div>

      <AvatarCustomizer onSave={() => router.push('/profile')} />
    </motion.div>
  );
}
