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
    <footer className="relative z-10 bg-black/90 border-t border-red-950 mt-20">
      {/* Top glow line */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-red-700 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">⏳</span>
              <span className="font-cinzel font-black text-2xl text-white flicker">TIK TAK RUN</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-5">
              پلتفرم تخصصی رزرو آنلاین سرگرمی‌های هیجانی در ایران. اتاق فرار، سینما ترس، لیزرتگ، VR و بیشتر...
            </p>
            {/* Social */}
            <div className="flex items-center gap-3">
              <a href="https://instagram.com/tiktakrun" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-red-950/40 border border-red-800/30 flex items-center justify-center text-gray-400 hover:text-pink-400 hover:border-pink-500/50 transition-all">
                <i className="fab fa-instagram" />
              </a>
              <a href="https://t.me/tiktakrun" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-red-950/40 border border-red-800/30 flex items-center justify-center text-gray-400 hover:text-blue-400 hover:border-blue-500/50 transition-all">
                <i className="fab fa-telegram" />
              </a>
              <a href="https://wa.me/tiktakrun" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-red-950/40 border border-red-800/30 flex items-center justify-center text-gray-400 hover:text-green-400 hover:border-green-500/50 transition-all">
                <i className="fab fa-whatsapp" />
              </a>
            </div>
          </div>

          {/* Games */}
          <div>
            <h4 className="font-cinzel font-bold text-red-400 mb-4 text-sm tracking-wider uppercase">بازی‌ها</h4>
            <ul className="space-y-2">
              {links.games.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-400 hover:text-red-400 transition-colors text-sm flex items-center gap-2">
                    <i className="fas fa-chevron-left text-red-800 text-xs" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Cities */}
          <div>
            <h4 className="font-cinzel font-bold text-red-400 mb-4 text-sm tracking-wider uppercase">شهرها</h4>
            <ul className="space-y-2">
              {links.cities.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-400 hover:text-red-400 transition-colors text-sm flex items-center gap-2">
                    <i className="fas fa-map-marker-alt text-red-800 text-xs" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="font-cinzel font-bold text-red-400 mb-4 text-sm tracking-wider uppercase">درباره</h4>
            <ul className="space-y-2">
              {links.about.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-400 hover:text-red-400 transition-colors text-sm flex items-center gap-2">
                    <i className="fas fa-chevron-left text-red-800 text-xs" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            {/* Contact info */}
            <div className="mt-5 space-y-2">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <i className="fas fa-phone text-red-600 w-4" />
                <span>۰۲۱-۸۸۸۸۰۰۰۱</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <i className="fas fa-envelope text-red-600 w-4" />
                <span>info@tiktakrun.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="border-y border-red-950/60 py-6 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: 'fas fa-gamepad', label: 'بازی فعال', value: '۴۸' },
              { icon: 'fas fa-users', label: 'بازی انجام شده', value: '۱۲,۵۴۷' },
              { icon: 'fas fa-map-marker-alt', label: 'شهر', value: '۵' },
              { icon: 'fas fa-star', label: 'رضایت کاربران', value: '۴.۸/۵' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-red-500 mb-1">
                  <i className={`${stat.icon} text-xl`} />
                </div>
                <div className="text-white font-bold font-cinzel text-lg">{stat.value}</div>
                <div className="text-gray-500 text-xs mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-gray-500 text-sm">
          <p>© ۱۴۰۳ تیک تاک ران — تمام حقوق محفوظ است</p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-red-400 transition-colors">قوانین</Link>
            <Link href="/privacy" className="hover:text-red-400 transition-colors">حریم خصوصی</Link>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span>ساخته شده با</span>
            <span className="text-red-500 heartbeat inline-block">♥</span>
            <span>در ایران</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
