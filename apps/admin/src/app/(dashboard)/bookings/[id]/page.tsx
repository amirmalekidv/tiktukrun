'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { RotateCcw, Edit, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { SectionHeader, StatusBadge, EmptyState } from '@/components/ui';
import BookingDetailCard from '@/components/bookings/BookingDetailCard';
import BookingTimeline from '@/components/bookings/BookingTimeline';
import ChangeStatusDialog from '@/components/bookings/ChangeStatusDialog';
import RefundDialog from '@/components/bookings/RefundDialog';
import { formatToman, toJalaliDateTime } from '@/lib/utils/format';
import type { Booking, BookingEvent } from '@/lib/types';
import { bookingsApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { isPlatformAdmin } from '@/lib/route-permissions';
import toast from 'react-hot-toast';

// admin/bookings/:id is single-wrapped: { success, data: booking }
function readData<T>(res: any): T {
  const body = res?.data;
  if (body && typeof body === 'object' && 'data' in body) return body.data as T;
  return body as T;
}

function normalize(b: any): Booking {
  return {
    id: b.id,
    code: b.code,
    userId: b.userId,
    user: b.user
      ? ({
          id: b.user.id,
          name: b.user.fullName,
          mobile: b.user.mobile,
          email: b.user.email,
        } as any)
      : undefined,
    gameId: b.gameId,
    game: b.game ? ({ id: b.game.id, title: b.game.title } as any) : undefined,
    branchId: b.branchId,
    branch: b.game?.branch
      ? ({ id: b.branchId, name: b.game.branch.name, city: b.game.branch.city } as any)
      : b.branch
        ? ({ id: b.branchId, name: b.branch.name } as any)
        : undefined,
    slotId: b.slotId ?? '',
    slotDate: b.slotDateTime ?? b.createdAt,
    slotTime: b.slotDateTime
      ? new Date(b.slotDateTime).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
      : '',
    playersCount: b.playersCount ?? 0,
    teamName: b.teamName ?? undefined,
    amount: String(b.basePrice ?? 0),
    discountAmount: String(b.discountApplied ?? 0),
    finalAmount: String(b.totalAmount ?? 0),
    paymentMethod: b.paymentMethod ?? 'WALLET',
    paymentRef: b.payment?.gatewayRef ?? b.payment?.refId ?? undefined,
    status: b.status,
    notes: b.note ?? b.cancelReason ?? undefined,
    rating: b.review?.rating ?? undefined,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt ?? b.createdAt,
  } as Booking;
}

// Build a timeline from the booking's status timestamps (no dedicated event log in backend).
function buildTimeline(b: any): BookingEvent[] {
  const events: BookingEvent[] = [];
  if (b.createdAt) {
    events.push({ id: 'created', type: 'CREATED', description: 'رزرو ثبت شد', createdAt: b.createdAt } as BookingEvent);
  }
  if (b.payment?.paidAt) {
    events.push({
      id: 'paid',
      type: 'PAID',
      description: 'پرداخت انجام شد',
      createdAt: b.payment.paidAt,
      meta: b.payment.gatewayRef ? { ref: b.payment.gatewayRef } : undefined,
    } as BookingEvent);
  }
  if (b.completedAt) {
    events.push({ id: 'completed', type: 'COMPLETED', description: 'رزرو تکمیل شد', createdAt: b.completedAt } as BookingEvent);
  }
  if (b.cancelledAt) {
    events.push({
      id: 'cancelled',
      type: b.status === 'REFUNDED' ? 'REFUNDED' : 'CANCELLED',
      description: b.status === 'REFUNDED' ? 'بازگشت وجه انجام شد' : 'رزرو لغو شد',
      createdAt: b.cancelledAt,
      meta: b.cancelReason ? { reason: b.cancelReason } : undefined,
    } as BookingEvent);
  }
  if (b.review?.createdAt) {
    events.push({
      id: 'rated',
      type: 'RATED',
      description: `کاربر امتیاز ${b.review.rating} داد`,
      createdAt: b.review.createdAt,
    } as BookingEvent);
  }
  return events.sort((a, c) => new Date(a.createdAt).getTime() - new Date(c.createdAt).getTime());
}

export default function BookingDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const user = useAuthStore((s) => s.user);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [timeline, setTimeline] = useState<BookingEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await bookingsApi.getById(id);
      const raw = readData<any>(res);
      if (!raw) {
        setBooking(null);
      } else {
        setBooking(normalize(raw));
        setTimeline(buildTimeline(raw));
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'خطا در دریافت اطلاعات رزرو');
      setBooking(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <RefreshCw className="w-8 h-8 text-red-400 animate-spin" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="fade-in">
        <SectionHeader title="رزرو" breadcrumb={[{ label: 'رزروها', href: '/bookings' }, { label: 'یافت نشد' }]} />
        <EmptyState title="رزرو یافت نشد" description="رزرو مورد نظر وجود ندارد یا حذف شده است." />
      </div>
    );
  }

  const canRefund = isPlatformAdmin(user) && (booking.status === 'COMPLETED' || booking.status === 'CONFIRMED');

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
            <button onClick={() => setShowStatusDialog(true)} className="btn-secondary">
              <Edit className="w-4 h-4" />
              تغییر وضعیت
            </button>
            {canRefund && (
              <button onClick={() => setShowRefundDialog(true)} className="btn-danger">
                <RotateCcw className="w-4 h-4" />
                بازگشت وجه
              </button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <BookingDetailCard booking={booking} />
        </div>

        <div className="space-y-4">
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

          <div className="admin-card">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              تاریخچه رویدادها
            </h3>
            <BookingTimeline events={timeline} />
          </div>
        </div>
      </div>

      <ChangeStatusDialog
        open={showStatusDialog}
        onClose={() => setShowStatusDialog(false)}
        bookingId={booking.id}
        currentStatus={booking.status}
        onSuccess={load}
      />

      <RefundDialog
        open={showRefundDialog}
        onClose={() => setShowRefundDialog(false)}
        bookingId={booking.id}
        totalAmount={booking.finalAmount}
        onSuccess={load}
      />
    </div>
  );
}
