'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  RotateCcw,
  Edit, Clock, AlertCircle
} from 'lucide-react';
import { SectionHeader, StatusBadge, LoadingSpinner } from '@/components/ui';
import BookingDetailCard from '@/components/bookings/BookingDetailCard';
import BookingTimeline from '@/components/bookings/BookingTimeline';
import ChangeStatusDialog from '@/components/bookings/ChangeStatusDialog';
import RefundDialog from '@/components/bookings/RefundDialog';
import { formatToman, toJalaliDateTime } from '@/lib/utils/format';
import type { Booking, BookingStatus } from '@/lib/types';

// Mock data
const MOCK_BOOKING: Booking = {
  id: '1',
  code: 'BK-100001',
  userId: 'u1',
  user: {
    id: 'u1', name: 'علی احمدی', mobile: '09121234567', email: 'ali@example.com',
    roles: [], isActive: true, isVip: true, level: 5, tier: 'GOLD',
    xp: 2500, coins: 350, diamonds: 12, createdAt: '2024-01-15',
  },
  gameId: 'g1',
  game: {
    id: 'g1', title: 'اتاق فرار تاریک', slug: 'dark-room', categoryId: 'c1', branchId: 'br1',
    fearLevel: 4, difficulty: 'HARD', minPlayers: 2, maxPlayers: 6, duration: 60,
    pricePerPerson: '250000', tags: ['ترس', 'هیجان'], images: [], isActive: true,
    isFeatured: true, createdAt: '2024-01-01', updatedAt: '2024-01-01',
  },
  branchId: 'br1',
  branch: {
    id: 'br1', name: 'شعبه تهران', cityId: 'c1',
    city: { id: 'c1', name: 'تهران', slug: 'tehran', isActive: true },
    address: 'تهران، خیابان ولیعصر، پلاک ۱۲۳', isActive: true, createdAt: '2024-01-01',
  },
  slotId: 's1',
  slotDate: new Date().toISOString(),
  slotTime: '۲۰:۰۰',
  playersCount: 4,
  amount: '1000000',
  discountAmount: '100000',
  finalAmount: '900000',
  paymentMethod: 'ZARINPAL',
  paymentRef: 'ZP-987654321',
  status: 'CONFIRMED',
  notes: 'کاربر VIP — اولویت بالا',
  rating: 4,
  createdAt: new Date(Date.now() - 3600000).toISOString(),
  updatedAt: new Date().toISOString(),
  timeline: [
    { id: 'e1', type: 'CREATED', description: 'رزرو توسط کاربر ثبت شد', createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: 'e2', type: 'PAID', description: 'پرداخت آنلاین با موفقیت انجام شد', createdAt: new Date(Date.now() - 3500000).toISOString(), meta: { gateway: 'ZarinPal', refId: 'ZP-987654321' } },
    { id: 'e3', type: 'CONFIRMED', description: 'رزرو توسط سیستم تأیید شد', createdAt: new Date(Date.now() - 3400000).toISOString() },
  ],
};

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [booking, setBooking] = useState<Booking>(MOCK_BOOKING);

  const handleRefresh = () => {
    // Real: mutate()
  };

  const actionButtons = [
    {
      label: 'تغییر وضعیت',
      icon: <Edit className="w-4 h-4" />,
      onClick: () => setShowStatusDialog(true),
      className: 'btn-secondary',
    },
    booking.status === 'COMPLETED' || booking.status === 'CONFIRMED' ? {
      label: 'بازگشت وجه',
      icon: <RotateCcw className="w-4 h-4" />,
      onClick: () => setShowRefundDialog(true),
      className: 'btn-danger',
    } : null,
  ].filter(Boolean);

  return (
    <div className="fade-in">
      <SectionHeader
        title={`رزرو #${booking.code}`}
        breadcrumb={[
          { label: 'داشبورد', href: '/dashboard' },
          { label: 'رزروها', href: '/bookings' },
          { label: `#${booking.code}` },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={booking.status} />
            {actionButtons.map((btn, i) => btn && (
              <button key={i} onClick={btn.onClick} className={btn.className}>
                {btn.icon}
                {btn.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <BookingDetailCard booking={booking} />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick Info */}
          <div className="admin-card">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-red-400" />
              خلاصه
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">ثبت شده در</span>
                <span className="text-slate-300">{toJalaliDateTime(booking.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">آخرین بروزرسانی</span>
                <span className="text-slate-300">{toJalaliDateTime(booking.updatedAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">مبلغ نهایی</span>
                <span className="text-white font-bold">{formatToman(booking.finalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="admin-card">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              تاریخچه رویدادها
            </h3>
            <BookingTimeline events={booking.timeline || []} />
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <ChangeStatusDialog
        open={showStatusDialog}
        onClose={() => setShowStatusDialog(false)}
        bookingId={booking.id}
        currentStatus={booking.status}
        onSuccess={handleRefresh}
      />

      <RefundDialog
        open={showRefundDialog}
        onClose={() => setShowRefundDialog(false)}
        bookingId={booking.id}
        totalAmount={booking.finalAmount}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
