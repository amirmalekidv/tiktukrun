'use client';
import { useState, useEffect, useCallback } from 'react';
import { ChevronRight, ChevronLeft, RefreshCw } from 'lucide-react';
import { SectionHeader, StatusBadge, Modal } from '@/components/ui';
import { formatToman } from '@/lib/utils/format';
import moment from 'moment-jalaali';
import { bookingsApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface CalEvent {
  id: string;
  code: string;
  game: string;
  branch: string;
  user: string;
  dateKey: string; // YYYY-MM-DD (gregorian)
  time: string;
  players: number;
  status: string;
  amount: string;
}

const STATUS_BG: Record<string, string> = {
  CONFIRMED: 'bg-blue-500/80',
  PENDING: 'bg-yellow-500/80',
  COMPLETED: 'bg-green-500/80',
  CANCELLED: 'bg-red-500/80',
  REFUNDED: 'bg-purple-500/80',
};

const STATUS_FA: Record<string, string> = {
  CONFIRMED: 'تأیید شده',
  PENDING: 'در انتظار',
  COMPLETED: 'تکمیل شده',
  CANCELLED: 'لغو شده',
  REFUNDED: 'بازگشت وجه',
};

// getCalendar is single-wrapped: { success, data: { branchId, from, to, calendar } }
function readData<T>(res: any): T {
  const body = res?.data;
  if (body && typeof body === 'object' && 'data' in body) return body.data as T;
  return body as T;
}

export default function BookingCalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(moment());
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null);
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const jalaliMonth = currentMonth.format('jMMMM jYYYY');
  const _endOfJMonth = moment(currentMonth).endOf('jMonth' as any);
  const daysInMonth = parseInt(_endOfJMonth.format('jD'), 10) || 30;
  const firstDayOfWeek = parseInt(moment(currentMonth).startOf('jMonth' as any).format('d'));
  const adjustedFirstDay = (firstDayOfWeek + 1) % 7;
  const dayNames = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const from = moment(currentMonth).startOf('jMonth' as any).toISOString();
      const to = moment(currentMonth).endOf('jMonth' as any).toISOString();
      const res = await bookingsApi.getCalendar({ from, to });
      const data = readData<{ calendar?: Record<string, any[]> }>(res);
      const calendar = data?.calendar || {};
      const flat: CalEvent[] = [];
      for (const [dateKey, list] of Object.entries(calendar)) {
        for (const b of list as any[]) {
          flat.push({
            id: b.id,
            code: b.code,
            game: b.game?.title || '—',
            branch: b.branch?.name || '—',
            user: b.user?.fullName || '—',
            dateKey,
            time: b.slotDateTime
              ? new Date(b.slotDateTime).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
              : '',
            players: b.playersCount ?? 0,
            status: b.status,
            amount: String(b.totalAmount ?? 0),
          });
        }
      }
      setEvents(flat);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'خطا در دریافت تقویم رزروها');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    load();
  }, [load]);

  const getEventsForDay = (day: number) => {
    const dayDate = moment(currentMonth).startOf('jMonth').add(day - 1, 'days');
    const key = dayDate.format('YYYY-MM-DD');
    return events.filter((e) => e.dateKey === key);
  };

  return (
    <div className="fade-in">
      <SectionHeader
        title="تقویم رزروها"
        subtitle="نمای تقویمی رزروهای فعال (در انتظار/تأیید شده) به تفکیک تاریخ شمسی"
        breadcrumb={[{ label: 'رزروها', href: '/bookings' }, { label: 'تقویم' }]}
        actions={
          <button onClick={load} className="btn-secondary flex items-center gap-2" disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            بروزرسانی
          </button>
        }
      />

      <div className="admin-card">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setCurrentMonth(moment(currentMonth).subtract(1, 'jMonth'))}
            className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <h2 className="text-white font-black text-xl flex items-center gap-2">
            {jalaliMonth}
            {loading && <RefreshCw className="w-4 h-4 text-red-400 animate-spin" />}
          </h2>
          <button
            onClick={() => setCurrentMonth(moment(currentMonth).add(1, 'jMonth'))}
            className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 mb-2">
          {dayNames.map((d) => (
            <div key={d} className="text-center text-slate-500 text-sm font-bold py-2">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array(adjustedFirstDay)
            .fill(0)
            .map((_, i) => (
              <div key={`empty-${i}`} className="h-28 rounded-lg" />
            ))}

          {Array(daysInMonth)
            .fill(0)
            .map((_, i) => {
              const day = i + 1;
              const dayEvents = getEventsForDay(day);
              const isToday = moment(currentMonth).startOf('jMonth').add(i, 'days').isSame(moment(), 'day');

              return (
                <div
                  key={day}
                  className={`h-28 rounded-lg p-1.5 border transition-all ${
                    isToday
                      ? 'border-red-500/50 bg-red-500/5'
                      : 'border-slate-700/30 hover:border-slate-600/50 hover:bg-slate-700/20'
                  }`}
                >
                  <div className={`text-sm font-bold mb-1 ${isToday ? 'text-red-400' : 'text-slate-300'}`}>{day}</div>
                  <div className="space-y-1 overflow-hidden">
                    {dayEvents.slice(0, 2).map((event) => (
                      <button
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        className={`w-full text-right text-xs px-1.5 py-0.5 rounded ${
                          STATUS_BG[event.status] || 'bg-slate-600'
                        } text-white truncate block`}
                      >
                        {event.time} — {event.game}
                      </button>
                    ))}
                    {dayEvents.length > 2 && (
                      <p className="text-slate-500 text-xs px-1">+{dayEvents.length - 2} بیشتر</p>
                    )}
                  </div>
                </div>
              );
            })}
        </div>

        <div className="flex items-center gap-4 mt-6 pt-4 border-t border-slate-700 flex-wrap">
          <span className="text-slate-500 text-sm">وضعیت‌ها:</span>
          {Object.entries(STATUS_BG).map(([key, bg]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded ${bg}`} />
              <span className="text-slate-400 text-xs">{STATUS_FA[key] || key}</span>
            </div>
          ))}
        </div>
      </div>

      {selectedEvent && (
        <Modal
          open={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          title={`رزرو #${selectedEvent.code}`}
          size="md"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <StatusBadge status={selectedEvent.status} />
              <span className="text-slate-300 font-mono">{selectedEvent.time}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-slate-500 text-xs mb-1">بازی</p>
                <p className="text-white font-medium">{selectedEvent.game}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-1">شعبه</p>
                <p className="text-white font-medium">{selectedEvent.branch}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-1">مشتری</p>
                <p className="text-white font-medium">{selectedEvent.user}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-1">تعداد بازیکنان</p>
                <p className="text-white font-medium">{selectedEvent.players} نفر</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-1">مبلغ</p>
                <p className="text-white font-bold">{formatToman(selectedEvent.amount)}</p>
              </div>
            </div>
            <a href={`/bookings/${selectedEvent.id}`} className="btn-primary w-full justify-center">
              مشاهده جزئیات کامل
            </a>
          </div>
        </Modal>
      )}
    </div>
  );
}
