'use client';
import { motion } from 'framer-motion';

interface XpProgressBarProps {
  currentXp: number;
  levelStartXp: number;
  levelEndXp: number;
  level: number;
}

export default function XpProgressBar({
  currentXp,
  levelStartXp,
  levelEndXp,
  level,
}: XpProgressBarProps) {
  const range = levelEndXp - levelStartXp;
  const percent =
    range > 0
      ? Math.min(100, Math.max(0, Math.round(((currentXp - levelStartXp) / range) * 100)))
      : 100;

  return (
    <div className="dark-card rounded-xl p-5 border border-red-900/30 bg-[#0d0d0d]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <i className="fas fa-bolt text-red-500" />
          <span className="text-sm font-vazir text-gray-300">سطح ترس‌نشناسی</span>
        </div>
        <span className="text-xs font-cinzel text-red-400">سطح {level}</span>
      </div>

      <div dir="ltr">
        <div className="relative h-4 bg-gray-900 rounded-full overflow-hidden border border-red-900/30">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-red-900 to-red-500"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
          </motion.div>
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-500 font-vazir">
            {levelStartXp.toLocaleString('fa-IR')} XP
          </span>
          <span className="text-xs text-red-600 font-cinzel">{percent}%</span>
          <span className="text-xs text-gray-500 font-vazir">
            {levelEndXp.toLocaleString('fa-IR')} XP
          </span>
        </div>
      </div>
    </div>
  );
}
