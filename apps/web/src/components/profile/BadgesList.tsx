'use client';
import { motion } from 'framer-motion';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earnedAt?: string;
}

const RARITY_COLORS = {
  common: { border: '#4b5563', glow: '#9ca3af', label: 'عادی' },
  rare: { border: '#2563eb', glow: '#3b82f6', label: 'نادر' },
  epic: { border: '#7c3aed', glow: '#8b5cf6', label: 'حماسی' },
  legendary: { border: '#d97706', glow: '#f59e0b', label: 'افسانه‌ای' },
};

// Map icon string to FontAwesome class or emoji
function BadgeIcon({ icon, color }: { icon: string; color: string }) {
  // If it's an emoji, render directly
  if (/\p{Emoji}/u.test(icon)) {
    return <span className="text-2xl">{icon}</span>;
  }
  // Otherwise treat as FontAwesome class
  return <i className={`fas ${icon.startsWith('fa-') ? icon : `fa-${icon}`} text-2xl`} style={{ color }} />;
}

interface BadgesListProps {
  badges: Badge[];
  title?: string;
}

export default function BadgesList({
  badges,
  title = 'نشان‌های کسب‌شده',
}: BadgesListProps) {
  if (!badges.length) {
    return (
      <div className="dark-card rounded-xl p-6 border border-red-900/20 bg-[#0d0d0d] text-center">
        <i className="fas fa-medal text-4xl text-gray-700 mb-3 block" />
        <p className="text-gray-500 text-sm font-vazir">هنوز نشانی کسب نشده است</p>
      </div>
    );
  }

  return (
    <div className="dark-card rounded-xl p-5 border border-red-900/20 bg-[#0d0d0d]">
      <h3 className="font-cinzel text-red-500 text-sm mb-4 flex items-center gap-2">
        <i className="fas fa-medal" />
        {title}
      </h3>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {badges.map((badge, i) => {
          const rarity = RARITY_COLORS[badge.rarity] ?? RARITY_COLORS.common;
          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="group relative flex flex-col items-center gap-2 cursor-pointer"
              title={badge.description}
            >
              <div
                className="w-14 h-14 rounded-xl border-2 flex items-center justify-center bg-gray-900/50 transition-all group-hover:scale-110"
                style={{
                  borderColor: rarity.border,
                  boxShadow: `0 0 12px ${rarity.glow}40`,
                }}
              >
                <BadgeIcon icon={badge.icon} color={rarity.glow} />
              </div>

              <span className="text-xs text-gray-400 font-vazir text-center leading-tight line-clamp-2">
                {badge.name}
              </span>

              <span className="text-[10px] font-cinzel" style={{ color: rarity.border }}>
                {rarity.label}
              </span>

              {/* Tooltip on hover */}
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-40 bg-gray-900 border border-gray-700 rounded-lg p-2 text-xs text-gray-300 font-vazir opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-center shadow-xl">
                {badge.description}
                {badge.earnedAt && (
                  <div className="text-gray-600 mt-1">{badge.earnedAt}</div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
