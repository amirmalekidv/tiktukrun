'use client';
import useSWR from 'swr';
import { motion } from 'framer-motion';
import { teamsApi } from '@/lib/api/teams';
import TeamCard from './TeamCard';
import toast from 'react-hot-toast';

interface Team {
  id: string;
  name: string;
  description?: string;
  currentMembers: number;
  maxMembers: number;
  gameType?: string;
  leaderId?: string;
  status?: string;
}

const DEMO_TEAMS: Team[] = [
  { id: 't1', name: 'شکارچیان شب', description: 'آماده برای اتاق فرار', currentMembers: 4, maxMembers: 6, gameType: 'فرار از اتاق' },
  { id: 't2', name: 'ارواح بلاتکلیف', description: 'دنبال بازیکن مجرب', currentMembers: 2, maxMembers: 4, gameType: 'وحشت' },
  { id: 't3', name: 'سایه‌های سرگردان', description: 'تیم کامل برای رقابت', currentMembers: 5, maxMembers: 6, gameType: 'معمایی' },
];

export default function ActiveTeamsList() {
  const {
    data,
    isLoading,
    mutate,
  } = useSWR('active-teams', () =>
    teamsApi.getActiveTeams().catch(() => null)
  );

  const teams: Team[] = data?.teams ?? DEMO_TEAMS;

  const handleJoin = async (teamId: string) => {
    try {
      await teamsApi.joinTeam(teamId);
      toast.success('به تیم پیوستید!');
      mutate();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطا در پیوستن به تیم';
      toast.error(msg);
    }
  };

  return (
    <div className="dark-card rounded-2xl p-5 border border-red-900/30 bg-[#0d0d0d]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-cinzel text-red-500 text-sm">
          <i className="fas fa-users ml-2" />
          تیم‌های فعال
        </h3>
        <span className="text-xs text-gray-600 font-vazir">
          {teams.length} تیم در حال شکل‌گیری
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-900/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : teams.length === 0 ? (
        <div className="text-center py-10 text-gray-600 font-vazir text-sm">
          <i className="fas fa-users-slash text-3xl mb-3 block" />
          هیچ تیم فعالی وجود ندارد
        </div>
      ) : (
        <div className="space-y-3">
          {teams.map((team, i) => (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              <TeamCard team={team} onJoin={() => handleJoin(team.id)} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
