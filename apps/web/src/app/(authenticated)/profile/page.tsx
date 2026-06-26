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

// Demo profile used as fallback when API is unavailable
const DEMO_PROFILE = {
  name: 'Shadow Walker',
  nickname: 'shadow_w',
  avatar: null,
  level: 19,
  title: 'Reaper of Shadows',
  city: 'تهران',
  joinedAt: '۱۴۰۲',
  currentXp: 7200,
  nextLevelXp: 10000,
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
  const [profile, setProfile] = useState<typeof DEMO_PROFILE | null>(null);
  const [badges, setBadges] = useState<typeof DEMO_BADGES>([]);
  const [possibleBadges, setPossibleBadges] = useState<typeof DEMO_BADGES>([]);
  const [stats, setStats] = useState<typeof DEMO_STATS | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      profileApi.getMe().catch(() => null),
      profileApi.getBadges().catch(() => null),
      profileApi.getStats().catch(() => null),
    ])
      .then(([pRaw, bRaw, sRaw]) => {
        const b = bRaw as { earned?: typeof DEMO_BADGES; available?: typeof DEMO_BADGES } | null;
        const s = sRaw as { stats?: typeof DEMO_STATS } | null;

        let profileData: typeof DEMO_PROFILE | null = USE_MOCK ? DEMO_PROFILE : null;
        if (pRaw && typeof pRaw === 'object') {
          if ('profile' in pRaw && (pRaw as { profile?: typeof DEMO_PROFILE }).profile) {
            profileData = (pRaw as { profile: typeof DEMO_PROFILE }).profile;
          } else if ('name' in pRaw) {
            profileData = pRaw as typeof DEMO_PROFILE;
          }
        }

        let statsData: typeof DEMO_STATS | null = USE_MOCK ? DEMO_STATS : null;
        if (sRaw && typeof sRaw === 'object') {
          if ('stats' in sRaw && (sRaw as { stats?: typeof DEMO_STATS }).stats) {
            statsData = (sRaw as { stats: typeof DEMO_STATS }).stats;
          } else if ('totalXp' in sRaw) {
            statsData = sRaw as typeof DEMO_STATS;
          }
        }

        setProfile(profileData);
        setBadges(b?.earned ?? (USE_MOCK ? DEMO_BADGES : []));
        setPossibleBadges(b?.available ?? []);
        setStats(statsData);
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
            nextLevelXp={p.nextLevelXp}
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
