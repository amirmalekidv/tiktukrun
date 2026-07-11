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
    <div className="dark-card rounded-[18px] p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <i className="fas fa-bolt text-[#00f5ff]" />
          <span className="text-sm font-vazir text-gray-300">سطح ترس‌نشناسی</span>
        </div>
        <span className="text-xs font-cinzel text-[#00f5ff]">سطح {level}</span>
      </div>

      <div dir="ltr">
        <div className="relative h-4 bg-white/[0.06] rounded-full overflow-hidden border border-white/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#00f5ff] to-[#b026ff]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
          </motion.div>
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-500 font-vazir">
            {levelStartXp.toLocaleString('fa-IR')} XP
          </span>
          <span className="text-xs text-[#00f5ff] font-cinzel">{percent}%</span>
          <span className="text-xs text-gray-500 font-vazir">
            {levelEndXp.toLocaleString('fa-IR')} XP
          </span>
        </div>
      </div>
    </div>
  );
}
