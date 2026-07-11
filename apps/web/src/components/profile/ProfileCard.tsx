'use client';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

interface ProfileCardProps {
  name: string;
  nickname?: string;
  avatar?: string | null;
  level: number;
  title?: string;
  city?: string;
  joinedAt?: string;
  isPublic?: boolean;
  userId?: string;
}

const LEVEL_TIERS = [
  { min: 1, max: 9, label: 'Apprentice', color: '#9ca3af' },
  { min: 10, max: 19, label: 'Reaper', color: '#00f5ff' },
  { min: 20, max: 29, label: 'Shadow', color: '#7c3aed' },
  { min: 30, max: 49, label: 'Phantom', color: '#2563eb' },
  { min: 50, max: 99, label: 'Legend', color: '#d97706' },
  { min: 100, max: Infinity, label: 'Immortal', color: '#ff00e5' },
];

export function getTierForLevel(level: number) {
  return (
    LEVEL_TIERS.find((t) => level >= t.min && level <= t.max) ?? LEVEL_TIERS[0]
  );
}

export default function ProfileCard({
  name,
  nickname,
  avatar,
  level,
  title,
  city,
  joinedAt,
  isPublic = false,
  userId,
}: ProfileCardProps) {
  const tier = getTierForLevel(level);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="dark-card relative overflow-hidden rounded-[18px] p-6"
    >
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#00f5ff]/10 via-transparent to-[#b026ff]/10 pointer-events-none" />

      <div className="relative flex flex-col items-center text-center gap-4">
        {/* Avatar */}
        <div className="relative">
          <div className="w-28 h-28 rounded-full border-4 border-[#00f5ff]/35 shadow-[0_0_30px_rgba(0,245,255,0.35)] overflow-hidden bg-gray-900">
            {avatar ? (
              <Image
                src={avatar}
                alt={name}
                width={112}
                height={112}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#ff00e5] to-[#b026ff]">
                <i className="fas fa-user text-4xl text-white" />
              </div>
            )}
          </div>
          {/* Level badge */}
          <div
            className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full border-2 border-gray-900 flex items-center justify-center text-xs font-bold font-cinzel shadow-lg"
            style={{ background: tier.color }}
          >
            {level}
          </div>
        </div>

        {/* Name */}
        <div>
          <h2 className="text-2xl font-cinzel font-bold text-white">{name}</h2>
          {nickname && (
            <p className="text-[#00f5ff] text-sm font-vazir mt-0.5">@{nickname}</p>
          )}
        </div>

        {/* Title */}
        <div
          className="px-4 py-1.5 rounded-full text-sm font-cinzel border"
          style={{
            borderColor: tier.color + '60',
            color: tier.color,
            background: tier.color + '15',
          }}
        >
          <i className="fas fa-crown mr-1.5 text-xs" />
          {title || `${tier.label} سطح ${level}`}
        </div>

        {/* Meta */}
        <div className="flex items-center gap-4 text-gray-500 text-xs font-vazir">
          {city && (
            <span className="flex items-center gap-1">
              <i className="fas fa-map-marker-alt text-[#00f5ff]" />
              {city}
            </span>
          )}
          {joinedAt && (
            <span className="flex items-center gap-1">
              <i className="fas fa-calendar text-[#00f5ff]" />
              عضو از {joinedAt}
            </span>
          )}
        </div>

        {/* Actions */}
        {!isPublic && (
          <div className="flex gap-3 w-full mt-2">
            <Link
              href="/profile/edit"
              className="flex-1 text-center py-2 text-sm font-vazir rounded-lg border border-[#00f5ff]/35 text-[#00f5ff] hover:bg-[#00f5ff]/10 transition-colors"
            >
              <i className="fas fa-pen mr-1" /> ویرایش
            </Link>
            <Link
              href="/profile/avatar"
              className="flex-1 text-center py-2 text-sm font-vazir rounded-lg bg-[#b026ff]/20 border border-[#b026ff]/45 text-white hover:bg-[#b026ff]/30 transition-colors"
            >
              <i className="fas fa-palette mr-1" /> آواتار
            </Link>
          </div>
        )}

        {isPublic && userId && (
          <div className="text-xs text-gray-600 font-vazir">
            شناسه: {userId}
          </div>
        )}
      </div>
    </motion.div>
  );
}
