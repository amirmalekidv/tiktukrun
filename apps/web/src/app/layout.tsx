import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import FogEffect from '@/components/layout/FogEffect'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: {
    default: 'تیک تاک ران | TIK TAK RUN — سرگرمی‌های هیجانی',
    template: '%s | TIK TAK RUN',
  },
  description: 'پلتفرم رزرو اتاق فرار، سینما ترس، لیزرتگ، واقعیت مجازی، پینت‌بال و بازی‌های رومیزی در ایران',
  keywords: ['اتاق فرار', 'سرگرمی', 'تیک تاک ران', 'escape room', 'لیزرتگ', 'VR', 'رزرو آنلاین'],
  openGraph: {
    type: 'website',
    locale: 'fa_IR',
    siteName: 'TIK TAK RUN',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [{ url: '/tiktakrun-logo.svg', type: 'image/svg+xml' }],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Vazirmatn:wght@100;200;300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#05070a" />
      </head>
      <body className="bg-bg-dark min-h-screen relative font-fa antialiased">
        {/* Fixed background */}
        <div className="vignette" />
        
        {/* Neon starfield */}
        <FogEffect />
        
        <Providers>
          {/* Navbar */}
          <Navbar />
          
          {/* Main content */}
          <main className="relative z-10 min-h-screen">
            {children}
          </main>
          
          {/* Footer */}
          <Footer />
          
          {/* Toast notifications */}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#0e121a',
                color: '#fff',
                border: '1px solid rgba(0,245,255,0.35)',
                fontFamily: 'Vazirmatn, sans-serif',
                direction: 'rtl',
                borderRadius: '12px',
                boxShadow: '0 14px 40px rgba(0,0,0,0.5)',
              },
              success: {
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#00f5ff',
                  secondary: '#fff',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
