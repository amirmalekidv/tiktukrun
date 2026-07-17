'use client'

import { useState } from 'react'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import useSWR from 'swr'
import { getGameBySlug, getReviews } from '@/lib/api'
import { DIFFICULTY_FA, CATEGORY_FA } from '@/types'
import { formatToman, toPersianDigits, getRelativeTime } from '@/lib/utils'
import FearMeter from '@/components/ui/FearMeter'
import StarRating from '@/components/ui/StarRating'
import PriceTag from '@/components/ui/PriceTag'
import { GameDetailSkeleton } from '@/components/ui/LoadingSkeleton'
import BookingWidget from '@/components/booking/BookingWidget'
import TierBadge from '@/components/games/TierBadge'
import LikeButton from '@/components/games/LikeButton'
import GameComments from '@/components/games/GameComments'
import { GAME_COVER_PLACEHOLDER, shouldBypassImageOptimization } from '@/lib/games'

export default function GameDetailPage({ params }: { params: { slug: string } }) {
  const { slug } = params
  const [activeImageIdx, setActiveImageIdx] = useState(0)
  const [teaserOpen, setTeaserOpen] = useState(false)

  const { data: game, isLoading } = useSWR(slug ? `game-${slug}` : null, () => getGameBySlug(slug))
  const { data: reviews = [] } = useSWR(game?.id ? `reviews-${game.id}` : null, () => getReviews(game!.id))

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 max-w-7xl mx-auto px-4">
        <GameDetailSkeleton />
      </div>
    )
  }

  if (!game) {
    notFound()
  }

  const galleryImages = game.images ?? []
  const allImages = game.coverImage
    ? [
        { id: 'cover', url: game.coverImage, alt: game.title, isPrimary: true },
        ...galleryImages
          .filter((img) => img.url !== game.coverImage)
          .map((img) => ({ ...img, isPrimary: false })),
      ]
    : galleryImages.length > 0
      ? galleryImages
      : [{ id: '0', url: GAME_COVER_PLACEHOLDER, alt: game.title, isPrimary: true }]
  const activeImage = allImages[activeImageIdx]?.url || game.coverImage || GAME_COVER_PLACEHOLDER
  const unoptimizedHero = shouldBypassImageOptimization(activeImage)

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-[#00f5ff] transition-colors">خانه</Link>
          <i className="fas fa-chevron-left text-xs" />
          <Link href="/games" className="hover:text-[#00f5ff] transition-colors">بازی‌ها</Link>
          <i className="fas fa-chevron-left text-xs" />
          <span className="text-gray-300">{game.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column - Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hero image / Gallery */}
            <section className="dark-card rounded-2xl overflow-hidden">
              <div className="relative aspect-video overflow-hidden">
                <Image
                  src={activeImage}
                  alt={game.title}
                  fill
                  unoptimized={unoptimizedHero}
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                {/* Teaser play button */}
                {game.teaserUrl && (
                  <button
                    onClick={() => setTeaserOpen(true)}
                    className="absolute inset-0 flex items-center justify-center group"
                  >
                    <div className="w-20 h-20 rounded-full bg-[#00f5ff]/80 text-[#04121a] backdrop-blur flex items-center justify-center transition-all group-hover:scale-110 group-hover:bg-[#00f5ff] shadow-[0_0_28px_rgba(0,245,255,0.45)]">
                      <i className="fas fa-play text-white text-2xl mr-1" />
                    </div>
                    <span className="absolute bottom-6 text-white text-sm bg-black/60 px-4 py-1 rounded-full">
                      تریلر را ببینید
                    </span>
                  </button>
                )}

                {/* Game tier badge */}
                {game.tier && (
                  <div className="absolute top-4 right-4">
                    <TierBadge tier={game.tier} size="lg" />
                  </div>
                )}

                {/* Game title overlay */}
                <div className="absolute bottom-4 left-4 right-4">
                  <h1 className="font-cinzel font-black text-3xl md:text-4xl text-white drop-shadow-lg">{game.title}</h1>
                  {game.subtitle && <p className="text-[#00f5ff] mt-1">{game.subtitle}</p>}
                </div>
              </div>

              {/* Thumbnails */}
              {allImages.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto bg-black/40">
                  {allImages.map((img, idx) => (
                    <button
                      key={img.id}
                      onClick={() => setActiveImageIdx(idx)}
                      className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                        idx === activeImageIdx ? 'border-[#00f5ff]' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img.url} alt={img.alt || ''} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* Quick stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: 'fas fa-users', label: 'تعداد بازیکن', value: `${toPersianDigits(game.minPlayers)}-${toPersianDigits(game.maxPlayers)} نفر` },
                { icon: 'fas fa-clock', label: 'مدت زمان', value: `${toPersianDigits(game.duration)} دقیقه` },
                { icon: 'fas fa-layer-group', label: 'سختی', value: DIFFICULTY_FA[game.difficulty] },
                { icon: 'fas fa-trophy', label: 'نرخ موفقیت', value: `${toPersianDigits(game.successRate)}٪` },
              ].map((stat) => (
                <div key={stat.label} className="dark-card rounded-xl p-4 text-center">
                  <i className={`${stat.icon} text-[#00f5ff] text-xl mb-2`} />
                  <div className="font-bold text-white text-lg">{stat.value}</div>
                  <div className="text-gray-400 text-xs mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Tags & Fear */}
            <div className="dark-card rounded-2xl p-5">
                       <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="badge-blood">{CATEGORY_FA[game.category]}</span>
                {game.tags?.map((tag) => (
                  <span key={tag} className="text-xs bg-white/[0.03] text-gray-400 border border-white/10 px-3 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <div className="text-gray-400 text-xs mb-1">سطح ترس</div>
                  <FearMeter level={game.fearLevel} size="lg" showLabel />
                </div>
                <div className="border-r border-white/10 pr-4 mr-2">
                  <div className="text-gray-400 text-xs mb-1">امتیاز</div>
                  <StarRating rating={game.rating} totalReviews={game.totalReviews} showCount />
                </div>
                <div className="border-r border-white/10 pr-4 mr-2">
                  <div className="text-gray-400 text-xs mb-1">پسندیدن</div>
                  <LikeButton
                    gameId={game.id}
                    initialCount={game.likesCount ?? 0}
                    initialLiked={game.likedByMe ?? false}
                    size="md"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <section className="dark-card rounded-2xl p-6">
              <h2 className="font-cinzel font-bold text-xl text-white mb-4 flex items-center gap-2">
                <i className="fas fa-scroll text-[#00f5ff]" />
                درباره بازی
              </h2>
              <p className="text-gray-300 leading-relaxed text-base">{game.description}</p>
            </section>

            {/* Scenario */}
            {game.scenario && (
              <section
                className="rounded-2xl p-6 scroll-bg relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(14,18,26,0.82) 0%, rgba(5,7,10,0.95) 50%, rgba(176,38,255,0.12) 100%)',
                  border: '1px solid rgba(0,245,255,0.16)',
                }}
              >
                <div className="absolute inset-0 opacity-5"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300f5ff' fill-opacity='0.45'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  }}
                />
                <h2 className="font-cinzel font-bold text-xl text-white mb-4 relative z-10 flex items-center gap-2">
                  <i className="fas fa-book-dead text-[#00f5ff]" />
                  داستان
                </h2>
                <p className="text-gray-300 leading-relaxed italic relative z-10">{game.scenario}</p>
              </section>
            )}

            {/* Branch info */}
            <section className="dark-card rounded-2xl p-6">
              <h2 className="font-cinzel font-bold text-xl text-white mb-4 flex items-center gap-2">
                <i className="fas fa-map-marker-alt text-[#00f5ff]" />
                آدرس و اطلاعات شعبه
              </h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <i className="fas fa-building text-[#00f5ff] mt-1 w-5" />
                  <div>
                    <div className="text-white font-medium">{game.branch.name}</div>
                    <div className="text-gray-400 text-sm">{game.branch.address}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <i className="fas fa-city text-[#00f5ff] w-5" />
                  <span className="text-gray-300">{game.branch.city.name}</span>
                </div>
                {game.branch.phone && (
                  <div className="flex items-center gap-3">
                    <i className="fas fa-phone text-[#00f5ff] w-5" />
                    <a href={`tel:${game.branch.phone}`} className="text-gray-300 hover:text-[#00f5ff] transition-colors dir-ltr">
                      {game.branch.phone}
                    </a>
                  </div>
                )}
                {game.branch.instagram && (
                  <div className="flex items-center gap-3">
                    <i className="fab fa-instagram text-pink-500 w-5" />
                    <a
                      href={`https://instagram.com/${game.branch.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-300 hover:text-pink-400 transition-colors"
                    >
                      @{game.branch.instagram}
                    </a>
                  </div>
                )}
                {game.branch.lat && game.branch.lng && (
                  <div className="mt-4 rounded-xl overflow-hidden border border-white/10">
                    <iframe
                      src={`https://maps.google.com/maps?q=${game.branch.lat},${game.branch.lng}&z=15&output=embed`}
                      width="100%"
                      height="200"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                    />
                  </div>
                )}
              </div>
            </section>

            {/* Warnings */}
            {(game.hasAgeLimit || game.warningText) && (
              <div className="bg-yellow-950/30 border border-yellow-700/30 rounded-2xl p-5">
                <h3 className="font-bold text-yellow-400 mb-3 flex items-center gap-2">
                  <i className="fas fa-exclamation-triangle" />
                  هشدارها و محدودیت‌ها
                </h3>
                <ul className="space-y-2 text-gray-300 text-sm">
                  {game.hasAgeLimit && game.ageLimit && (
                    <li className="flex items-center gap-2">
                      <i className="fas fa-child text-yellow-500" />
                      حداقل سن: {toPersianDigits(game.ageLimit)} سال
                    </li>
                  )}
                  {game.warningText && (
                    <li className="flex items-start gap-2">
                      <i className="fas fa-heart text-[#ff00e5] mt-0.5" />
                      {game.warningText}
                    </li>
                  )}
                  <li className="flex items-center gap-2">
                    <i className="fas fa-female text-pink-400" />
                    مناسب برای بارداران نمی‌باشد
                  </li>
                </ul>
              </div>
            )}

            {/* Reviews */}
            <section className="dark-card rounded-2xl p-6">
              <h2 className="font-cinzel font-bold text-xl text-white mb-6 flex items-center gap-2">
                <i className="fas fa-comments text-[#00f5ff]" />
                نظرات ({toPersianDigits(game.totalReviews)})
              </h2>

              {reviews.length === 0 ? (
                <p className="text-gray-400 text-center py-8">هنوز نظری ثبت نشده است</p>
              ) : (
                <div className="space-y-5">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-white/10 pb-5 last:border-0">
                      <div className="flex items-center gap-3 mb-3">
                        {review.user.avatar ? (
                          <img src={review.user.avatar} alt={review.user.name || 'کاربر'} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff00e5] to-[#b026ff] flex items-center justify-center text-white">
                            {(review.user.name || 'ک').charAt(0)}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-white font-medium text-sm">{review.user.name || 'کاربر ناشناس'}</span>
                            <span className="text-gray-500 text-xs">{getRelativeTime(review.createdAt)}</span>
                          </div>
                          <StarRating rating={review.rating} size="sm" />
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm leading-relaxed">{review.comment}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                        <button className="flex items-center gap-1 hover:text-[#00f5ff] transition-colors">
                          <i className="fas fa-thumbs-up" />
                          مفید ({toPersianDigits(review.helpful)})
                        </button>
                        {review.isVerified && (
                          <span className="badge-blood">
                            <i className="fas fa-check-circle ml-1" />
                            رزرو تأیید شده
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* User comments & opinions */}
            <GameComments gameId={game.id} />
          </div>

          {/* Right column - Booking widget */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <BookingWidget game={game} />
            </div>
          </div>
        </div>
      </div>

      {/* Teaser video modal */}
      {teaserOpen && game.teaserUrl && (
        <div className="modal-overlay" onClick={() => setTeaserOpen(false)}>
          <div className="relative w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setTeaserOpen(false)}
              className="absolute -top-10 left-0 text-white hover:text-[#00f5ff] transition-colors"
            >
              <i className="fas fa-times text-2xl" />
            </button>
            <div className="rounded-xl overflow-hidden aspect-video">
              <video
                src={game.teaserUrl}
                controls
                autoPlay
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
