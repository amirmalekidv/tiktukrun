'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { getAllReviews } from '@/lib/api'
import { toPersianDigits } from '@/lib/utils'
import ReviewCard from '@/components/stories/ReviewCard'

export default function StoriesPage() {
  const { data: reviews = [], isLoading } = useSWR('all-reviews-page', getAllReviews)

  return (
    <div className="min-h-screen pt-24">
      <div className="relative py-16 mb-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 to-bg-dark" />
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(rgba(220,38,38,0.5) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(220,38,38,0.5) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <div className="text-5xl mb-4">
            <i className="fas fa-book text-red-500" />
          </div>
          <h1 className="font-cinzel font-black text-4xl md:text-5xl text-white mb-3 flicker">
            داستان‌ها
          </h1>
          <p className="text-gray-300 text-lg">داستان شجاعان قلمرو</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-20">
        <p className="text-gray-400 mb-6">
          {isLoading ? '...' : `${toPersianDigits(reviews.length)} داستان`}
        </p>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="dark-card rounded-2xl p-5 h-48 skeleton" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📖</div>
            <h3 className="font-cinzel text-xl text-white mb-2">هنوز داستانی ثبت نشده</h3>
            <p className="text-gray-400 mb-6">پس از اتمام بازی، تجربه خود را با دیگر شجاعان به اشتراک بگذارید.</p>
            <Link href="/games" className="btn-blood mt-4 inline-block">
              کشف بازی‌ها
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} clampComment={false} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
