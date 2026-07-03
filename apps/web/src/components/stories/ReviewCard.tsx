import { getRelativeTime, toPersianDigits } from '@/lib/utils'
import StarRating from '@/components/ui/StarRating'
import type { Review } from '@/types'

interface ReviewCardProps {
  review: Review
  clampComment?: boolean
}

export default function ReviewCard({ review, clampComment = true }: ReviewCardProps) {
  return (
    <div className="dark-card rounded-2xl p-5 flex flex-col gap-3 h-full">
      <div className="flex items-center gap-3">
        {review.user.avatar ? (
          <img
            src={review.user.avatar}
            alt={review.user.name || 'کاربر'}
            className="w-10 h-10 rounded-full object-cover border border-red-800/40"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-red-900 flex items-center justify-center text-white font-bold">
            {(review.user.name || 'ک').charAt(0)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-white font-medium text-sm truncate">
            {review.user.name || 'بازیکن ناشناس'}
          </div>
          <div className="text-gray-500 text-xs">{getRelativeTime(review.createdAt)}</div>
        </div>
        {review.isVerified && (
          <span className="badge-blood text-[10px] flex items-center gap-1">
            <i className="fas fa-check-circle" />
            تأیید شده
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-red-400 text-xs">
          <i className="fas fa-gamepad ml-1" />
          {review.game.title}
        </span>
        <StarRating rating={review.rating} size="sm" />
      </div>

      <p
        className={`text-gray-300 text-sm leading-relaxed flex-1 ${
          clampComment ? 'line-clamp-3' : ''
        }`}
      >
        &ldquo;{review.comment}&rdquo;
      </p>

      <div className="flex items-center gap-2 text-gray-500 text-xs border-t border-red-950/40 pt-3">
        <i className="fas fa-thumbs-up text-red-600" />
        <span>{toPersianDigits(review.helpful)} نفر این را مفید یافتند</span>
      </div>
    </div>
  )
}
