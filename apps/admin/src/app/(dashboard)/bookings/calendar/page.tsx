'use client';
import { useState } from 'react';
import { ChevronRight, ChevronLeft, Calendar } from 'lucide-react';
import { SectionHeader, StatusBadge, Modal } from '@/components/ui';
import { toJalali, formatToman, STATUS_COLORS } from '@/lib/utils/format';
import moment from 'moment-jalaali';

type CalendarView = 'month' | 'week' | 'day';

// Mock calendar events
const MOCK_EVENTS = [
  { id: 'b1', code: 'BK-100001', game: 'اتاق فرار تاریک', branch: 'تهران', user: 'علی احمدی', date: new Date(), time: '14:00', players: 4, status: 'CONFIRMED', amount: '900000' },
  { id: 'b2', code: 'BK-100002', game: 'لیزرتگ پرو', branch: 'مشهد', user: 'سارا محمدی', date: new Date(), time: '16:00', players: 6, status: 'PENDING', amount: '1200000' },
  { id: 'b3', code: 'BK-100003', game: 'VR ماجرا', branch: 'تهران', user: 'رضا کریمی', date: new Date(Date.now() + 86400000), time: '18:00', players: 2, status: 'COMPLETED', amount: '600000' },
  { id: 'b4', code: 'BK-100004', game: 'ترس مطلق', branch: 'اصفهان', user: 'نیلوفر حسینی', date: new Date(Date.now() + 86400000 * 2), time: '20:00', players: 3, status: 'CONFIRMED', amount: '750000' },
];

const STATUS_BG: Record<string, string> = {
  CONFIRMED: 'bg-blue-500/80',
  PENDING: 'bg-yellow-500/80',
  COMPLETED: 'bg-green-500/80',
  CANCELLED: 'bg-red-500/80',
  REFUNDED: 'bg-purple-500/80',
};

export default function BookingCalendarPage() {
  const [view, setView] = useState<CalendarView>('month');
  const [currentMonth, setCurrentMonth] = useState(moment());
  const [selectedEvent, setSelectedEvent] = useState<typeof MOCK_EVENTS[0] | null>(null);
  const [branch, setBranch] = useState('');

  const jalaliMonth = currentMonth.format('jMMMM jYYYY');
  // jDaysInMonth is a STATIC method on moment-jalaali (not an instance method).
  // Compute days-in-month safely: clone, go to next month, subtract one day, read jDate.
  const _endOfJMonth = moment(currentMonth).endOf('jMonth' as any);
  const daysInMonth = parseInt(_endOfJMonth.format('jD'), 10) || 30;
  const firstDayOfWeek = parseInt(moment(currentMonth).startOf('jMonth' as any).format('d')); // 0=Sun ... 6=Sat

  // Adjust for RTL (Saturday first in Persian calendar)
  const adjustedFirstDay = (firstDayOfWeek + 1) % 7; // Sat=0 in Persian

  const dayNames = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

  const getEventsForDay = (day: number) => {
    const dayDate = moment(currentMonth).startOf('jMonth').add(day - 1, 'days');
    return MOCK_EVENTS.filter(e => {
      const ed = moment(e.date);
      return ed.isSame(dayDate, 'day');
    });
  };

  return (
    <div className="fade-in">
      <SectionHeader
        title="تقویم رزروها"
        subtitle="نمای تقویمی تمام رزروها به تفکیک تاریخ شمسی"
        breadcrumb={[{ label: 'رزروها', href: '/bookings' }, { label: 'تقویم' }]}
        actions={
          <div className="flex items-center gap-2">
            <select
              value={branch}
              onChange={e => setBranch(e.target.value)}
              className="select-field w-40 text-sm"
            >
              <option value="">همه شعب</option>
              <option value="tehran">تهران</option>
              <option value="mashhad">مشهد</option>
            </select>
            <div className="flex rounded-lg border border-slate-700 overflow-hidden">
              {(['month', 'week', 'day'] as CalendarView[]).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-2 text-sm font-medium transition-all ${view === v ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  {v === 'month' ? 'ماه' : v === 'week' ? 'هفته' : 'روز'}
                </button>
              ))}
            </div>
          </div>
        }
      />

      <div className="admin-card">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setCurrentMonth(moment(currentMonth).subtract(1, 'jMonth'))}
            className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <h2 className="text-white font-black text-xl">{jalaliMonth}</h2>
          <button
            onClick={() => setCurrentMonth(moment(currentMonth).add(1, 'jMonth'))}
            className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Day Names */}
        <div className="grid grid-cols-7 mb-2">
          {dayNames.map(d => (
            <div key={d} className="text-center text-slate-500 text-sm font-bold py-2">{d}</div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells before first day */}
          {Array(adjustedFirstDay).fill(0).map((_, i) => (
            <div key={`empty-${i}`} className="h-28 rounded-lg" />
          ))}

          {/* Actual days */}
          {Array(daysInMonth).fill(0).map((_, i) => {
            const day = i + 1;
            const events = getEventsForDay(day);
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
                <div className={`text-sm font-bold mb-1 ${isToday ? 'text-red-400' : 'text-slate-300'}`}>
                  {day}
                </div>
                <div className="space-y-1 overflow-hidden">
                  {events.slice(0, 2).map(event => (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className={`w-full text-right text-xs px-1.5 py-0.5 rounded ${STATUS_BG[event.status] || 'bg-slate-600'} text-white truncate block`}
                    >
                      {event.time} — {event.game}
                    </button>
                  ))}
                  {events.length > 2 && (
                    <p className="text-slate-500 text-xs px-1">+{events.length - 2} بیشتر</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-6 pt-4 border-t border-slate-700">
          <span className="text-slate-500 text-sm">وضعیت‌ها:</span>
          {Object.entries(STATUS_BG).map(([key, bg]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded ${bg}`} />
              <span className="text-slate-400 text-xs">{['CONFIRMED', 'PENDING', 'COMPLETED', 'CANCELLED', 'REFUNDED'].includes(key) ? { CONFIRMED: 'تأیید شده', PENDING: 'در انتظار', COMPLETED: 'تکمیل شده', CANCELLED: 'لغو شده', REFUNDED: 'بازگشت وجه' }[key] : key}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Event Detail Modal */}
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
            <a
              href={`/bookings/${selectedEvent.id}`}
              className="btn-primary w-full justify-center"
            >
              مشاهده جزئیات کامل
            </a>
          </div>
        </Modal>
      )}
    </div>
  );
}
