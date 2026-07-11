'use client';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import BalanceTile from './BalanceTile';

interface WalletCardProps {
  tomanBalance: number;
  diamondsBalance: number;
  coinsBalance: number;
}

export default function WalletCard({
  tomanBalance,
  diamondsBalance,
  coinsBalance,
}: WalletCardProps) {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="dark-card rounded-[18px] p-6 relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#00f5ff]/10 rounded-full -translate-y-16 translate-x-16 pointer-events-none blur-2xl" />

      <div className="relative">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#b026ff] to-[#00f5ff] flex items-center justify-center shadow-[0_0_20px_rgba(0,245,255,0.32)]">
            <i className="fas fa-wallet text-[#04121a]" />
          </div>
          <div>
            <h2 className="font-cinzel text-xl text-white">خزانه</h2>
            <p className="text-xs text-gray-500 font-vazir">کیف پول دیجیتال</p>
          </div>
        </div>

        {/* Balances */}
        <div className="space-y-3 mb-6">
          <BalanceTile currency="toman" amount={tomanBalance} />
          <BalanceTile currency="diamonds" amount={diamondsBalance} />
          <BalanceTile currency="coins" amount={coinsBalance} />
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push('/wallet/charge')}
            className="flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#00f5ff] to-[#00b3ff] text-[#04121a] font-vazir font-bold text-sm rounded-xl transition-all shadow-[0_0_20px_rgba(0,245,255,0.35)] hover:-translate-y-0.5"
          >
            <i className="fas fa-plus" />
            شارژ کیف
          </button>
          <button
            onClick={() => router.push('/wallet/convert')}
            className="flex items-center justify-center gap-2 py-3 border border-[#b026ff]/45 text-[#b026ff] hover:bg-[#b026ff]/10 font-vazir text-sm rounded-xl transition-all"
          >
            <i className="fas fa-exchange-alt" />
            تبدیل XP
          </button>
          <button
            onClick={() => router.push('/wallet/diamonds')}
            className="flex items-center justify-center gap-2 py-3 border border-cyan-800/50 text-cyan-400 hover:bg-cyan-900/10 font-vazir text-sm rounded-xl transition-all"
          >
            <i className="fas fa-gem" />
            خرید الماس
          </button>
          <button
            onClick={() => router.push('/wallet/coins')}
            className="flex items-center justify-center gap-2 py-3 border border-amber-800/50 text-amber-400 hover:bg-amber-900/10 font-vazir text-sm rounded-xl transition-all"
          >
            <i className="fas fa-circle" />
            خرید سکه
          </button>
        </div>
      </div>
    </motion.div>
  );
}
