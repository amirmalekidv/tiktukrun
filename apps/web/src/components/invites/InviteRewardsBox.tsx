'use client';
import { motion } from 'framer-motion';
interface Props { usageCount: number; totalXpEarned: number; }
export default function InviteRewardsBox({ usageCount, totalXpEarned }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="dark-card rounded-[18px] p-5 text-center">
        <i className="fas fa-user-friends text-2xl text-green-500 mb-2" />
        <div className="font-cinzel text-3xl text-green-400 font-bold">{usageCount.toLocaleString('fa-IR')}</div>
        <div className="text-xs text-gray-500 font-vazir mt-1">دعوت‌شده</div>
      </motion.div>
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ delay: 0.1 }} className="dark-card rounded-[18px] p-5 text-center">
        <i className="fas fa-bolt text-2xl text-purple-500 mb-2" />
        <div className="font-cinzel text-3xl text-purple-400 font-bold">{totalXpEarned.toLocaleString('fa-IR')}</div>
        <div className="text-xs text-gray-500 font-vazir mt-1">XP کسب‌شده</div>
      </motion.div>
    </div>
  );
}
