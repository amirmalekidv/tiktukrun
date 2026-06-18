'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Eye, Edit, RotateCcw, XCircle, Download, MessageSquare } from 'lucide-react';
import { Avatar, StatusBadge, Table, Pagination, ConfirmDialog } from '@/components/ui';
import { formatToman, toJalaliDateTime, persianNum } from '@/lib/utils/format';
import type { Booking } from '@/lib/types';
import toast from 'react-hot-toast';
import { bookingsApi } from '@/lib/api';

interface BookingsTableProps {
  bookings: Booking[];
  loading?: boolean;
  total?: number;
  page?: number;
  totalPages?: number;
  onPageChange?: (p: number) => void;
  onRefresh?: () => void;
  selectedIds?: string[];
  onSelectIds?: (ids: string[]) => void;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  WALLET: 'کیف پول',
  ZARINPAL: 'زرین‌پال',
  CASH: 'نقد',
  MIXED: 'ترکیبی',
};

export default function BookingsTable({
  bookings, loading, total, page = 1, totalPages = 1,
  onPageChange, onRefresh, selectedIds = [], onSelectIds,
}: BookingsTableProps) {
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const headers = ['', 'کد رزرو', 'مشتری', 'بازی / شعبه', 'تاریخ و ساعت', 'نفرات', 'مبلغ', 'پرداخت', 'وضعیت', 'عملیات'];

  const handleSelect = (id: string) => {
    if (!onSelectIds) return;
    onSelectIds(
      selectedIds.includes(id)
        ? selectedIds.filter(x => x !== id)
        : [...selectedIds, id]
    );
  };

  const handleSelectAll = () => {
    if (!onSelectIds) return;
    onSelectIds(
      selectedIds.length === bookings.length ? [] : bookings.map(b => b.id)
    );
  };

  const handleCancel = async () => {
    if (!cancelId) return;
    setActionLoading(true);
    try {
      await bookingsApi.cancel(cancelId, 'لغو توسط ادمین');
      toast.success('رزرو با موفقیت لغو شد');
      onRefresh?.();
    } catch {
      toast.error('خطا در لغو رزرو');
    } finally {
      setActionLoading(false);
      setCancelId(null);
    }
  };

  const handleExport = async () => {
    try {
      const resp = await bookingsApi.exportExcel();
      const blob = new Blob([resp.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url;
      a.download = 'bookings.xlsx'; a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('خطا در دانلود فایل');
    }
  };

  return (
    <div className="admin-card">
      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="mb-4 p-3 bg-red-600/10 border border-red-500/20 rounded-xl flex items-center gap-3">
          <span className="text-red-400 text-sm font-medium">{persianNum(selectedIds.length)} مورد انتخاب شده</span>
          <button onClick={handleExport} className="btn-secondary text-sm py-1.5">
            <Download className="w-4 h-4" />
            خروجی Excel
          </button>
          <button className="btn-secondary text-sm py-1.5">
            <MessageSquare className="w-4 h-4" />
            ارسال SMS
          </button>
          <button onClick={() => onSelectIds?.([])} className="btn-ghost text-sm py-1.5 mr-auto">
            پاک کردن انتخاب
          </button>
        </div>
      )}

      <Table headers={headers} loading={loading}>
        <tr>
          <td>
            <input
              type="checkbox"
              checked={selectedIds.length === bookings.length && bookings.length > 0}
              onChange={handleSelectAll}
              className="w-4 h-4 accent-red-600 rounded"
            />
          </td>
          {Array(headers.length - 1).fill(null).map((_, i) => <td key={i}></td>)}
        </tr>
        {bookings.length === 0 && !loading ? (
          <tr>
            <td colSpan={headers.length} className="text-center text-slate-500 py-8">رزروی یافت نشد</td>
          </tr>
        ) : (
          bookings.map((booking) => (
            <tr key={booking.id}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(booking.id)}
                  onChange={() => handleSelect(booking.id)}
                  className="w-4 h-4 accent-red-600"
                />
              </td>
              <td>
                <Link href={`/bookings/${booking.id}`} className="text-red-400 hover:text-red-300 font-mono text-sm font-bold">
                  #{booking.code}
                </Link>
              </td>
              <td>
                <div className="flex items-center gap-2">
                  <Avatar name={booking.user?.name} src={booking.user?.avatar} size="sm" />
                  <div>
                    <Link href={`/customers/${booking.userId}`} className="text-white hover:text-red-400 text-sm font-medium">
                      {booking.user?.name || '—'}
                    </Link>
                    <p className="text-slate-500 text-xs font-mono">{booking.user?.mobile}</p>
                  </div>
                </div>
              </td>
              <td>
                <div>
                  <p className="text-white text-sm font-medium">{booking.game?.title || '—'}</p>
                  <p className="text-slate-500 text-xs">{booking.branch?.name || '—'}</p>
                </div>
              </td>
              <td>
                <div className="text-sm">
                  <p className="text-slate-300">{toJalaliDateTime(booking.slotDate)}</p>
                  <p className="text-slate-500 text-xs">{booking.slotTime}</p>
                </div>
              </td>
              <td className="text-center">
                <span className="badge bg-blue-500/20 text-blue-400">
                  {persianNum(booking.playersCount)} نفر
                </span>
              </td>
              <td>
                <p className="text-white font-bold text-sm">{formatToman(booking.finalAmount)}</p>
                {booking.discountAmount && Number(booking.discountAmount) > 0 && (
                  <p className="text-green-400 text-xs">-{formatToman(booking.discountAmount)}</p>
                )}
              </td>
              <td>
                <span className="text-slate-400 text-xs">
                  {PAYMENT_METHOD_LABELS[booking.paymentMethod] || booking.paymentMethod}
                </span>
              </td>
              <td>
                <StatusBadge status={booking.status} />
              </td>
              <td>
                <div className="flex items-center gap-1">
                  <Link href={`/bookings/${booking.id}`} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all" title="مشاهده">
                    <Eye className="w-4 h-4" />
                  </Link>
                  {booking.status !== 'CANCELLED' && booking.status !== 'REFUNDED' && (
                    <>
                      <Link href={`/bookings/${booking.id}?edit=1`} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all" title="ویرایش">
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => setCancelId(booking.id)}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-all"
                        title="لغو رزرو"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {(booking.status === 'COMPLETED' || booking.status === 'CONFIRMED') && (
                    <button className="p-1.5 text-slate-400 hover:text-yellow-400 hover:bg-yellow-900/20 rounded-lg transition-all" title="بازگشت وجه">
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))
        )}
      </Table>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={onPageChange!}
        total={total}
      />

      <ConfirmDialog
        open={!!cancelId}
        onClose={() => setCancelId(null)}
        onConfirm={handleCancel}
        title="لغو رزرو"
        description="آیا از لغو این رزرو اطمینان دارید؟ این عمل قابل بازگشت نیست."
        confirmLabel="بله، لغو شود"
        variant="danger"
        loading={actionLoading}
      />
    </div>
  );
}
