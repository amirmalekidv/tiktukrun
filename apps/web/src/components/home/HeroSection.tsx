'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'

const heroTexts = [
  'وارد هیجان شو',
  'ENTER THE THRILL',
  'ترس رو تجربه کن',
  'رزرو کن، بازی کن',
]

export default function HeroSection() {
  const [textIndex, setTextIndex] = useState(0)
  const [fade, setFade] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false)
      setTimeout(() => {
        setTextIndex((prev) => (prev + 1) % heroTexts.length)
        setFade(true)
      }, 400)
    }, 3500)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="relative overflow-hidden pt-28 pb-16 md:pt-32">
      <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="text-center lg:text-right">
          <h1 className="font-cinzel text-5xl font-black leading-[1.05] text-white md:text-7xl">
            TIK TAK
            <br />
            <span className={`gradient-text block transition-opacity duration-500 ${fade ? 'opacity-100' : 'opacity-0'}`}>
              {heroTexts[textIndex]}
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-9 text-[#9aa3b2] lg:mx-0">
            از اتاق فرار تا واقعیت مجازی، لیزرتگ، پینت‌بال و بازی‌های گروهی؛
            تیک تاک ران همان تجربه‌ی نئونی و رقابتی است که برای رزرو، بازی و
            ساختن خاطره با دوستانت نیاز داری.
          </p>

          <div className="mt-7 flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
            <Link href="/games" className="btn-blood px-8 py-4 text-base">
              <i className="fas fa-gamepad ml-2" />
              شروع بازی
            </Link>
            <Link href="/stories" className="btn-ghost px-8 py-4 text-base">
              <i className="fas fa-book-open ml-2 text-[#b026ff]" />
              داستان‌های شجاعان
            </Link>
          </div>

          <div className="mt-9 flex flex-wrap justify-center gap-7 lg:justify-start">
            {[
              { value: '4.8', label: 'امتیاز کاربران', cls: 'glow-teal' },
              { value: '+12k', label: 'بازی انجام شده', cls: 'glow-purple' },
              { value: '48+', label: 'تجربه فعال', cls: 'glow-pink' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className={`font-cinzel text-3xl font-black ${stat.cls}`}>{stat.value}</div>
                <div className="mt-1 text-xs text-[#9aa3b2]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative mx-auto grid place-items-center lg:mx-0">
          <div className="relative h-[300px] w-[300px] rounded-full bg-[conic-gradient(from_0deg,#00f5ff,#b026ff,#ff00e5,#00f5ff)] p-1.5 shadow-[0_0_60px_rgba(176,38,255,0.4)] [animation:spin_14s_linear_infinite] md:h-[380px] md:w-[380px]">
            <div className="h-full w-full overflow-hidden rounded-full border-[6px] border-[#05070a] [animation:spin_14s_linear_infinite_reverse]">
              <Image
                src="/images/hero.jpg"
                alt="تجربه تیک تاک ران"
                width={760}
                height={760}
                priority
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <div className="absolute right-0 top-7 rounded-2xl border border-white/10 bg-[#0e121a] px-4 py-2 text-sm font-bold shadow-[0_8px_28px_rgba(0,0,0,0.5)] [animation:floaty_4s_ease-in-out_infinite] md:-right-4">
            <span className="glow-teal">★ 4.8</span> رضایت
          </div>
          <div className="absolute bottom-8 left-0 rounded-2xl border border-white/10 bg-[#0e121a] px-4 py-2 text-sm font-bold shadow-[0_8px_28px_rgba(0,0,0,0.5)] [animation:floaty_4s_ease-in-out_infinite_1.5s] md:-left-6">
            <span className="glow-pink">◈</span> رزرو آنلاین
          </div>
        </div>
      </div>
    </section>
  )
}
