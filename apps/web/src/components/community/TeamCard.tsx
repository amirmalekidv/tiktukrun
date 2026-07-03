'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';

export interface Team {
  id: string;
  name: string;
  description?: string;
  gameType?: string;
  maxMembers: number;
  currentMembers: number;
  status?: string;
  leaderId?: string;
  isCurrentUserOwner?: boolean;
  isCurrentUserMember?: boolean;
}

interface TeamCardProps {
  team: Team;
  onJoin?: (teamId: string) => void;
  isJoining?: boolean;
  isOwner?: boolean;
  isMember?: boolean;
}

export default function TeamCard({
  team,
  onJoin,
  isJoining,
  isOwner = false,
  isMember = false,
}: TeamCardProps) {
  const currentMembers = Number.isFinite(team.currentMembers)
    ? team.currentMembers
    : 0;
  const maxMembers = Number.isFinite(team.maxMembers) && team.maxMembers > 0
    ? team.maxMembers
    : 1;
  const progress = Math.min(100, (currentMembers / maxMembers) * 100);
  const isFull = currentMembers >= maxMembers;
  const badgeText = isOwner ? 'مالک' : isMember ? 'عضو' : null;
  const canOpenTeamRoom = isOwner || isMember;
  const memberActionText =
    team.status === 'FULL' || team.status === 'COMPLETED'
      ? 'چت تیم'
      : 'مشاهده';
  const statusText =
    team.status === 'FULL'
      ? 'تکمیل شده'
      : team.status === 'COMPLETED'
        ? 'پایان یافته'
        : team.status === 'CANCELLED'
          ? 'لغو شده'
          : 'در حال تکمیل';

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="dark-card rounded-xl border border-red-900/30 bg-[#0d0d0d] p-4 hover:border-red-700/40 transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Team name */}
          <div className="flex items-center gap-2 mb-1">
            <i className="fas fa-users text-red-500 text-xs flex-shrink-0" />
            <Link
              href={`/community/teams/${team.id}`}
              className="font-cinzel text-sm text-white hover:text-red-400 transition-colors truncate"
            >
              {team.name}
            </Link>
          </div>

          {/* Game type */}
          {team.gameType && (
            <div className="text-xs text-gray-600 font-vazir mb-2">
              <i className="fas fa-gamepad ml-1" />
              {team.gameType}
            </div>
          )}

          <div className="inline-flex items-center rounded-lg border border-gray-800 bg-gray-900/60 px-2 py-1 text-[10px] text-gray-400 font-vazir mb-3">
            <i className="fas fa-signal ml-1" />
            {statusText}
          </div>

          {/* Description */}
          {team.description && (
            <p className="text-xs text-gray-500 font-vazir line-clamp-2 mb-3">
              {team.description}
            </p>
          )}

          {/* Member progress bar */}
          <div className="mb-1">
            <div className="flex justify-between text-[10px] text-gray-600 font-vazir mb-1">
              <span>اعضا</span>
              <span>
                {currentMembers.toLocaleString('fa-IR')} /{' '}
                {maxMembers.toLocaleString('fa-IR')}
              </span>
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={`h-full rounded-full ${
                  isFull
                    ? 'bg-red-600'
                    : 'bg-gradient-to-r from-red-800 to-red-500'
                }`}
              />
            </div>
          </div>
        </div>

        {badgeText ? (
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <div className="px-3 py-1.5 rounded-lg text-xs font-vazir border border-amber-700/40 bg-amber-900/20 text-amber-300">
              {badgeText}
            </div>
            {canOpenTeamRoom && (
              <Link
                href={`/community/teams/${team.id}`}
                className="px-3 py-1.5 rounded-lg text-xs font-vazir border border-red-700/40 bg-red-900/30 text-red-300 hover:bg-red-800/40 transition-all"
              >
                {memberActionText}
              </Link>
            )}
          </div>
        ) : (
          <button
            onClick={() => {
              if (!isFull && !isJoining && onJoin) {
                onJoin(team.id);
              }
            }}
            disabled={isFull || isJoining}
            className={`
              flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-vazir transition-all
              ${
                isFull
                  ? 'bg-gray-900 text-gray-600 border border-gray-800 cursor-not-allowed'
                  : 'bg-red-900/40 border border-red-700/40 text-red-400 hover:bg-red-800/50 hover:border-red-600/60 cursor-pointer'
              }
            `}
          >
            {isJoining ? (
              <i className="fas fa-spinner fa-spin" />
            ) : isFull ? (
              'پر شد'
            ) : (
              'عضویت'
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
}
