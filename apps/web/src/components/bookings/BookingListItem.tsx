'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import BookingStatusBadge from './BookingStatusBadge';

export interface Booking {
  id: string;
  roomName: string;
  date: string;
  time?: string;
  price: number;
  status: string;
}

interface Props {
  booking: Booking;
  index?: number;
}

export default function BookingListItem({ booking, index = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-4 p-4 hover:bg-gray-900/20 transition-colors"
    >
      <div className="w-10 h-10 rounded-xl bg-red-950/50 flex items-center justify-center flex-shrink-0">
        <i className="fas fa-skull text-red-500" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-vazir text-gray-200 truncate">{booking.roomName}</p>
        <p className="text-xs text-gray-600 font-vazir mt-0.5">
          {booking.date}
          {booking.time && ` · ${booking.time}`}
        </p>
      </div>

      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <BookingStatusBadge status={booking.status} />
        <p className="text-xs font-cinzel text-red-400">
          {booking.price.toLocaleString('fa-IR')} ت
        </p>
      </div>

      <Link
        href={`/bookings/${booking.id}`}
        className="text-gray-600 hover:text-red-400 transition-colors flex-shrink-0 p-1"
        aria-label="مشاهده جزئیات"
      >
        <i className="fas fa-chevron-left" />
      </Link>
    </motion.div>
  );
}
