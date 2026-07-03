'use client'

import { motion } from 'framer-motion'
import Top3Podium, { type LeaderboardEntry } from '@/components/leaderboard/Top3Podium'
import LeaderboardRow from '@/components/leaderboard/LeaderboardRow'
import PeriodToggle from '@/components/leaderboard/PeriodToggle'
import { useLeaderboard } from '@/hooks/useLeaderboard'
import { useAuthStore } from '@/store/auth.store'

export default function LeaderboardView() {
  const { entries, period, setPeriod, isLoading, hasMore, loadMore, isLoadingMore } = useLeaderboard()
  const currentUser = useAuthStore((s) => s.user)
  const currentUserId = currentUser?.id
  const displayEntries = (entries as LeaderboardEntry[])
    .slice()
    .sort((a, b) => a.rank - b.rank)
  const top3 = displayEntries.filter((e) => e.rank <= 3)
  const rest = displayEntries.filter((e) => e.rank > 3)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      <PeriodToggle value={period} onChange={setPeriod} />

      {isLoading ? (
        <div className="h-64 bg-gray-900/30 rounded-2xl animate-pulse" />
      ) : displayEntries.length === 0 ? (
        <div className="text-center py-16 dark-card rounded-2xl border border-red-900/20">
          <div className="text-5xl mb-4">🏆</div>
          <h3 className="text-xl text-white mb-2 font-vazir font-bold">هنوز رتبه‌بندی ثبت نشده</h3>
          <p className="text-gray-400 text-sm font-vazir">
            با افزایش XP بازیکنان، قهرمانان این بازه در این بخش نمایش داده می‌شوند.
          </p>
        </div>
      ) : (
        <>
          <div className="dark-card rounded-2xl p-4 border border-red-900/30 bg-[#0d0d0d]">
            <div className="mb-2 flex items-center justify-between px-2">
              <h3 className="text-sm text-gray-400 font-vazir">قهرمانان این بازه</h3>
              <span className="text-xs text-gray-600 font-vazir">
                {displayEntries.length.toLocaleString('fa-IR')} نفر ثبت‌شده
              </span>
            </div>
            <Top3Podium top3={top3} />
          </div>

          {rest.length > 0 && (
            <div className="dark-card rounded-2xl p-4 border border-red-900/20 bg-[#0d0d0d]">
              <h3 className="text-sm text-gray-500 mb-4 px-2 font-vazir">رتبه‌های بعدی</h3>
              {rest.map((entry, i) => (
                <LeaderboardRow
                  key={entry.userId}
                  entry={entry}
                  index={i}
                  isMe={!!currentUserId && entry.userId === currentUserId}
                />
              ))}
            </div>
          )}

          {hasMore && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={loadMore}
                disabled={isLoadingMore}
                className="rounded-xl border border-red-800/40 bg-red-950/20 px-5 py-3 text-sm font-vazir text-red-300 transition-colors hover:bg-red-950/35 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoadingMore ? 'در حال بارگذاری نفرات بیشتر...' : 'نمایش نفرات بیشتر'}
              </button>
            </div>
          )}
        </>
      )}
    </motion.div>
  )
}
