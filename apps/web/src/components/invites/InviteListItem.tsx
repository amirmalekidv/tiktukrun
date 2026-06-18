'use client';
interface User { id: string; name: string; joinedAt: string; xpEarned: number; }
interface Props { user: User; index?: number; }
export default function InviteListItem({ user, index = 0 }: Props) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-900/60 last:border-b-0">
      <div className="w-8 h-8 rounded-full bg-red-950 flex items-center justify-center text-red-400 text-sm font-cinzel flex-shrink-0">{index + 1}</div>
      <div className="flex-1 min-w-0"><p className="text-sm text-gray-300 font-vazir truncate">{user.name}</p><p className="text-xs text-gray-600 font-vazir">{user.joinedAt}</p></div>
      <div className="text-xs font-cinzel text-purple-400">+{user.xpEarned} XP</div>
    </div>
  );
}
