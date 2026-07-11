'use client';

import useSWR from 'swr';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { TEAMS_SWR_KEYS, teamsApi } from '@/lib/api/teams';
import { USE_MOCK } from '@/lib/http';
import { useAuthStore } from '@/store/auth.store';
import TeamCard from './TeamCard';

interface Team {
  id: string;
  name: string;
  description?: string;
  currentMembers: number;
  maxMembers: number;
  gameType?: string;
  leaderId?: string;
  status?: string;
  isCurrentUserOwner?: boolean;
  isCurrentUserMember?: boolean;
}

const DEMO_TEAMS: Team[] = [
  { id: 't1', name: 'شکارچیان شب', description: 'آماده برای اتاق فرار', currentMembers: 4, maxMembers: 6, gameType: 'فرار از اتاق' },
  { id: 't2', name: 'ارواح بلاتکلیف', description: 'دنبال بازیکن مجرب', currentMembers: 2, maxMembers: 4, gameType: 'وحشت' },
  { id: 't3', name: 'سایه‌های سرگردان', description: 'تیم کامل برای رقابت', currentMembers: 5, maxMembers: 6, gameType: 'معمایی' },
];

function toNumber(value: unknown, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function normalizeTeam(raw: unknown): Team | null {
  if (!raw || typeof raw !== 'object') return null;

  const team = raw as {
    id?: unknown;
    name?: unknown;
    description?: unknown;
    currentMembers?: unknown;
    maxMembers?: unknown;
    capacity?: unknown;
    gameType?: unknown;
    status?: unknown;
    leaderId?: unknown;
    captainId?: unknown;
    captain?: { id?: unknown };
    isCurrentUserOwner?: unknown;
    isCurrentUserMember?: unknown;
    _count?: { members?: unknown };
    game?: { title?: unknown };
  };

  if (!team.id || !team.name) return null;

  return {
    id: String(team.id),
    name: String(team.name),
    description:
      typeof team.description === 'string' ? team.description : undefined,
    currentMembers: toNumber(team.currentMembers ?? team._count?.members, 0),
    maxMembers: toNumber(team.maxMembers ?? team.capacity, 0),
    gameType:
      typeof team.gameType === 'string'
        ? team.gameType
        : typeof team.game?.title === 'string'
          ? team.game.title
          : undefined,
    leaderId:
      typeof team.leaderId === 'string'
        ? team.leaderId
        : typeof team.captainId === 'string'
          ? team.captainId
          : typeof team.captain?.id === 'string'
            ? team.captain.id
            : undefined,
    status: typeof team.status === 'string' ? team.status : undefined,
    isCurrentUserOwner:
      typeof team.isCurrentUserOwner === 'boolean'
        ? team.isCurrentUserOwner
        : undefined,
    isCurrentUserMember:
      typeof team.isCurrentUserMember === 'boolean'
        ? team.isCurrentUserMember
        : undefined,
  };
}

function parseTeams(
  payload: { teams?: unknown[]; data?: unknown[] } | unknown[] | null | undefined,
  fallback: Team[] = []
) {
  const rawTeams = Array.isArray(payload)
    ? payload
    : payload?.teams ?? payload?.data ?? fallback;

  return rawTeams
    .map((team) => normalizeTeam(team))
    .filter((team): team is Team => team !== null);
}

function TeamSection({
  title,
  icon,
  accentClassName,
  count,
  emptyText,
  teams,
  currentUserId,
  onJoin,
}: {
  title: string;
  icon: string;
  accentClassName: string;
  count: number;
  emptyText: string;
  teams: Team[];
  currentUserId?: string;
  onJoin: (teamId: string) => void;
}) {
  return (
    <div className="dark-card rounded-[18px] p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className={`font-cinzel text-sm ${accentClassName}`}>
          <i className={`${icon} ml-2`} />
          {title}
        </h3>
        <span className="text-xs text-gray-600 font-vazir">
          {count.toLocaleString('fa-IR')} تیم
        </span>
      </div>

      {teams.length === 0 ? (
        <div className="text-center py-10 text-gray-600 font-vazir text-sm">
          <i className="fas fa-users-slash text-3xl mb-3 block" />
          {emptyText}
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
              <TeamCard
                team={team}
                isOwner={
                  team.isCurrentUserOwner ??
                  (!!currentUserId && team.leaderId === currentUserId)
                }
                isMember={team.isCurrentUserMember}
                onJoin={() => onJoin(team.id)}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ActiveTeamsList() {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const {
    data: activeData,
    isLoading: isActiveLoading,
    mutate: mutateActive,
  } = useSWR(TEAMS_SWR_KEYS.active, () =>
    teamsApi.getActiveTeams().catch(() => null)
  );
  const {
    data: myTeamsData,
    isLoading: isMyTeamsLoading,
    mutate: mutateMyTeams,
  } = useSWR(currentUserId ? TEAMS_SWR_KEYS.mine : null, () =>
    teamsApi.getMyTeams().catch(() => null)
  );

  const activePayload = activeData as
    | { teams?: unknown[]; data?: unknown[] }
    | unknown[]
    | null
    | undefined;
  const myTeamsPayload = myTeamsData as
    | { teams?: unknown[]; data?: unknown[] }
    | unknown[]
    | null
    | undefined;

  const myTeams = parseTeams(myTeamsPayload);
  const myTeamIds = new Set(myTeams.map((team) => team.id));
  const activeTeams = parseTeams(activePayload, USE_MOCK ? DEMO_TEAMS : []).filter(
    (team) => !myTeamIds.has(team.id)
  );
  const isLoading = isActiveLoading || (Boolean(currentUserId) && isMyTeamsLoading);

  const mutateAll = async () => {
    await Promise.all([mutateActive(), mutateMyTeams()]);
  };

  const handleJoin = async (teamId: string) => {
    try {
      await teamsApi.joinTeam(teamId);
      toast.success('به تیم پیوستید!');
      await mutateAll();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطا در پیوستن به تیم';
      toast.error(msg);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <div
            key={i}
            className="dark-card rounded-[18px] p-5"
          >
            <div className="space-y-3">
              {[...Array(2)].map((__, j) => (
                <div key={j} className="h-24 bg-gray-900/50 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!!myTeams.length && (
        <TeamSection
          title="تیم‌های من"
          icon="fas fa-user-friends"
          accentClassName="text-amber-400"
          count={myTeams.length}
          emptyText="هنوز عضو هیچ تیمی نیستید"
          teams={myTeams}
          currentUserId={currentUserId}
          onJoin={handleJoin}
        />
      )}

      <TeamSection
        title="تیم‌های در حال عضوگیری"
        icon="fas fa-users"
        accentClassName="text-[#00f5ff]"
        count={activeTeams.length}
        emptyText="هیچ تیمی برای عضویت وجود ندارد"
        teams={activeTeams}
        currentUserId={currentUserId}
        onJoin={handleJoin}
      />
    </div>
  );
}
