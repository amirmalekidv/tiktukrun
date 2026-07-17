'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { monthlyApi, type MonthlyPrize, type PublicMonthlyWinner } from '@/lib/api/monthly';
import { formatToman, toPersianDigits } from '@/lib/utils';
import { resolveMediaUrl } from '@/lib/games';

const jalaliMonthFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  month: 'long',
  year: 'numeric',
  timeZone: 'Asia/Tehran',
});

function formatMonth(year: number, month: number) {
  const date = new Date(Date.UTC(year, month - 1, 1, 12));
  const parts = jalaliMonthFormatter.formatToParts(date);
  const jalaliMonth = parts.find((part) => part.type === 'month')?.value;
  const jalaliYear = parts.find((part) => part.type === 'year')?.value;

  return jalaliMonth && jalaliYear
    ? `${jalaliMonth} ${jalaliYear}`
    : jalaliMonthFormatter.format(date);
}

function prizeText(prize?: MonthlyPrize | null) {
  if (!prize) return 'در انتظار تعیین جایزه';
  const parts: string[] = [];
  if (prize.coins) parts.push(`${toPersianDigits(prize.coins)} سکه`);
  if (prize.xp) parts.push(`${toPersianDigits(prize.xp)} XP`);
  if (prize.diamonds) parts.push(`${toPersianDigits(prize.diamonds)} الماس`);
  if (prize.freeTicket) parts.push('بلیط رایگان');
  if (prize.discountCode || prize.discountPercent) parts.push('کد تخفیف');
  if (prize.title) parts.push(prize.title);
  return parts.length ? parts.join(' + ') : 'در انتظار تعیین جایزه';
}

function statusClass(status?: string) {
  if (status === 'REWARDED') return 'border-emerald-400/35 bg-emerald-400/10 text-emerald-300';
  if (status === 'SELECTED') return 'border-[#f6c453]/40 bg-[#f6c453]/12 text-[#f6d06b]';
  if (status === 'READY_TO_DRAW') return 'border-[#ff8aa7]/35 bg-[#ff6b8f]/10 text-[#ff8aa7]';
  return 'border-[#8fc9ff]/35 bg-[#8fc9ff]/10 text-[#8fc9ff]';
}

