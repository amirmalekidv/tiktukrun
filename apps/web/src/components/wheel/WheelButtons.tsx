'use client';
import { motion } from 'framer-motion';

interface WheelButtonsProps {
  onSpin: (paidWith: 'xp' | 'coins' | 'diamonds') => void;
  isSpinning: boolean;
  eligibility?: {
    canSpinWithXp?: boolean;
    canSpinWithCoins?: boolean;
    canSpinWithDiamonds?: boolean;
    nextSpinAt?: string;
  } | null;
}

export default function WheelButtons({
  onSpin,
  isSpinning,
  eligibility,
}: WheelButtonsProps) {
  const buttons = [
    {
      type: 'xp' as const,
      label: 'با ۲۰ XP',
      icon: 'fa-bolt',
      color: '#8b5cf6',
      can: eligibility?.canSpinWithXp ?? true,
      bg: 'from-[#b026ff]/30 to-[#b026ff]/10 border-[#b026ff]/40',
      active: 'hover:border-[#b026ff]/70',
    },
    {
      type: 'coins' as const,
      label: 'با ۵۰۰ سکه',
      icon: 'fa-circle',
      color: '#f59e0b',
      can: eligibility?.canSpinWithCoins ?? true,
      bg: 'from-[#ffd700]/25 to-[#ffd700]/10 border-[#ffd700]/40',
      active: 'hover:border-[#ffd700]/70',
    },
    {
      type: 'diamonds' as const,
      label: 'با ۵ الماس',
      icon: 'fa-gem',
      color: '#22d3ee',
      can: eligibility?.canSpinWithDiamonds ?? true,
      bg: 'from-[#00f5ff]/25 to-[#00f5ff]/10 border-[#00f5ff]/40',
      active: 'hover:border-[#00f5ff]/70',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {buttons.map(({ type, label, icon, color, can, bg, active }) => (
        <motion.button
          key={type}
          whileHover={{ scale: can && !isSpinning ? 1.04 : 1 }}
          whileTap={{ scale: can && !isSpinning ? 0.96 : 1 }}
          onClick={() => can && !isSpinning && onSpin(type)}
          disabled={!can || isSpinning}
          className={`
            relative flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 bg-gradient-to-b
            transition-all font-vazir text-sm
            ${bg} ${can && !isSpinning ? active : ''}
            ${!can || isSpinning ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          {!can && (
            <div className="absolute top-1.5 right-1.5">
              <i className="fas fa-lock text-[10px] text-gray-600" />
            </div>
          )}
          <i
            className={`fas ${icon} text-xl`}
            style={{ color, filter: `drop-shadow(0 0 6px ${color}80)` }}
          />
          <span className="text-gray-300 text-xs text-center leading-tight">
            {label}
          </span>
        </motion.button>
      ))}
    </div>
  );
}
