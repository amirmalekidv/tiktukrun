'use client';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar?: string;
  level: number;
  xp: number;
  badge?: string;
}

const PODIUM_CONFIG = [
  {
    rank: 2,
    height: 'h-20',
    color: '#9ca3af',
    gradient: 'from-gray-700 to-gray-900',
    medal: '🥈',
    label: 'دوم',
    order: 'order-1',
  },
  {
    rank: 1,
    height: 'h-32',
    color: '#d97706',
    gradient: 'from-yellow-700 to-yellow-900',
    medal: '🥇',
    label: 'اول',
    order: 'order-2',
  },
  {
    rank: 3,
    height: 'h-14',
    color: '#b45309',
    gradient: 'from-amber-800 to-amber-950',
    medal: '🥉',
    label: 'سوم',
    order: 'order-3',
  },
];

interface Top3PodiumProps {
  top3: LeaderboardEntry[];
}

export default function Top3Podium({ top3 }: Top3PodiumProps) {
  // Need at least 1 entry; render gracefully for fewer than 3
  if (!top3 || top3.length === 0) return null;

  const byRank = (rank: number) => top3.find((e) => e.rank === rank);

  return (
    <div className="relative py-8">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 via-transparent to-transparent rounded-2xl pointer-events-none" />

      <div className="flex items-end justify-center gap-4 relative">
        {PODIUM_CONFIG.map(({ rank, height, color, gradient, medal, order }) => {
          const entry = byRank(rank);
          if (!entry) return null;

          return (
            <motion.div
              key={rank}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: rank === 1 ? 0 : 0.2 }}
              className={`flex flex-col items-center ${order}`}
            >
              {/* Avatar */}
              <Link href={`/profile/public/${entry.userId}`}>
                <div
                  className="w-16 h-16 rounded-full border-4 overflow-hidden mb-2 relative cursor-pointer hover:scale-110 transition-transform"
                  style={{
                    borderColor: color,
                    boxShadow: `0 0 20px ${color}60`,
                  }}
                >
                  {entry.avatar ? (
                    <Image
                      src={entry.avatar}
                      alt={entry.name}
                      width={64}
                      height={64}
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                      <i className="fas fa-skull" style={{ color }} />
                    </div>
                  )}
                </div>
              </Link>

              {/* Medal */}
              <div className="text-2xl mb-1">{medal}</div>

              {/* Name */}
              <div className="text-xs text-gray-300 font-vazir text-center mb-1 max-w-[80px] truncate">
                {entry.name}
              </div>

              {/* XP */}
              <div className="text-xs font-cinzel mb-2" style={{ color }}>
                {entry.xp.toLocaleString('fa-IR')} XP
              </div>

              {/* Podium block */}
              <div
                className={`w-20 ${height} rounded-t-xl bg-gradient-to-b ${gradient} border-t-2 flex items-center justify-center`}
                style={{ borderColor: color }}
              >
                <span className="font-cinzel font-bold text-lg" style={{ color }}>
                  {rank}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
