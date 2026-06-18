'use client';
import { motion } from 'framer-motion';
import Top3Podium, { type LeaderboardEntry } from '@/components/leaderboard/Top3Podium';
import LeaderboardRow from '@/components/leaderboard/LeaderboardRow';
import PeriodToggle from '@/components/leaderboard/PeriodToggle';
import { useLeaderboard } from '@/hooks/useLeaderboard';

// Demo data
const DEMO_ENTRIES: LeaderboardEntry[] = [
  { rank: 1, userId: 'u1', name: 'Shadow Reaper', level: 42, xp: 89500 },
  { rank: 2, userId: 'u2', name: 'Night Stalker', level: 38, xp: 75200 },
  { rank: 3, userId: 'u3', name: 'Void Walker', level: 35, xp: 68900 },
  { rank: 4, userId: 'u4', name: 'Phantom Queen', level: 33, xp: 62300 },
  { rank: 5, userId: 'u5', name: 'Dark Assassin', level: 30, xp: 58100 },
  { rank: 6, userId: 'u6', name: 'Blood Hunter', level: 29, xp: 54700 },
  { rank: 7, userId: 'u7', name: 'Grave Keeper', level: 27, xp: 49200 },
  { rank: 8, userId: 'u8', name: 'Chaos Bringer', level: 25, xp: 43800 },
  { rank: 9, userId: 'u9', name: 'Soul Eater', level: 23, xp: 38500 },
  { rank: 10, userId: 'u10', name: 'Death Whisper', level: 21, xp: 34200 },
];

export default function LeaderboardPage() {
  const { entries, myRank, period, setPeriod, isLoading } = useLeaderboard();

  const displayEntries = entries.length ? entries : DEMO_ENTRIES;
  const top3 = displayEntries.filter((e: any) => e.rank <= 3);
  const rest = displayEntries.filter((e: any) => e.rank > 3);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="text-center">
        <h1 className="font-cinzel text-3xl text-red-500 mb-2 tracking-widest">
          <i className="fas fa-trophy text-yellow-600 ml-3" />
          تالار قهرمانان
        </h1>
        <p className="text-gray-500 font-vazir text-sm">برترین بازیبازان پلتفرم</p>
      </div>

      {/* Period toggle */}
      <PeriodToggle value={period} onChange={setPeriod} />

      {/* My rank */}
      {myRank && (
        <div className="flex items-center justify-between p-4 bg-red-900/10 border border-red-900/30 rounded-xl">
          <span className="text-gray-400 font-vazir text-sm">رتبه شما:</span>
          <span className="font-cinzel text-red-400 text-xl font-bold">#{myRank}</span>
        </div>
      )}

      {/* Top 3 Podium */}
      {isLoading ? (
        <div className="h-64 bg-gray-900/30 rounded-2xl animate-pulse" />
      ) : (
        <div className="dark-card rounded-2xl p-4 border border-red-900/30 bg-[#0d0d0d]">
          <Top3Podium top3={top3} />
        </div>
      )}

      {/* Rest of leaderboard */}
      <div className="dark-card rounded-2xl p-4 border border-red-900/20 bg-[#0d0d0d]">
        <h3 className="font-cinzel text-gray-500 text-sm mb-4 px-2">رتبه‌های بعدی</h3>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-14 bg-gray-900/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          rest.map((entry: any, i: number) => (
            <LeaderboardRow
              key={entry.userId}
              entry={entry}
              index={i}
              isMe={entry.userId === 'me'}
            />
          ))
        )}
      </div>
    </motion.div>
  );
}
