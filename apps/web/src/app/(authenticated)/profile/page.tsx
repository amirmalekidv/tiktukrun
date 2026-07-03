'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import ProfileCard from '@/components/profile/ProfileCard';
import XpProgressBar from '@/components/profile/XpProgressBar';
import StatsGrid from '@/components/profile/StatsGrid';
import BadgesList from '@/components/profile/BadgesList';
import BadgesPossibleList from '@/components/profile/BadgesPossibleList';
import LevelTierBanner from '@/components/profile/LevelTierBanner';
import { profileApi } from '@/lib/api/profile';
import { USE_MOCK } from '@/lib/http';
import {
  getLevelXpBounds,
  normalizeBadgeCollections,
  normalizeProfilePayload,
  normalizeProfileStats,
  type BadgeViewModel,
  type ProfileViewModel,
  type StatsViewModel,
} from '@/lib/profile-adapter';

const DEMO_LEVEL = 19;
const { levelStartXp: demoLevelStartXp, levelEndXp: demoLevelEndXp } = getLevelXpBounds(DEMO_LEVEL);

// Demo profile used as fallback when API is unavailable
const DEMO_PROFILE = {
  name: 'Shadow Walker',
  nickname: 'shadow_w',
  avatar: null,
  level: DEMO_LEVEL,
  title: 'Reaper of Shadows',
  city: 'تهران',
  joinedAt: '۱۴۰۲',
  currentXp: 7200,
  levelStartXp: demoLevelStartXp,
  levelEndXp: demoLevelEndXp,
};

const DEMO_STATS = {
  totalXp: 7200,
  survivedRooms: 13,
  badgesCount: 4,
  bookingsCount: 8,
};

const DEMO_BADGES = [
  { id: 'b1', name: 'بازمانده اول', description: 'اولین اتاق ترس را تمام کردید', icon: '🏆', rarity: 'common' as const, earnedAt: '۱۴۰۳/۰۱' },
  { id: 'b2', name: 'شکارچی سایه', description: '۵ اتاق ترس را تمام کردید', icon: '🩸', rarity: 'rare' as const, earnedAt: '۱۴۰۳/۰۵' },
  { id: 'b3', name: 'دعوتگر برتر', description: '۳ نفر را دعوت کردید', icon: '👥', rarity: 'epic' as const, earnedAt: '۱۴۰۳/۰۷' },
  { id: 'b4', name: 'اسطوره گردونه', description: '۱۰ بار گردونه چرخاندید', icon: '🎡', rarity: 'legendary' as const, earnedAt: '۱۴۰۳/۰۹' },
];

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileViewModel | typeof DEMO_PROFILE | null>(null);
  const [badges, setBadges] = useState<BadgeViewModel[] | typeof DEMO_BADGES>([]);
  const [possibleBadges, setPossibleBadges] = useState<BadgeViewModel[] | typeof DEMO_BADGES>([]);
  const [stats, setStats] = useState<StatsViewModel | typeof DEMO_STATS | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      profileApi.getMe().catch(() => null),
      profileApi.getBadges().catch(() => null),
      profileApi.getStats().catch(() => null),
    ])
      .then(([pRaw, bRaw, sRaw]) => {
        const normalizedBadges = normalizeBadgeCollections(bRaw);
        const profileData = normalizeProfilePayload(pRaw, sRaw);
        const statsData = normalizeProfileStats(sRaw, normalizedBadges.earned.length);

        setProfile(profileData ?? (USE_MOCK ? DEMO_PROFILE : null));
        setBadges(normalizedBadges.earned.length ? normalizedBadges.earned : (USE_MOCK ? DEMO_BADGES : []));
        setPossibleBadges(normalizedBadges.available);
        setStats((profileData || sRaw) ? statsData : (USE_MOCK ? DEMO_STATS : null));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <i className="fas fa-skull fa-spin text-4xl text-red-600 mb-4" />
          <p className="text-gray-500 font-vazir">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!loading && !profile && !USE_MOCK) {
    return (
      <div className="flex items-center justify-center min-h-64 text-gray-500 font-vazir">
        پروفایل بارگذاری نشد
      </div>
    );
  }

  const p = profile ?? DEMO_PROFILE;
  const s = stats ?? DEMO_STATS;

  // Merge badgesCount with actual badges length
  const finalStats = {
    ...s,
    badgesCount: s.badgesCount || badges.length,
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="space-y-4">
          <ProfileCard {...p} />
          <LevelTierBanner level={p.level} />
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-4">
          <XpProgressBar
            currentXp={p.currentXp}
            levelStartXp={p.levelStartXp}
            levelEndXp={p.levelEndXp}
            level={p.level}
          />
          <StatsGrid {...finalStats} />
          <BadgesList badges={badges} />
          {possibleBadges.length > 0 && (
            <BadgesPossibleList badges={possibleBadges} />
          )}
        </div>
      </div>
    </motion.div>
  );
}
