'use client';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import type { LeaderboardEntry } from './Top3Podium';

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  isMe?: boolean;
  index: number;
}

export default function LeaderboardRow({ entry, isMe, index }: LeaderboardRowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`
        flex items-center gap-4 py-3 px-4 rounded-xl transition-all
        ${isMe
          ? 'bg-red-900/20 border border-red-700/40'
          : 'hover:bg-gray-900/40'
        }
      `}
    >
      {/* Rank */}
      <div className="w-8 text-center font-cinzel font-bold text-gray-500 flex-shrink-0">
        {entry.rank}
      </div>

      {/* Avatar */}
      <Link href={`/profile/public/${entry.userId}`}>
        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-700 flex-shrink-0 cursor-pointer hover:border-red-600 transition-colors">
          {entry.avatar ? (
            <Image
              src={entry.avatar}
              alt={entry.name}
              width={40}
              height={40}
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
              <i className="fas fa-skull text-gray-600 text-sm" />
            </div>
          )}
        </div>
      </Link>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-vazir truncate ${isMe ? 'text-red-300 font-bold' : 'text-gray-300'}`}>
          {entry.name}
          {isMe && <span className="mr-2 text-xs text-red-500">(شما)</span>}
        </div>
        <div className="text-xs text-gray-600 font-cinzel">سطح {entry.level}</div>
      </div>

      {/* XP */}
      <div className="text-sm font-cinzel text-red-400 flex-shrink-0">
        {entry.xp.toLocaleString('fa-IR')} XP
      </div>
    </motion.div>
  );
}
