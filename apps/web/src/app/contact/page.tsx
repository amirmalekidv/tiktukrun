'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    await new Promise((r) => setTimeout(r, 1000))
    toast.success('پیام شما ارسال شد! به زودی پاسخ می‌دهیم 📧')
    setForm({ name: '', email: '', subject: '', message: '' })
    setIsSubmitting(false)
  }

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="font-cinzel font-black text-4xl text-white mb-4 flicker">
            <span className="blood-text">تماس</span> با ما
          </h1>
          <p className="text-gray-300">آماده پاسخگویی به سؤالات شما هستیم</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Contact form */}
          <div className="md:col-span-2">
            <form onSubmit={handleSubmit} className="dark-card rounded-2xl p-8 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">نام</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input-gothic"
                    placeholder="نام شما"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">ایمیل</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="input-gothic"
                    placeholder="example@gmail.com"
                    dir="ltr"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">موضوع</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="input-gothic"
                  placeholder="موضوع پیام"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">پیام</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="input-gothic resize-none"
                  rows={6}
                  placeholder="پیام خود را بنویسید..."
                  required
                />
              </div>
              <button type="submit" disabled={isSubmitting} className="btn-blood w-full py-4">
                {isSubmitting ? (
                  <><i className="fas fa-spinner fa-spin ml-2" />در حال ارسال...</>
                ) : (
                  <><i className="fas fa-paper-plane ml-2" />ارسال پیام</>
                )}
              </button>
            </form>
          </div>

          {/* Contact info */}
          <div className="space-y-4">
            {[
              { icon: 'fas fa-phone', label: 'تلفن', value: '۰۲۱-۸۸۸۸۰۰۰۱', href: 'tel:02188880001' },
              { icon: 'fas fa-envelope', label: 'ایمیل', value: 'info@tiktakrun.com', href: 'mailto:info@tiktakrun.com' },
              { icon: 'fab fa-instagram', label: 'اینستاگرام', value: '@tiktakrun', href: 'https://instagram.com/tiktakrun' },
              { icon: 'fab fa-telegram', label: 'تلگرام', value: '@tiktakrun', href: 'https://t.me/tiktakrun' },
            ].map((c) => (
              <a key={c.label} href={c.href} target="_blank" rel="noopener noreferrer"
                className="dark-card rounded-xl p-4 flex items-center gap-3 hover:border-red-600/50 transition-all">
                <div className="w-10 h-10 rounded-lg bg-red-950/40 flex items-center justify-center">
                  <i className={`${c.icon} text-red-500`} />
                </div>
                <div>
                  <div className="text-gray-400 text-xs">{c.label}</div>
                  <div className="text-white text-sm font-medium">{c.value}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
