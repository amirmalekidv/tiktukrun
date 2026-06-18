import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'درباره ما',
  description: 'درباره تیک تاک ران — پلتفرم رزرو سرگرمی‌های هیجانی در ایران',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-cinzel font-black text-4xl text-white mb-4 flicker">
            درباره <span className="blood-text">TIK TAK RUN</span>
          </h1>
          <p className="text-gray-300 text-lg">پلتفرم تخصصی رزرو سرگرمی‌های هیجانی در ایران</p>
        </div>

        {/* Story */}
        <div className="dark-card rounded-2xl p-8 mb-8">
          <h2 className="font-cinzel font-bold text-2xl text-white mb-4 flex items-center gap-2">
            <i className="fas fa-scroll text-red-500" />
            داستان ما
          </h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            تیک تاک ران با هدف ایجاد یک پلتفرم جامع برای رزرو سرگرمی‌های هیجانی در ایران تأسیس شد. ما باور داریم که هر انسانی نیاز به هیجان، ماجراجویی و تجربه‌های فراموش‌نشدنی دارد.
          </p>
          <p className="text-gray-300 leading-relaxed">
            از اتاق‌های فرار ترسناک تا تجربه واقعیت مجازی، از لیزرتگ هیجانی تا سینمای ترس — ما همه‌چیز را در یک جای متمرکز کرده‌ایم تا رزرو آنلاین آسان‌تر از همیشه باشد.
          </p>
        </div>

        {/* Values */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { icon: 'fas fa-heartbeat', title: 'هیجان', desc: 'ما باور داریم که هیجان روح را تازه می‌کند' },
            { icon: 'fas fa-shield-alt', title: 'امنیت', desc: 'ایمنی شما اولویت اول ماست' },
            { icon: 'fas fa-star', title: 'کیفیت', desc: 'فقط بهترین تجربه‌ها در قلمرو ما' },
          ].map((v) => (
            <div key={v.title} className="dark-card rounded-2xl p-6 text-center">
              <i className={`${v.icon} text-red-500 text-3xl mb-3`} />
              <h3 className="font-cinzel font-bold text-white text-lg mb-2">{v.title}</h3>
              <p className="text-gray-400 text-sm">{v.desc}</p>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="dark-card rounded-2xl p-8">
          <h2 className="font-cinzel font-bold text-2xl text-white mb-6 text-center">اعداد ما</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'بازی فعال', value: '۴۸+' },
              { label: 'بازیکن راضی', value: '۱۲,۰۰۰+' },
              { label: 'شهر', value: '۵' },
              { label: 'سال فعالیت', value: '۳' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-cinzel font-black text-3xl text-red-400 mb-1">{s.value}</div>
                <div className="text-gray-400 text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
