'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import ProfileCard from '@/components/profile/ProfileCard';
import XpProgressBar from '@/components/profile/XpProgressBar';
import StatsGrid from '@/components/profile/StatsGrid';
import BadgesList from '@/components/profile/BadgesList';
import LevelTierBanner from '@/components/profile/LevelTierBanner';
import { profileApi } from '@/lib/api/profile';

export default function PublicProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!userId) return;
    profileApi
      .getPublicProfile(userId)
      .then((d) => setProfile(d?.profile ?? null))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-64">
        <i className="fas fa-skull fa-spin text-4xl text-red-600" />
      </div>
    );

  if (error || !profile)
    return (
      <div className="text-center py-20">
        <i className="fas fa-ghost text-5xl text-gray-700 mb-4" />
        <p className="text-gray-500 font-vazir">پروفایل یافت نشد</p>
      </div>
    );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <ProfileCard
            name={profile.name}
            nickname={profile.nickname}
            avatar={profile.avatar}
            level={profile.level ?? 1}
            title={profile.title}
            city={profile.city}
            joinedAt={profile.joinedAt}
            isPublic
            userId={userId}
          />
          <LevelTierBanner level={profile.level ?? 1} />
        </div>

        <div className="lg:col-span-2 space-y-4">
          <XpProgressBar
            currentXp={profile.currentXp ?? 0}
            nextLevelXp={profile.nextLevelXp ?? 1000}
            level={profile.level ?? 1}
          />
          <StatsGrid
            totalXp={profile.totalXp ?? 0}
            survivedRooms={profile.survivedRooms ?? 0}
            badgesCount={profile.badges?.length ?? 0}
          />
          <BadgesList badges={profile.badges ?? []} />
        </div>
      </div>
    </motion.div>
  );
}
