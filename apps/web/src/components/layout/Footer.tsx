import Link from 'next/link'

const links = {
  games: [
    { label: 'سینما ترس', href: '/games?category=CINEMA_HORROR' },
    { label: 'بردگیم', href: '/games?category=BOARD_GAME' },
    { label: 'مافیا', href: '/games?category=MAFIA' },
    { label: 'لیزرتگ', href: '/games?category=LASER_TAG' },
    { label: 'اتاق فرار', href: '/games?category=ESCAPE_ROOM' },
    { label: 'واقعیت مجازی', href: '/games?category=VR' },
  ],
  cities: [
    { label: 'تهران', href: '/games?citySlug=tehran' },
    { label: 'کرج', href: '/games?citySlug=karaj' },
    { label: 'اصفهان', href: '/games?citySlug=isfahan' },
    { label: 'مشهد', href: '/games?citySlug=mashhad' },
    { label: 'شیراز', href: '/games?citySlug=shiraz' },
  ],
  about: [
    { label: 'درباره ما', href: '/about' },
    { label: 'تماس با ما', href: '/contact' },
    { label: 'قوانین', href: '/terms' },
    { label: 'حریم خصوصی', href: '/privacy' },
    { label: 'فرصت‌های شغلی', href: '/careers' },
  ],
}

export default function Footer() {
  return (
    <footer className="relative z-10 mt-20 border-t border-white/10 bg-white/[0.015]">
      {/* Top glow line */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[#00f5ff] to-transparent" />

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-[11px] bg-white shadow-[0_0_20px_rgba(255,255,255,0.18)]">
                <img
                  src="/tiktakrun-logo.svg"
                  alt=""
                  aria-hidden="true"
                  className="h-8 w-8 object-contain"
                />
              </span>
              <span className="font-cinzel font-black text-xl text-white">
                TIK TAK <span className="glow-teal">RUN</span>
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-5">
              پلتفرم تخصصی رزرو آنلاین سرگرمی‌های هیجانی در ایران. اتاق فرار، سینما ترس، لیزرتگ، VR و بیشتر...
            </p>
            {/* Social */}
            <div className="flex items-center gap-3">
              <a href="https://instagram.com/tiktakrun" target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-gray-400 hover:text-[#ff00e5] hover:border-[#ff00e5]/50 hover:-translate-y-1 transition-all">
                <i className="fab fa-instagram" />
              </a>
              <a href="https://t.me/tiktakrun" target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-gray-400 hover:text-[#00f5ff] hover:border-[#00f5ff]/50 hover:-translate-y-1 transition-all">
                <i className="fab fa-telegram" />
              </a>
              <a href="https://wa.me/tiktakrun" target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-gray-400 hover:text-[#2ee6a0] hover:border-[#2ee6a0]/50 hover:-translate-y-1 transition-all">
                <i className="fab fa-whatsapp" />
              </a>
            </div>
          </div>

          {/* Games */}
          <div>
            <h4 className="font-cinzel font-bold text-[#00f5ff] mb-4 text-sm uppercase">بازی‌ها</h4>
            <ul className="space-y-2">
              {links.games.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-400 hover:text-[#00f5ff] transition-colors text-sm flex items-center gap-2">
                    <i className="fas fa-chevron-left text-[#b026ff] text-xs" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Cities */}
          <div>
            <h4 className="font-cinzel font-bold text-[#00f5ff] mb-4 text-sm uppercase">شهرها</h4>
            <ul className="space-y-2">
              {links.cities.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-400 hover:text-[#00f5ff] transition-colors text-sm flex items-center gap-2">
                    <i className="fas fa-map-marker-alt text-[#b026ff] text-xs" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="font-cinzel font-bold text-[#00f5ff] mb-4 text-sm uppercase">درباره</h4>
            <ul className="space-y-2">
              {links.about.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-400 hover:text-[#00f5ff] transition-colors text-sm flex items-center gap-2">
                    <i className="fas fa-chevron-left text-[#b026ff] text-xs" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            {/* Contact info */}
            <div className="mt-5 space-y-2">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <i className="fas fa-phone text-[#00f5ff] w-4" />
                <span>۰۲۱-۸۸۸۸۰۰۰۱</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <i className="fas fa-envelope text-[#00f5ff] w-4" />
                <span>info@tiktakrun.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="border-y border-white/10 py-6 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: 'fas fa-gamepad', label: 'بازی فعال', value: '۴۸' },
              { icon: 'fas fa-users', label: 'بازی انجام شده', value: '۱۲,۵۴۷' },
              { icon: 'fas fa-map-marker-alt', label: 'شهر', value: '۵' },
              { icon: 'fas fa-star', label: 'رضایت کاربران', value: '۴.۸/۵' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-[#00f5ff] mb-1">
                  <i className={`${stat.icon} text-xl`} />
                </div>
                <div className="text-white font-bold font-cinzel text-lg glow-teal">{stat.value}</div>
                <div className="text-gray-500 text-xs mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-gray-500 text-sm">
          <p>© ۱۴۰۳ تیک تاک ران — تمام حقوق محفوظ است</p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-[#00f5ff] transition-colors">قوانین</Link>
            <Link href="/privacy" className="hover:text-[#00f5ff] transition-colors">حریم خصوصی</Link>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span>ساخته شده با</span>
            <span className="text-[#ff00e5] heartbeat inline-block">◈</span>
            <span>در ایران</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
