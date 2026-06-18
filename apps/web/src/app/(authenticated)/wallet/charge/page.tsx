'use client';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import ChargeForm from '@/components/wallet/ChargeForm';

export default function ChargePage() {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto"
    >
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-red-400 transition-colors">
          <i className="fas fa-arrow-right text-lg" />
        </button>
        <div>
          <h1 className="font-cinzel text-2xl text-red-500">شارژ کیف پول</h1>
          <p className="text-gray-500 font-vazir text-sm">پرداخت از طریق زرین‌پال</p>
        </div>
      </div>

      <div className="dark-card rounded-2xl p-6 border border-red-900/30 bg-[#0d0d0d]">
        <ChargeForm onSuccess={() => router.push('/wallet')} />
      </div>
    </motion.div>
  );
}
