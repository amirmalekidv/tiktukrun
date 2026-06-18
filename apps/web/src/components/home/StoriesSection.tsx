'use client'

import useSWR from 'swr'
import { getAllReviews } from '@/lib/api'
import { getRelativeTime, toPersianDigits } from '@/lib/utils'
import StarRating from '@/components/ui/StarRating'

export default function StoriesSection() {
  const { data: reviews = [], isLoading } = useSWR('all-reviews', getAllReviews)

  return (
    <section className="py-8">
      <div className="section-header mb-8">
        <h2 className="font-cinzel font-bold text-2xl text-white text-center">
          <span className="blood-text">داستان</span> شجاعان
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="dark-card rounded-2xl p-5 h-48 skeleton" />
            ))
          : reviews.slice(0, 6).map((review) => (
              <div key={review.id} className="dark-card rounded-2xl p-5 flex flex-col gap-3">
                {/* Header */}
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

                {/* Game + Rating */}
                <div className="flex items-center justify-between">
                  <span className="text-red-400 text-xs">
                    <i className="fas fa-gamepad ml-1" />
                    {review.game.title}
                  </span>
                  <StarRating rating={review.rating} size="sm" />
                </div>

                {/* Comment */}
                <p className="text-gray-300 text-sm leading-relaxed line-clamp-3 flex-1">
                  "{review.comment}"
                </p>

                {/* Helpful */}
                <div className="flex items-center gap-2 text-gray-500 text-xs border-t border-red-950/40 pt-3">
                  <i className="fas fa-thumbs-up text-red-600" />
                  <span>{toPersianDigits(review.helpful)} نفر این را مفید یافتند</span>
                </div>
              </div>
            ))}
      </div>
    </section>
  )
}
