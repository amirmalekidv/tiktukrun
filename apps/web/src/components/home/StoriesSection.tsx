'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { getAllReviews } from '@/lib/api'
import ReviewCard from '@/components/stories/ReviewCard'

export default function StoriesSection() {
  const { data: reviews = [], isLoading } = useSWR('all-reviews', getAllReviews)
  const visibleReviews = reviews.slice(0, 3)

  return (
    <section className="py-8">
      <div className="section-header mb-6">
        <h2 className="font-cinzel font-black text-2xl text-white text-center">
          <span className="gradient-text">داستان</span> شجاعان
        </h2>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="dark-card h-48 rounded-[20px] p-5 skeleton" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="dark-card rounded-[20px] border border-white/10 p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-[#00f5ff]/25 bg-[#00f5ff]/10 text-[#00f5ff]">
            <i className="fas fa-book-open" />
          </div>
          <h3 className="mb-2 text-sm font-bold text-white">هنوز داستانی ثبت نشده</h3>
          <p className="text-sm leading-6 text-gray-400">
            پس از اتمام بازی، تجربه بازیکنان در این بخش نمایش داده می‌شود.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {visibleReviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}

      {!isLoading && reviews.length > 0 && (
        <div className="text-center mt-8">
          <Link href="/stories" className="text-[#00f5ff] hover:text-white text-sm transition-colors">
            مشاهده همه داستان‌ها
            <i className="fas fa-chevron-left mr-2 text-xs" />
          </Link>
        </div>
      )}
    </section>
  )
}
