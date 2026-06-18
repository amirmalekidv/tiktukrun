'use client';
import Link from 'next/link';
import { User, MapPin, Calendar, CreditCard, Star, FileText } from 'lucide-react';
import { Avatar, StatusBadge } from '@/components/ui';
import { formatToman, toJalaliDateTime, persianNum } from '@/lib/utils/format';
import type { Booking } from '@/lib/types';

export default function BookingDetailCard({ booking }: { booking: Booking }) {
  const sections = [
    {
      title: 'اطلاعات مشتری',
      icon: User,
      content: (
        <div className="flex items-center gap-4">
          <Avatar name={booking.user?.name} src={booking.user?.avatar} size="lg" />
          <div>
            <Link href={`/customers/${booking.userId}`} className="text-white font-bold hover:text-red-400 text-lg">
              {booking.user?.name}
            </Link>
            <p className="text-slate-400 font-mono">{booking.user?.mobile}</p>
            <p className="text-slate-500 text-sm">{booking.user?.email}</p>
          </div>
        </div>
      ),
    },
    {
      title: 'بازی و شعبه',
      icon: MapPin,
      content: (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-slate-500 text-xs mb-1">بازی</p>
            <Link href={`/games/${booking.gameId}`} className="text-white hover:text-red-400 font-medium">
              {booking.game?.title || '—'}
            </Link>
          </div>
          <div>
            <p className="text-slate-500 text-xs mb-1">شعبه</p>
            <Link href={`/branches/${booking.branchId}`} className="text-white hover:text-red-400 font-medium">
              {booking.branch?.name || '—'}
            </Link>
            <p className="text-slate-500 text-xs">{booking.branch?.city?.name}</p>
          </div>
        </div>
      ),
    },
    {
      title: 'زمان و نفرات',
      icon: Calendar,
      content: (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-slate-500 text-xs mb-1">تاریخ رزرو</p>
            <p className="text-white font-medium">{toJalaliDateTime(booking.slotDate)}</p>
            <p className="text-slate-400 text-sm">{booking.slotTime}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs mb-1">تعداد بازیکنان</p>
            <p className="text-white font-bold text-2xl">{persianNum(booking.playersCount)} نفر</p>
          </div>
        </div>
      ),
    },
    {
      title: 'پرداخت',
      icon: CreditCard,
      content: (
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-400">مبلغ اصلی</span>
            <span className="text-white">{formatToman(booking.amount)}</span>
          </div>
          {booking.discountAmount && Number(booking.discountAmount) > 0 && (
            <div className="flex justify-between">
              <span className="text-slate-400">تخفیف</span>
              <span className="text-green-400">-{formatToman(booking.discountAmount)}</span>
            </div>
          )}
          <div className="border-t border-slate-700 pt-2 flex justify-between">
            <span className="text-white font-bold">مبلغ نهایی</span>
            <span className="text-white font-black text-lg">{formatToman(booking.finalAmount)}</span>
          </div>
          {booking.paymentRef && (
            <div className="flex justify-between">
              <span className="text-slate-400">کد پیگیری</span>
              <span className="text-slate-300 font-mono text-sm">{booking.paymentRef}</span>
            </div>
          )}
        </div>
      ),
    },
  ];

  if (booking.rating) {
    sections.push({
      title: 'امتیاز کاربر',
      icon: Star,
      content: (
        <div className="flex items-center gap-2">
          {Array(5).fill(0).map((_, i) => (
            <Star key={i} className={`w-6 h-6 ${i < booking.rating! ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`} />
          ))}
          <span className="text-white font-bold mr-2">{booking.rating} از ۵</span>
        </div>
      ),
    });
  }

  if (booking.notes) {
    sections.push({
      title: 'یادداشت',
      icon: FileText,
      content: <p className="text-slate-300 text-sm leading-relaxed">{booking.notes}</p>,
    });
  }

  return (
    <div className="space-y-4">
      {sections.map((section, i) => (
        <div key={i} className="admin-card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
              <section.icon className="w-4 h-4 text-red-400" />
            </div>
            <h3 className="text-white font-bold">{section.title}</h3>
          </div>
          {section.content}
        </div>
      ))}
    </div>
  );
}
