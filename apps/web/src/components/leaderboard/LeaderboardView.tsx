'use client'

import { motion } from 'framer-motion'
import Top3Podium, { type LeaderboardEntry } from '@/components/leaderboard/Top3Podium'
import LeaderboardRow from '@/components/leaderboard/LeaderboardRow'
import PeriodToggle from '@/components/leaderboard/PeriodToggle'
import { useLeaderboard } from '@/hooks/useLeaderboard'
import { getXpProgressMeta } from '@/lib/profile-adapter'
import { useAuthStore } from '@/store/auth.store'

export default function LeaderboardView() {
  const { entries, myRank, myXp, period, setPeriod, isLoading, hasMore, loadMore, isLoadingMore } = useLeaderboard()
  const currentUser = useAuthStore((s) => s.user)
  const currentUserId = currentUser?.id
  const hasXp = (myXp ?? 0) > 0
  const myProgress = getXpProgressMeta(myXp ?? 0)
  const fallbackEntry: LeaderboardEntry[] =
    !entries.length && hasXp && myRank != null && !!currentUserId
      ? [{
          rank: myRank,
          userId: currentUserId,
          name: currentUser?.name ?? 'شما',
          avatar: currentUser?.avatar,
          level: myProgress.level,
          xp: myXp ?? 0,
        }]
      : []

  const displayEntries = ((entries.length ? entries : fallbackEntry) as LeaderboardEntry[])
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

      {myXp != null && (
        <div className="relative overflow-hidden rounded-2xl border border-red-900/30 bg-[radial-gradient(circle_at_top_right,rgba(153,27,27,0.35),transparent_45%),linear-gradient(135deg,rgba(35,8,8,0.98),rgba(14,8,8,0.95))] p-5">
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(220,38,38,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(220,38,38,0.07)_1px,transparent_1px)] bg-[size:24px_24px] opacity-30" />
          <div className="relative space-y-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-red-800/40 bg-red-950/30 px-3 py-1 text-xs text-red-300 font-vazir">
                  <i className="fas fa-bolt text-red-400" />
                  XP تجربهٔ شما در قلمرو است و با بازی و فعالیت بیشتر بالا می‌رود
                </div>
                <div>
                  <h3 className="text-xl text-white font-vazir font-bold">وضعیت شما در جدول شجاعان</h3>
                  <p className="mt-1 text-sm text-gray-400 font-vazir">
                    {hasXp
                      ? `${myProgress.title}، سطح ${myProgress.level} با ${myXp.toLocaleString('fa-IR')} XP`
                      : 'هنوز XP نگرفته‌اید. اولین بازی یا فعالیت شما این بخش را فعال می‌کند.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 md:min-w-[260px]">
                <div className="rounded-xl border border-red-900/30 bg-black/20 p-3 text-center">
                  <div className="text-xs text-gray-500 font-vazir mb-1">رتبه شما</div>
                  <div className="text-2xl text-red-400 font-cinzel font-bold">
                    {myRank != null ? `#${myRank}` : '---'}
                  </div>
                </div>
                <div className="rounded-xl border border-red-900/30 bg-black/20 p-3 text-center">
                  <div className="text-xs text-gray-500 font-vazir mb-1">لول فعلی</div>
                  <div className="text-2xl text-white font-cinzel font-bold">
                    {hasXp ? myProgress.level.toLocaleString('fa-IR') : '۱'}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_160px] md:items-center">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm font-vazir">
                  <span className="text-gray-400">پیشرفت تا سطح بعدی</span>
                  <span className="text-red-300">
                    {hasXp
                      ? `${myProgress.progressPercent.toLocaleString('fa-IR')}٪`
                      : '۰٪'}
                  </span>
                </div>
                <div dir="ltr" className="h-3 overflow-hidden rounded-full border border-red-900/30 bg-black/40">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-red-950 via-red-700 to-red-400 transition-[width] duration-500"
                    style={{ width: `${hasXp ? myProgress.progressPercent : 0}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 font-vazir">
                  <span>{myProgress.levelStartXp.toLocaleString('fa-IR')} XP</span>
                  <span>{myProgress.levelEndXp.toLocaleString('fa-IR')} XP</span>
                </div>
              </div>

              <div className="rounded-xl border border-amber-700/30 bg-amber-950/10 p-3 text-center">
                <div className="text-xs text-amber-200/70 font-vazir mb-1">XP فعلی</div>
                <div className="text-2xl text-amber-300 font-cinzel font-bold">
                  {(myXp ?? 0).toLocaleString('fa-IR')}
                </div>
                <div className="mt-1 text-xs text-gray-500 font-vazir">
                  {hasXp ? `${myProgress.xpToNextLevel.toLocaleString('fa-IR')} XP تا سطح بعدی` : 'با اولین XP اینجا زنده می‌شود'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="h-64 bg-gray-900/30 rounded-2xl animate-pulse" />
      ) : displayEntries.length === 0 ? (
        <div className="text-center py-16 dark-card rounded-2xl border border-red-900/20">
          <div className="text-5xl mb-4">🏆</div>
          <h3 className="text-xl text-white mb-2 font-vazir font-bold">
            {hasXp ? 'هنوز هم‌رقیبی در این بازه ثبت نشده' : 'هنوز رتبه‌بندی ثبت نشده'}
          </h3>
          <p className="text-gray-400 text-sm font-vazir">
            {hasXp
              ? `شما ${myXp?.toLocaleString('fa-IR')} XP دارید و به‌محض ثبت امتیاز بازیکنان دیگر، جدول این بازه کامل می‌شود.`
              : 'بازی کنید و XP جمع کنید تا در جدول شجاعان ظاهر شوید.'}
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
