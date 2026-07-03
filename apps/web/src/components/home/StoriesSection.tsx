'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { getAllReviews } from '@/lib/api'
import ReviewCard from '@/components/stories/ReviewCard'

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
              <ReviewCard key={review.id} review={review} />
            ))}
      </div>

      {!isLoading && reviews.length > 0 && (
        <div className="text-center mt-8">
          <Link href="/stories" className="text-red-400 hover:text-red-300 text-sm transition-colors">
            مشاهده همه داستان‌ها
            <i className="fas fa-chevron-left mr-2 text-xs" />
          </Link>
        </div>
      )}
    </section>
  )
}
