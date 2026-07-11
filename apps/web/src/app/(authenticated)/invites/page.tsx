'use client';
import { motion } from 'framer-motion';
import InviteCodeCard from '@/components/invites/InviteCodeCard';
import InviteRewardsBox from '@/components/invites/InviteRewardsBox';
import InviteListItem from '@/components/invites/InviteListItem';
import { useInvites } from '@/hooks/useInvites';
import { USE_MOCK } from '@/lib/http';

const DEMO_USERS = [
  { id: 'u1', name: 'Shadow Walker', joinedAt: '۱۴۰۳/۰۹/۱۵', xpEarned: 200 },
  { id: 'u2', name: 'Night Hunter', joinedAt: '۱۴۰۳/۰۹/۱۰', xpEarned: 200 },
];

export default function InvitesPage() {
  const { invite, shareLink, invitedUsers, isLoading } = useInvites();
  const code = invite?.code ?? 'SHADOW42';
  const users = invitedUsers.length > 0 ? invitedUsers : (USE_MOCK ? DEMO_USERS : []);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg mx-auto space-y-6">
      <div><h1 className="font-cinzel text-2xl text-white"><span className="gradient-text">کد دعوت</span></h1><p className="text-gray-500 font-vazir text-sm mt-1">دوستان خود را دعوت کنید و XP کسب کنید</p></div>
      <InviteCodeCard code={code} shareLink={shareLink || `https://tiktakrun.com/invite/${code}`} />
      <InviteRewardsBox usageCount={invite?.usageCount ?? users.length} totalXpEarned={invite?.totalXpEarned ?? 400} />
      <div className="dark-card rounded-[18px] p-5">
        <h3 className="font-cinzel text-[#00f5ff] text-sm mb-4 flex items-center gap-2"><i className="fas fa-list" />دعوت‌شدگان</h3>
        {isLoading ? <div className="h-20 bg-gray-900/30 rounded-xl animate-pulse" /> :
          users.length === 0 ? <p className="text-gray-600 font-vazir text-sm text-center py-6">هنوز کسی دعوت نشده</p> :
          users.map((u: any, i: number) => <InviteListItem key={u.id} user={u} index={i} />)
        }
      </div>
    </motion.div>
  );
}
