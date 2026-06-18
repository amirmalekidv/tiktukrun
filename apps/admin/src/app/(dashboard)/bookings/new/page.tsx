'use client';
import { SectionHeader, EmptyState } from '@/components/ui';
import { useRouter } from 'next/navigation';
import { Info, ArrowRight } from 'lucide-react';

// NOTE: The backend exposes no admin "create booking" endpoint
// (BookingsAdminController only supports list / detail / status / refund / complete / rate-player).
// Manual bookings must be created through the customer booking flow (POST /bookings).
// This page therefore documents that limitation instead of faking a create form.
export default function NewBookingPage() {
  const router = useRouter();

  return (
    <div className="fade-in">
      <SectionHeader
        title="رزرو دستی"
        subtitle="ثبت رزرو جدید"
        breadcrumb={[{ label: 'رزروها', href: '/bookings' }, { label: 'رزرو جدید' }]}
      />

      <div className="admin-card max-w-2xl">
        <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl mb-4">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-slate-300 leading-relaxed">
            <p className="font-bold text-blue-300 mb-1">ثبت رزرو دستی از پنل ادمین فعال نیست</p>
            <p>
              ساخت رزرو جدید تنها از طریق فرایند رزرو کاربر (اپلیکیشن/سایت مشتری) انجام می‌شود.
              پنل مدیریت امکان مشاهده، تأیید، لغو، بازگشت وجه و تکمیل رزروها را فراهم می‌کند.
            </p>
          </div>
        </div>

        <EmptyState
          title="رزرو دستی در دسترس نیست"
          description="برای ثبت رزرو از سمت مشتری استفاده کنید. برای مدیریت رزروهای موجود به فهرست رزروها بازگردید."
          action={
            <button onClick={() => router.push('/bookings')} className="btn-primary flex items-center gap-2">
              <ArrowRight className="w-4 h-4" />
              بازگشت به فهرست رزروها
            </button>
          }
        />
      </div>
    </div>
  );
}
