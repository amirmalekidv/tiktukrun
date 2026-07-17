'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import useSWR from 'swr'
import { getLandingBanners } from '@/lib/api'
import { shouldBypassImageOptimization } from '@/lib/games'

export default function BannerCarousel() {
  const { data: banners = [], isLoading } = useSWR('landing-banners', getLandingBanners)
  const [index, setIndex] = useState(0)
  const directionRef = useRef(1)

  useEffect(() => {
    setIndex(0)
    directionRef.current = 1
  }, [banners.length])

  useEffect(() => {
    if (banners.length <= 1) return

    const timer = window.setInterval(() => {
      setIndex((current) => {
        if (current >= banners.length - 1) directionRef.current = -1
        if (current <= 0) directionRef.current = 1
        return current + directionRef.current
      })
    }, 3800)

    return () => window.clearInterval(timer)
  }, [banners.length])

  if (isLoading) {
    return (
      <section className="relative z-10 mx-auto -mt-5 max-w-7xl px-4 pb-5 md:-mt-8 lg:-mt-3">
        <div className="aspect-[4.1/1] min-h-[104px] w-full rounded-xl skeleton md:min-h-0" />
      </section>
    )
  }

  if (banners.length === 0) return null

  return (
    <section className="relative z-10 mx-auto -mt-5 max-w-7xl px-4 pb-5 md:-mt-8 lg:-mt-3">
      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#0e121a] shadow-[0_18px_46px_rgba(0,0,0,0.34)]">
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[#05070a]/65 to-transparent md:w-20" />
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-[#05070a]/65 to-transparent md:w-20" />

        <div className="aspect-[4.1/1] min-h-[104px] overflow-hidden md:min-h-0" style={{ direction: 'ltr' }}>
          <div
            className="flex h-full transition-transform duration-700 ease-in-out will-change-transform"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {banners.map((banner, slideIndex) => {
              const image = (
                <Image
                  src={banner.imageUrl}
                  alt={banner.altText || banner.title || 'بنر تیک تاک ران'}
                  fill
                  priority={slideIndex === 0}
                  sizes="(max-width: 768px) 100vw, 1280px"
                  unoptimized={shouldBypassImageOptimization(banner.imageUrl)}
                  className="object-cover"
                />
              )

              return (
                <div key={banner.id} className="relative h-full w-full shrink-0">
                  {banner.href ? (
                    <Link
                      href={banner.href}
                      aria-label={banner.altText || banner.title || 'بنر صفحه اصلی'}
                      className="absolute inset-0"
                    >
                      {image}
                    </Link>
                  ) : (
                    image
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {banners.length > 1 ? (
          <div className="absolute bottom-2 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/35 px-2 py-1 backdrop-blur">
            {banners.map((banner, dotIndex) => (
              <span
                key={banner.id}
                className={`h-1.5 rounded-full transition-all ${
                  dotIndex === index ? 'w-5 bg-white' : 'w-1.5 bg-white/45'
                }`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
