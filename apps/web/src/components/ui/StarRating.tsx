import { toPersianDigits } from '@/lib/utils'

interface StarRatingProps {
  rating: number | null | undefined
  totalReviews?: number | null
  size?: 'sm' | 'md'
  showCount?: boolean
}

export default function StarRating({ rating, totalReviews, size = 'md', showCount = false }: StarRatingProps) {
  const safeRating = Number.isFinite(Number(rating)) ? Number(rating) : 0
  const stars = Math.max(0, Math.min(5, Math.round(safeRating)))

  return (
    <div className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
      <div className={`star-rating flex gap-0.5 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className={i < stars ? 'text-yellow-400' : 'text-gray-600'}>
            ★
          </span>
        ))}
      </div>
      <span className={`font-bold text-white ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
        {toPersianDigits(safeRating.toFixed(1))}
      </span>
      {showCount && totalReviews !== undefined && totalReviews !== null && (
        <span className="text-gray-500 text-xs">
          ({toPersianDigits(Number(totalReviews) || 0)} نظر)
        </span>
      )}
    </div>
  )
}
