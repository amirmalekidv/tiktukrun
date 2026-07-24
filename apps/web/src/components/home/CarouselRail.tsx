'use client'

import { Children, type ReactNode, useCallback, useEffect, useId, useRef, useState } from 'react'
import { A11y, Navigation } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'
import { cn } from '@/lib/utils'

interface CarouselRailProps {
  children: ReactNode
  className?: string
  viewportClassName?: string
  contentClassName?: string
  carouselId?: string
  navigationPlacement?: 'overlay' | 'external' | 'none'
}

interface CarouselNavButtonsProps {
  carouselId: string
  className?: string
}

const navButtonClassName =
  'flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-[#171c29]/88 text-white/88 shadow-[0_12px_30px_rgba(0,0,0,0.25)] backdrop-blur transition-all hover:border-white/45 hover:bg-[#202739] hover:text-white [&.swiper-button-disabled]:pointer-events-none [&.swiper-button-disabled]:opacity-35'
const HOVER_RESTORE_DELAY_MS = 80
const SWIPE_RELEASE_DELAY_MS = 720

function sanitizeCarouselId(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, '')
}

function CarouselNavButton({
  carouselId,
  direction,
}: {
  carouselId: string
  direction: 'prev' | 'next'
}) {
  const resolvedId = sanitizeCarouselId(carouselId)
  const iconClassName = direction === 'prev' ? 'fas fa-chevron-right' : 'fas fa-chevron-left'
  const buttonClassName =
    direction === 'prev'
      ? `carousel-nav-prev-${resolvedId}`
      : `carousel-nav-next-${resolvedId}`

  return (
    <button
      type="button"
      aria-label={direction === 'prev' ? 'اسکرول به کارت‌های قبلی' : 'اسکرول به کارت‌های بعدی'}
      className={cn(navButtonClassName, buttonClassName)}
    >
      <i className={`${iconClassName} text-sm`} />
    </button>
  )
}

export function CarouselNavButtons({ carouselId, className }: CarouselNavButtonsProps) {
  const resolvedId = sanitizeCarouselId(carouselId)

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <CarouselNavButton carouselId={resolvedId} direction="prev" />
      <CarouselNavButton carouselId={resolvedId} direction="next" />
    </div>
  )
}

export default function CarouselRail({
  children,
  className,
  viewportClassName,
  contentClassName,
  carouselId,
  navigationPlacement = 'overlay',
}: CarouselRailProps) {
  const fallbackId = sanitizeCarouselId(useId())
  const resolvedId = sanitizeCarouselId(carouselId || fallbackId)
  const slides = Children.toArray(children)
  const showNavigation = navigationPlacement !== 'none'
  const [isDragging, setIsDragging] = useState(false)
  const dragReleaseTimeoutRef = useRef<number | null>(null)

  const clearDragReleaseTimeout = useCallback(() => {
    if (dragReleaseTimeoutRef.current) {
      window.clearTimeout(dragReleaseTimeoutRef.current)
      dragReleaseTimeoutRef.current = null
    }
  }, [])

  const handleSliderMove = useCallback(() => {
    clearDragReleaseTimeout()
    setIsDragging(true)
  }, [clearDragReleaseTimeout])

  const handleDragRelease = useCallback((delay = HOVER_RESTORE_DELAY_MS) => {
    clearDragReleaseTimeout()
    dragReleaseTimeoutRef.current = window.setTimeout(() => {
      setIsDragging(false)
      dragReleaseTimeoutRef.current = null
    }, delay)
  }, [clearDragReleaseTimeout])

  useEffect(() => clearDragReleaseTimeout, [clearDragReleaseTimeout])

  return (
    <div className={cn('relative', className)}>
      {navigationPlacement === 'overlay' ? (
        <div className="absolute inset-y-0 right-2 z-20 hidden items-center md:flex">
          <CarouselNavButton carouselId={resolvedId} direction="prev" />
        </div>
      ) : null}

      <Swiper
        modules={[Navigation, A11y]}
        className={cn(
          'carousel-swiper !overflow-visible px-1 [touch-action:pan-y]',
          isDragging && 'is-dragging',
          viewportClassName
        )}
        wrapperClass={cn('items-stretch pb-4', contentClassName)}
        slidesPerView="auto"
        slidesPerGroupAuto
        spaceBetween={16}
        speed={650}
        threshold={6}
        grabCursor
        watchOverflow
        allowTouchMove
        simulateTouch
        preventClicks
        preventClicksPropagation
        resistanceRatio={0.82}
        touchStartPreventDefault
        onSliderMove={handleSliderMove}
        onTouchEnd={() => handleDragRelease(SWIPE_RELEASE_DELAY_MS)}
        onTransitionEnd={() => handleDragRelease()}
        navigation={
          showNavigation
            ? {
                prevEl: `.carousel-nav-prev-${resolvedId}`,
                nextEl: `.carousel-nav-next-${resolvedId}`,
              }
            : undefined
        }
        a11y={{
          prevSlideMessage: 'کارت قبلی',
          nextSlideMessage: 'کارت بعدی',
        }}
      >
        {slides.map((child, index) => (
          <SwiperSlide key={index} className="!h-auto !w-auto">
            {child}
          </SwiperSlide>
        ))}
      </Swiper>

      {navigationPlacement === 'overlay' ? (
        <div className="absolute inset-y-0 left-2 z-20 hidden items-center md:flex">
          <CarouselNavButton carouselId={resolvedId} direction="next" />
        </div>
      ) : null}
    </div>
  )
}
