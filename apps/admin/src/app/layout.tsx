import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'TIK TAK RUN — پنل مدیریت',
  description: 'داشبورد مدیریت پلتفرم سرگرمی TIK TAK RUN',
  icons: {
    icon: [{ url: '/tiktakrun-logo.svg', type: 'image/svg+xml' }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body className="bg-slate-900 text-slate-100 font-sans antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid rgba(148,163,184,0.1)',
              fontFamily: 'Vazirmatn, sans-serif',
              direction: 'rtl',
            },
            success: {
              iconTheme: { primary: '#22c55e', secondary: '#0f172a' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#0f172a' },
            },
          }}
        />
      </body>
    </html>
  );
}
