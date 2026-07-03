'use client'

import Link from 'next/link'
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
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-bg-dark z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-red-950/20 via-transparent to-red-950/20 z-10" />
        {/* Animated grid */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(220,38,38,0.3) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(220,38,38,0.3) 1px, transparent 1px)`,
            backgroundSize: '80px 80px',
          }}
        />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
        {[
          {l:'88%',t:'64%',d:0.3,dur:10.8},{l:'35%',t:'70%',d:4.1,dur:5.7},
          {l:'67%',t:'35%',d:2.3,dur:13.9},{l:'17%',t:'76%',d:2.1,dur:11.8},
          {l:'25%',t:'30%',d:2.8,dur:11.1},{l:'46%',t:'10%',d:4.1,dur:14.9},
          {l:'3%', t:'12%',d:1.0,dur:14.2},{l:'21%',t:'13%',d:2.7,dur:8.7},
          {l:'46%',t:'91%',d:1.8,dur:5.9},{l:'74%',t:'73%',d:3.1,dur:13.9},
          {l:'30%',t:'48%',d:0.7,dur:10.4},{l:'84%',t:'93%',d:1.5,dur:11.9},
        ].map((p, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-red-600 rounded-full opacity-60"
            style={{
              left: p.l, top: p.t,
              animation: `fog ${p.dur}s ease-in-out infinite`,
              animationDelay: `${p.d}s`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-20 text-center max-w-5xl mx-auto px-4 py-32">
        {/* Pre-title */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-red-600" />
          <span className="text-red-500 font-cinzel text-sm tracking-[0.3em] uppercase">
            پلتفرم سرگرمی
          </span>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-red-600" />
        </div>

        {/* Main title */}
        <h1 className="horror-text font-creepster text-6xl md:text-8xl lg:text-9xl mb-4 leading-none">
          <span className={`block transition-all duration-400 ${fade ? 'opacity-100' : 'opacity-0'}`}>
            {heroTexts[textIndex]}
          </span>
        </h1>

        {/* Subtitle */}
        <h2 className="font-cinzel text-2xl md:text-3xl text-red-400 mb-6 flicker">
          TIK TAK RUN
        </h2>

        {/* Description */}
        <p className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          از اتاق فرار ترسناک تا واقعیت مجازی، از لیزرتگ تا سینمای هیجانی — 
          <br className="hidden md:block" />
          <span className="text-red-400 font-semibold">بهترین تجربه سرگرمی</span> را با دوستانت رزرو کن
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/games"
            className="btn-blood text-base px-8 py-4 rounded-xl"
          >
            <i className="fas fa-gamepad ml-2" />
            ورود به قلمرو
          </Link>
          <Link
            href="/stories"
            className="btn-ghost text-base px-8 py-4 rounded-xl flex items-center gap-2"
          >
            <i className="fas fa-book-open ml-2 text-red-500" />
            داستان‌های شجاعان
          </Link>
        </div>

        {/* Scroll indicator */}
        <div className="mt-16 flex flex-col items-center gap-2 text-gray-500 animate-bounce">
          <span className="text-xs tracking-widest">کاوش کن</span>
          <i className="fas fa-chevron-down text-red-600" />
        </div>
      </div>
    </section>
  )
}
