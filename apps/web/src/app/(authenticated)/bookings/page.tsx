'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import useSWR from 'swr';
import { bookingsApi } from '@/lib/api/bookings';
import { USE_MOCK } from '@/lib/http';
import BookingListItem from '@/components/bookings/BookingListItem';

type StatusFilter = '' | 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: '', label: 'همه' },
  { value: 'PENDING', label: 'در انتظار' },
  { value: 'CONFIRMED', label: 'تأیید شده' },
  { value: 'COMPLETED', label: 'انجام شده' },
  { value: 'CANCELLED', label: 'لغو شده' },
];

interface Booking {
  id: string;
  roomName: string;
  date: string;
  time?: string;
  price: number;
  status: string;
}

interface ApiBooking {
  id: string;
  status: string;
  totalAmount?: number | string;
  slotDateTime?: string;
  game?: {
    title?: string;
  };
}

const DEMO_BOOKINGS: Booking[] = [
  { id: 'b1', roomName: 'اتاق وحشت شماره ۱', date: '۱۴۰۳/۱۰/۰۵', time: '۱۸:۰۰', price: 120000, status: 'CONFIRMED' },
  { id: 'b2', roomName: 'معمای هزارتو', date: '۱۴۰۳/۰۹/۲۰', time: '۲۰:۰۰', price: 95000, status: 'COMPLETED' },
  { id: 'b3', roomName: 'قلعه ارواح', date: '۱۴۰۳/۰۹/۱۰', price: 150000, status: 'CANCELLED' },
];

function normalizeBooking(booking: ApiBooking): Booking {
  const slotDate = booking.slotDateTime ? new Date(booking.slotDateTime) : null;
  return {
    id: booking.id,
    roomName: booking.game?.title ?? 'رزرو',
    date: slotDate ? slotDate.toLocaleDateString('fa-IR') : '—',
    time: slotDate
      ? slotDate.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
      : undefined,
    price: Number(booking.totalAmount ?? 0),
    status: booking.status,
  };
}

export default function BookingsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');

  const { data, isLoading } = useSWR(
    ['bookings', statusFilter],
    ([, status]) => bookingsApi.getMyBookings({ status: status || undefined }).catch(() => null),
    { keepPreviousData: true }
  );

  const bookingsData = data as { data?: ApiBooking[] } | ApiBooking[] | null;
  const bookings: Booking[] =
    Array.isArray(bookingsData)
      ? bookingsData.map(normalizeBooking)
      : bookingsData?.data?.map(normalizeBooking) ?? (USE_MOCK ? DEMO_BOOKINGS : []);
  const filtered = statusFilter
    ? bookings.filter((b) => b.status === statusFilter)
    : bookings;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="font-cinzel text-2xl text-red-500">رزروهای من</h1>
        <p className="text-gray-500 font-vazir text-sm mt-1">تاریخچه رزرو اتاق‌های ترس</p>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setStatusFilter(value)}
            className={`
              whitespace-nowrap px-4 py-2 rounded-xl text-sm font-vazir border transition-all flex-shrink-0
              ${statusFilter === value
                ? 'bg-red-900/40 border-red-700/50 text-red-300'
                : 'border-gray-800/50 text-gray-500 hover:border-red-900/40 hover:text-gray-300'
              }
            `}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Bookings list */}
      <div className="dark-card rounded-2xl border border-red-900/20 bg-white/[0.03] divide-y divide-gray-900/50 overflow-hidden">
        {isLoading ? (
          <div className="space-y-px">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-900/30 animate-pulse m-2 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <i className="fas fa-calendar-times text-5xl text-gray-700 mb-4 block" />
            <p className="text-gray-500 font-vazir">رزروی یافت نشد</p>
          </div>
        ) : (
          filtered.map((booking, i) => (
            <BookingListItem key={booking.id} booking={booking} index={i} />
          ))
        )}
      </div>
    </motion.div>
  );
}