function WinnerAvatar({ winner }: { winner?: PublicMonthlyWinner | null }) {
  const user = winner?.user;
  if (!user) {
    return (
      <div className="grid h-16 w-16 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-[#8fc9ff]">
        <i className="fas fa-hourglass-half text-xl" />
      </div>
    );
  }

  return user.avatarUrl ? (
    <img
      src={resolveMediaUrl(user.avatarUrl) ?? user.avatarUrl}
      alt={user.name}
      className="h-16 w-16 rounded-2xl object-cover ring-2 ring-[#f6c453]/35"
    />
  ) : (
    <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[linear-gradient(135deg,#00f5ff,#ff00e5)] text-lg font-black text-white ring-2 ring-[#f6c453]/35">
      {user.name.slice(0, 1)}
    </div>
  );
}

export default function RafflePage() {
  const { data, isLoading, error } = useSWR('monthly-raffle', monthlyApi.getRaffle);

  if (isLoading) {
    return (
      <div className="min-h-screen px-4 pt-28">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="h-52 rounded-[24px] bg-white/[0.04] skeleton" />
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="h-80 rounded-[18px] bg-white/[0.04] skeleton" />
            <div className="h-80 rounded-[18px] bg-white/[0.04] skeleton" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen px-4 pt-32">
        <div className="mx-auto max-w-2xl rounded-[18px] border border-[#ff5470]/25 bg-[#ff5470]/10 p-8 text-center">
          <i className="fas fa-triangle-exclamation mb-4 text-3xl text-[#ff8aa7]" />
          <h1 className="text-xl font-black text-white">قرعه‌کشی در دسترس نیست</h1>
          <p className="mt-2 text-sm text-[#d5dceb]/72">بارگذاری اطلاعات قرعه‌کشی ماهانه با خطا روبه‌رو شد.</p>
        </div>
      </div>
    );
  }

  const selected = data.selectedWinner;
  const monthLabel = formatMonth(data.period.year, data.period.month);

  return (
    <div className="min-h-screen pt-24">
      <section className="relative overflow-hidden border-b border-white/10 px-4 py-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(246,196,83,0.14),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(0,245,255,0.12),transparent_34%)]" />
        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#f6c453]/30 bg-[#f6c453]/10 px-4 py-2 text-xs font-bold text-[#f6d06b]">
                <i className="fas fa-gift" />
                قرعه‌کشی ماهانه
              </div>
              <h1 className="text-4xl font-black leading-tight text-white md:text-5xl">
                قرعه کشی <span className="gradient-text">تیک تاک ران</span>
              </h1>
              <p className="mt-4 text-base leading-8 text-[#cbd5e1]/78">
                وضعیت ماه جاری، برترین بازیکنان و بازی‌ها، دلیل انتخاب برنده و جایزه پرداخت‌شده را یک‌جا ببینید.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[520px]">
              <div className="rounded-[16px] border border-white/10 bg-white/[0.04] p-4">
                <div className="text-[11px] text-[#8b95a7]">ماه</div>
                <div className="mt-1 font-black text-white">{monthLabel}</div>
              </div>
              <div className={`rounded-[16px] border p-4 ${statusClass(data.status)}`}>
                <div className="text-[11px] opacity-75">وضعیت</div>
                <div className="mt-1 font-black">{data.statusLabel}</div>
              </div>
              <div className="rounded-[16px] border border-[#f6c453]/25 bg-[#f6c453]/10 p-4">
                <div className="text-[11px] text-[#f6d06b]/72">جایزه اصلی</div>
                <div className="mt-1 text-sm font-black text-[#f6d06b]">{prizeText(data.reward)}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-10 px-4 py-10">
        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[20px] border border-[#f6c453]/25 bg-[linear-gradient(180deg,rgba(14,18,26,0.82),rgba(9,12,20,0.92))] p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-white">برنده منتخب</h2>
                <p className="mt-1 text-sm text-[#aab6c8]/76">
                  {selected ? 'برنده نهایی این ماه انتخاب شده است.' : 'برنده نهایی بعد از بسته شدن ماه انتخاب و ثبت می‌شود.'}
                </p>
              </div>
              <i className="fas fa-crown text-2xl text-[#f6d06b]" />
            </div>

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <WinnerAvatar winner={selected} />
              <div className="min-w-0 flex-1">
                <div className="text-xl font-black text-white">
                  {selected?.user?.name ?? data.currentLeader?.name ?? 'در انتظار انتخاب برنده'}
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {selected?.distributedAt ? (
                    <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 font-bold text-emerald-300">
                      جایزه پرداخت شد
                    </span>
                  ) : null}
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[#d5dceb]/82">
                    {selected ? prizeText(selected.prize) : 'فعلا پیشتاز ماه نمایش داده شده است'}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-7 text-[#cbd5e1]/74">
                  {selected?.reason ?? data.selection.explanation}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[20px] border border-white/10 bg-white/[0.035] p-6">
            <h2 className="text-xl font-black text-white">منطق انتخاب</h2>
            <div className="mt-5 grid gap-3 text-sm">
              <div className="flex items-center justify-between rounded-[14px] border border-white/10 bg-black/20 px-4 py-3">
                <span className="text-[#aab6c8]">استراتژی</span>
                <span className="font-bold text-[#8fc9ff]">قرعه‌کشی وزنی</span>
              </div>
              <div className="flex items-center justify-between rounded-[14px] border border-white/10 bg-black/20 px-4 py-3">
                <span className="text-[#aab6c8]">تعداد افراد واجد شرایط</span>
                <span className="font-bold text-white">{toPersianDigits(data.selection.eligiblePoolSize)} نفر برتر</span>
              </div>
              <div className="flex items-center justify-between rounded-[14px] border border-white/10 bg-black/20 px-4 py-3">
                <span className="text-[#aab6c8]">حداقل امتیاز</span>
                <span className="font-bold text-white">{toPersianDigits(data.selection.minScore)}</span>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-[#cbd5e1]/70">{data.selection.explanation}</p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-black text-white">بازیکنان برتر ماه</h2>
              <span className="text-xs text-[#8b95a7]">{toPersianDigits(data.topPlayers.length)} نفر</span>
            </div>
            <div className="overflow-hidden rounded-[18px] border border-white/10 bg-white/[0.035]">
              {data.topPlayers.length === 0 ? (
                <div className="p-8 text-center text-sm text-[#aab6c8]">هنوز بازیکن واجد شرایطی برای این ماه ثبت نشده است.</div>
              ) : (
                data.topPlayers.map((player) => (
                  <div key={player.userId} className="flex items-center gap-3 border-b border-white/10 px-4 py-3 last:border-b-0">
                    <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-black/25 text-sm font-black text-[#f6d06b]">
                      {toPersianDigits(player.rank)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-bold text-white">{player.name}</span>
                        {player.isEligible ? (
                          <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">واجد شرایط</span>
                        ) : null}
                      </div>
                      <div className="mt-1 text-xs text-[#8b95a7]">
                        {toPersianDigits(player.xpGained)} XP · {toPersianDigits(player.completedBookings)} رزرو · امتیاز {toPersianDigits(player.score)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-black text-white">بازی‌های برتر ماه</h2>
              <span className="text-xs text-[#8b95a7]">{toPersianDigits(data.topGames.length)} بازی</span>
            </div>
            <div className="space-y-3">
              {data.topGames.length === 0 ? (
                <div className="rounded-[18px] border border-white/10 bg-white/[0.035] p-8 text-center text-sm text-[#aab6c8]">
                  هنوز بازی‌ای برای رتبه‌بندی این ماه ثبت نشده است.
                </div>
              ) : (
                data.topGames.map((game) => (
                  <Link
                    key={game.gameId}
                    href={`/games/${game.slug || game.gameId}`}
                    className="flex items-center gap-4 rounded-[18px] border border-white/10 bg-white/[0.035] p-3 transition hover:border-[#f6c453]/35 hover:bg-white/[0.06]"
                  >
                    <div className="relative h-16 w-20 flex-shrink-0 overflow-hidden rounded-[14px] bg-black/30">
                      {game.coverImage ? (
                        <img src={resolveMediaUrl(game.coverImage)} alt={game.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-[#8fc9ff]">
                          <i className="fas fa-gamepad" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-bold text-white">{toPersianDigits(game.rank)}. {game.title}</div>
                      <div className="mt-1 text-xs text-[#8b95a7]">
                        {toPersianDigits(game.bookingsCount)} رزرو · {toPersianDigits(game.playersCount)} بازیکن · {formatToman(game.revenue)} تومان
                      </div>
                    </div>
                    <i className="fas fa-chevron-left text-xs text-[#f6d06b]" />
                  </Link>
                ))
              )}
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-black text-white">برندگان ماه‌های قبل</h2>
            <span className="text-xs text-[#8b95a7]">تاریخچه شفاف جوایز</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {data.previousWinners.length === 0 ? (
              <div className="rounded-[18px] border border-white/10 bg-white/[0.035] p-8 text-sm text-[#aab6c8]">
                هنوز برنده قبلی ثبت نشده است.
              </div>
            ) : (
              data.previousWinners.map((item) => (
                <div key={`${item.year}-${item.month}`} className="rounded-[18px] border border-white/10 bg-white/[0.035] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-black text-white">{formatMonth(item.year, item.month)}</span>
                    {item.distributedAt ? (
                      <span className="rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-bold text-emerald-300">پرداخت شده</span>
                    ) : null}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between gap-3">
                      <span className="text-[#8b95a7]">برنده</span>
                      <span className="truncate text-white">{item.raffleWinner?.user?.name ?? '-'}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-[#8b95a7]">بازیکن برتر</span>
                      <span className="truncate text-white">{item.topPlayer?.user?.name ?? '-'}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-[#8b95a7]">بازی برتر</span>
                      <span className="truncate text-white">{item.topGame?.game?.title ?? '-'}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
