'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import LiveChatPanel from '@/components/community/LiveChatPanel';
import { teamsApi } from '@/lib/api/teams';

type TeamMember = {
  id: string;
  name: string;
  role: string;
  level?: number | null;
};

type TeamDetail = {
  id: string;
  name: string;
  description?: string;
  status?: string;
  currentMembers: number;
  maxMembers: number;
  gameType?: string;
  members: TeamMember[];
};

function normalizeTeam(raw: unknown): TeamDetail | null {
  if (!raw || typeof raw !== 'object') return null;

  const team = raw as {
    id?: unknown;
    name?: unknown;
    description?: unknown;
    status?: unknown;
    capacity?: unknown;
    maxMembers?: unknown;
    currentMembers?: unknown;
    gameType?: unknown;
    game?: { title?: unknown };
    members?: Array<{
      role?: unknown;
      user?: {
        id?: unknown;
        fullName?: unknown;
        profile?: { levelId?: unknown };
      };
    }>;
  };

  if (!team.id || !team.name) return null;

  const members = Array.isArray(team.members)
    ? team.members.map((member) => ({
        id: String(member.user?.id ?? ''),
        name: String(member.user?.fullName ?? 'کاربر'),
        role: String(member.role ?? 'MEMBER'),
        level:
          typeof member.user?.profile?.levelId === 'number'
            ? member.user.profile.levelId
            : null,
      }))
    : [];

  return {
    id: String(team.id),
    name: String(team.name),
    description:
      typeof team.description === 'string' ? team.description : undefined,
    status: typeof team.status === 'string' ? team.status : undefined,
    currentMembers:
      typeof team.currentMembers === 'number'
        ? team.currentMembers
        : members.length,
    maxMembers:
      typeof team.maxMembers === 'number'
        ? team.maxMembers
        : Number(team.capacity ?? members.length),
    gameType:
      typeof team.gameType === 'string'
        ? team.gameType
        : typeof team.game?.title === 'string'
          ? team.game.title
          : undefined,
    members,
  };
}

function getStatusLabel(status?: string) {
  if (status === 'FULL') return 'تکمیل شده';
  if (status === 'COMPLETED') return 'پایان یافته';
  if (status === 'CANCELLED') return 'لغو شده';
  return 'در حال تکمیل';
}

function getRoleLabel(role: string) {
  return role === 'CAPTAIN' ? 'کاپیتان' : 'عضو';
}

export default function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    teamsApi
      .getTeam(id)
      .then((raw) => {
        const payload =
          raw && typeof raw === 'object' && 'team' in (raw as Record<string, unknown>)
            ? (raw as { team?: unknown }).team
            : raw;
        setTeam(normalizeTeam(payload));
      })
      .catch((error: unknown) => {
        toast.error(error instanceof Error ? error.message : 'خطا در دریافت اطلاعات تیم');
        router.replace('/community');
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  const teamTitle = useMemo(
    () => (team ? `چت تیم ${team.name}` : 'چت تیم'),
    [team]
  );

  const handleLeave = async () => {
    setLeaving(true);
    try {
      await teamsApi.leaveTeam(id);
      toast.success('از تیم خارج شدید');
      router.push('/community');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'خطا');
      setLeaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-24 rounded-2xl bg-gray-900/50 animate-pulse" />
        <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
          <div className="h-80 rounded-2xl bg-gray-900/50 animate-pulse" />
          <div className="h-[500px] rounded-2xl bg-gray-900/50 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!team) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="dark-card rounded-2xl border border-red-900/30 bg-[#0d0d0d] p-5">
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.push('/community')}
            className="mt-1 text-gray-500 hover:text-red-400 transition-colors"
          >
            <i className="fas fa-arrow-right text-lg" />
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h1 className="font-cinzel text-2xl text-red-500">{team.name}</h1>
              <span className="rounded-lg border border-gray-800 bg-gray-900/60 px-2 py-1 text-[10px] text-gray-400 font-vazir">
                {getStatusLabel(team.status)}
              </span>
            </div>
            <p className="text-gray-500 font-vazir text-sm">
              {team.gameType ?? 'بازی نامشخص'} · {team.currentMembers.toLocaleString('fa-IR')}/
              {team.maxMembers.toLocaleString('fa-IR')} نفر
            </p>
            {team.description && (
              <p className="mt-3 text-gray-400 font-vazir text-sm leading-7">
                {team.description}
              </p>
            )}
          </div>

          <button
            onClick={handleLeave}
            disabled={leaving}
            className="px-4 py-2 border border-red-900/50 text-red-500 rounded-xl font-vazir text-sm hover:bg-red-900/20 transition-all disabled:opacity-60"
          >
            {leaving ? <i className="fas fa-spinner fa-spin" /> : 'ترک تیم'}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
        <div className="dark-card rounded-2xl border border-red-900/30 bg-[#0d0d0d] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-cinzel text-sm text-amber-400">
              <i className="fas fa-shield-halved ml-2" />
              اعضای تیم
            </h2>
            <span className="text-xs text-gray-600 font-vazir">
              {team.members.length.toLocaleString('fa-IR')} نفر
            </span>
          </div>

          <div className="space-y-3">
            {team.members.map((member) => (
              <div
                key={member.id || `${member.name}-${member.role}`}
                className="rounded-xl border border-gray-800/70 bg-gray-900/40 p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm text-white font-vazir truncate">{member.name}</div>
                    <div className="text-xs text-gray-500 font-vazir mt-1">
                      {getRoleLabel(member.role)}
                      {typeof member.level === 'number' ? ` · لول ${member.level.toLocaleString('fa-IR')}` : ''}
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-red-900/25 border border-red-900/40 flex items-center justify-center text-red-300">
                    <i className={`fas ${member.role === 'CAPTAIN' ? 'fa-crown' : 'fa-user'}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <LiveChatPanel roomType="team" teamId={id} title={teamTitle} />
      </div>
    </motion.div>
  );
}
