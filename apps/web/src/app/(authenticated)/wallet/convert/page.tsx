'use client';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import ConvertForm from '@/components/wallet/ConvertForm';
import { useWallet } from '@/hooks/useWallet';

export default function ConvertPage() {
  const router = useRouter();
  const { wallet, mutate } = useWallet();

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-red-400 transition-colors">
          <i className="fas fa-arrow-right text-lg" />
        </button>
        <div>
          <h1 className="font-cinzel text-2xl text-purple-400">تبدیل XP</h1>
          <p className="text-gray-500 font-vazir text-sm">XP خود را به سکه تبدیل کنید</p>
        </div>
      </div>

      <div className="dark-card rounded-2xl p-6 border border-purple-900/30 bg-white/[0.03]">
        <ConvertForm
          availableXp={(wallet as { xpBalance?: number } | null)?.xpBalance ?? 0}
          onSuccess={() => { mutate(); router.push('/wallet'); }}
        />
      </div>
    </motion.div>
  );
}
