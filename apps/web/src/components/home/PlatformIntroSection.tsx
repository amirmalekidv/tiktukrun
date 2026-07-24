'use client'

import { useEffect, useRef, useState } from 'react'
import useSWR from 'swr'
import { getPlatformIntro } from '@/lib/api'

export default function PlatformIntroSection() {
  const { data: intro, isLoading } = useSWR('platform-intro', getPlatformIntro)
  const [openId, setOpenId] = useState<string | null>(null)
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false)
  const videoShellRef = useRef<HTMLDivElement | null>(null)
  const initializedRef = useRef(false)

  useEffect(() => {
    if (!initializedRef.current && intro?.faqs?.length) {
      setOpenId(intro.faqs[0].id)
      initializedRef.current = true
    }
  }, [intro])

  useEffect(() => {
    const node = videoShellRef.current
    if (!node || !intro?.videoUrl || shouldLoadVideo) return

    if (typeof IntersectionObserver === 'undefined') {
      setShouldLoadVideo(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoadVideo(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px 0px' }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [intro?.videoUrl, shouldLoadVideo])

  if (isLoading) {
    return (
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-10 md:py-14">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,0.55fr)_minmax(0,1.45fr)]">
          <div className="h-12 w-3/4 rounded-xl skeleton ms-auto" />
          <div className="aspect-video w-full rounded-2xl skeleton" />
        </div>
        <div className="mt-12 space-y-4">
          <div className="h-8 w-72 rounded-lg skeleton ms-auto" />
          <div className="h-14 w-full rounded-xl skeleton" />
          <div className="h-14 w-full rounded-xl skeleton" />
        </div>
      </section>
    )
  }

  if (!intro) return null

  const faqs = intro.faqs ?? []
  const hasVideo = Boolean(intro.videoUrl)
  const hasFaqs = faqs.length > 0

  if (!hasVideo && !hasFaqs) return null

  const toggle = (id: string) => {
    setOpenId((current) => (current === id ? null : id))
  }

  return (
    <section className="relative z-10 mx-auto max-w-7xl px-4 py-10 md:py-14" dir="rtl">
      {/* Title (right) + video (left) — in RTL, first grid item sits on the right */}
      <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,0.55fr)_minmax(0,1.45fr)]">
        <div className="text-center lg:text-right">
          <h2 className="font-cinzel text-3xl font-black leading-relaxed text-white md:text-4xl lg:text-[2.35rem]">
            {intro.title}
          </h2>
        </div>

        <div>
          {hasVideo ? (
            <div
              ref={videoShellRef}
              className="overflow-hidden rounded-2xl border border-white/10 bg-[#0e121a] shadow-[0_18px_46px_rgba(0,0,0,0.34)]"
            >
              {shouldLoadVideo ? (
                <video
                  key={intro.videoUrl!}
                  src={intro.videoUrl!}
                  controls
                  playsInline
                  preload="none"
                  className="aspect-video w-full bg-black object-contain"
                >
                  مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.
                </video>
              ) : (
                <div className="flex aspect-video w-full items-center justify-center bg-black/40 text-[#9aa3b2]">
                  <i className="fas fa-play-circle text-4xl opacity-50" aria-hidden />
                </div>
              )}
            </div>
          ) : (
            <div className="flex aspect-video w-full items-center justify-center rounded-2xl border border-dashed border-white/15 bg-[#0e121a]/80 text-[#9aa3b2]">
              <div className="text-center px-4">
                <i className="fas fa-play-circle text-4xl mb-3 opacity-50" />
                <p className="text-sm">ویدیوی معرفی به‌زودی اضافه می‌شود</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FAQ — use text-left (globals flip it to visual right under [dir=rtl]) */}
      {hasFaqs && (
        <div className="mt-12 md:mt-16">
          <h3 className="mb-6 text-left text-xl font-bold text-white md:text-2xl md:mb-8">
            {intro.faqTitle}
          </h3>

          <div className="divide-y divide-white/10 border-y border-white/10">
            {faqs.map((faq) => {
              const isOpen = openId === faq.id
              return (
                <div key={faq.id} className="py-1">
                  <button
                    type="button"
                    onClick={() => toggle(faq.id)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 py-4 text-left transition-colors hover:text-[#00f5ff]"
                  >
                    {/* In RTL flex: first child = right side (question), second = left (chevron) */}
                    <span className="min-w-0 flex-1 text-left text-base font-semibold text-white md:text-lg">
                      {faq.question}
                    </span>
                    <span className="shrink-0 text-[#9aa3b2]" aria-hidden>
                      <i className={`fas ${isOpen ? 'fa-chevron-up' : 'fa-chevron-down'} text-sm`} />
                    </span>
                  </button>

                  <div
                    className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                      isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="pb-5 text-left text-sm leading-8 text-[#9aa3b2] md:text-[0.95rem] md:leading-9">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
