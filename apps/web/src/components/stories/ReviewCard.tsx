import { getRelativeTime, toPersianDigits } from '@/lib/utils'
import StarRating from '@/components/ui/StarRating'
import type { Review } from '@/types'

interface ReviewCardProps {
  review: Review
  clampComment?: boolean
}

export default function ReviewCard({ review, clampComment = true }: ReviewCardProps) {
  const userName = review.user?.name || 'بازیکن ناشناس'
  const userAvatar = review.user?.avatar
  const gameTitle = review.game?.title || 'بازی'
  const comment = review.comment?.trim() || 'بدون توضیح'

  return (
    <article className="dark-card group relative isolate flex h-full min-h-[190px] flex-col gap-3 overflow-hidden rounded-[20px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(0,245,255,0.12),transparent_36%),linear-gradient(180deg,rgba(15,20,30,0.9),rgba(8,11,18,0.94))] p-4 transition-all duration-300 hover:-translate-y-1 hover:border-[#00f5ff]/45 sm:p-5">
      <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-l from-transparent via-[#00f5ff]/55 to-transparent" />

      <div className="flex items-start gap-3">
        {userAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={userAvatar}
            alt={userName}
            className="h-11 w-11 shrink-0 rounded-full border border-[#00f5ff]/35 object-cover shadow-[0_0_18px_rgba(0,245,255,0.16)]"
          />
        ) : (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#ff00e5]/25 bg-gradient-to-br from-[#ff00e5] to-[#b026ff] text-base font-bold text-white shadow-[0_0_18px_rgba(176,38,255,0.18)]">
            {userName.charAt(0)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h3 className="min-w-0 max-w-full truncate text-sm font-bold text-white">
              {userName}
            </h3>
            {review.isVerified && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#00f5ff]/35 bg-[#00f5ff]/10 px-2.5 py-1 text-[10px] font-bold leading-none text-[#00f5ff]">
                <i className="fas fa-check-circle" />
                تأیید شده
              </span>
            )}
          </div>
          <time dateTime={review.createdAt} className="mt-1 block text-xs text-gray-500">
            {getRelativeTime(review.createdAt)}
          </time>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-2.5">
        <span className="flex min-w-0 items-center gap-2 text-xs font-medium text-[#00f5ff]">
          <i className="fas fa-gamepad shrink-0 text-[11px]" />
          <span className="truncate">{gameTitle}</span>
        </span>
        <StarRating rating={review.rating} size="sm" />
      </div>

      <p
        className={`flex-1 break-words text-sm leading-7 text-gray-300 ${
          clampComment ? 'line-clamp-3' : ''
        }`}
      >
        &ldquo;{comment}&rdquo;
      </p>

      <div className="mt-auto flex min-w-0 items-center gap-2 border-t border-white/10 pt-3 text-xs text-gray-500">
        <i className="fas fa-thumbs-up shrink-0 text-[#00f5ff]" />
        <span className="truncate">{toPersianDigits(review.helpful)} نفر این را مفید یافتند</span>
      </div>
    </article>
  )
}
