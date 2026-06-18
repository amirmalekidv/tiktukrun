'use client';
import { toJalaliDateTime } from '@/lib/utils/format';
import type { BookingEvent } from '@/lib/types';
import {
  CheckCircle, XCircle, CreditCard, Star, Clock,
  AlertCircle, RefreshCw, User
} from 'lucide-react';

const EVENT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  CREATED: Clock,
  PAID: CreditCard,
  CONFIRMED: CheckCircle,
  COMPLETED: CheckCircle,
  CANCELLED: XCircle,
  REFUNDED: RefreshCw,
  RATED: Star,
  STATUS_CHANGED: AlertCircle,
  NOTE_ADDED: User,
};

const EVENT_COLORS: Record<string, string> = {
  CREATED: 'text-blue-400 bg-blue-500/20',
  PAID: 'text-green-400 bg-green-500/20',
  CONFIRMED: 'text-green-400 bg-green-500/20',
  COMPLETED: 'text-purple-400 bg-purple-500/20',
  CANCELLED: 'text-red-400 bg-red-500/20',
  REFUNDED: 'text-yellow-400 bg-yellow-500/20',
  RATED: 'text-yellow-400 bg-yellow-500/20',
  STATUS_CHANGED: 'text-slate-400 bg-slate-500/20',
  NOTE_ADDED: 'text-blue-400 bg-blue-500/20',
};

export default function BookingTimeline({ events }: { events: BookingEvent[] }) {
  if (!events || events.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 text-sm">رویدادی ثبت نشده</div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event, i) => {
        const Icon = EVENT_ICONS[event.type] || Clock;
        const colorClass = EVENT_COLORS[event.type] || 'text-slate-400 bg-slate-500/20';

        return (
          <div key={event.id} className="flex gap-4">
            {/* Line */}
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${colorClass} flex-shrink-0`}>
                <Icon className="w-4 h-4" />
              </div>
              {i < events.length - 1 && (
                <div className="w-px flex-1 bg-slate-700/50 mt-2 mb-0" />
              )}
            </div>
            {/* Content */}
            <div className="pb-4 flex-1">
              <p className="text-white text-sm font-medium">{event.description}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-slate-500 text-xs">{toJalaliDateTime(event.createdAt)}</span>
                {event.actor && (
                  <span className="text-slate-600 text-xs">توسط: {event.actor.name}</span>
                )}
              </div>
              {event.meta && Object.keys(event.meta).length > 0 && (
                <div className="mt-2 p-2 bg-slate-700/30 rounded-lg">
                  <pre className="text-slate-400 text-xs overflow-x-auto">
                    {JSON.stringify(event.meta, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
