'use client';
import { motion } from 'framer-motion';
import { getTierForLevel } from './ProfileCard';

interface LevelTierBannerProps {
  level: number;
}

const TIER_ICONS: Record<string, string> = {
  Apprentice: 'fa-seedling',
  Reaper: 'fa-skull',
  Shadow: 'fa-ghost',
  Phantom: 'fa-eye',
  Legend: 'fa-crown',
  Immortal: 'fa-infinity',
};

export default function LevelTierBanner({ level }: LevelTierBannerProps) {
  const tier = getTierForLevel(level);
  const icon = TIER_ICONS[tier.label] ?? 'fa-star';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden rounded-xl p-4 border"
      style={{
        borderColor: tier.color + '40',
        background: `linear-gradient(135deg, ${tier.color}15 0%, transparent 60%)`,
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-xl border-2"
          style={{
            borderColor: tier.color + '50',
            background: tier.color + '20',
            color: tier.color,
            boxShadow: `0 0 20px ${tier.color}30`,
          }}
        >
          <i className={`fas ${icon}`} />
        </div>
        <div>
          <div className="font-cinzel font-bold" style={{ color: tier.color }}>
            {tier.label}
          </div>
          <div className="text-xs text-gray-500 font-vazir">
            سطح {level} — {tier.max === Infinity ? 'بالاترین مرتبه' : `${tier.max - level + 1} تا سطح بعدی`}
          </div>
        </div>

        {/* Glow effect */}
        <div
          className="absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-10"
          style={{ background: tier.color }}
        />
      </div>
    </motion.div>
  );
}
