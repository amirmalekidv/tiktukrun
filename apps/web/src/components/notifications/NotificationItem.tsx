'use client';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { notificationsApi } from '@/lib/api/notifications';
import { useNotificationStore, type Notification } from '@/stores/notificationStore';

const TYPE_ICONS: Record<string, { icon: string; color: string }> = {
  booking: { icon: 'fa-calendar-check', color: '#dc2626' },
  wallet: { icon: 'fa-coins', color: '#f59e0b' },
  team: { icon: 'fa-users', color: '#8b5cf6' },
  system: { icon: 'fa-bell', color: '#6b7280' },
  reward: { icon: 'fa-gift', color: '#22d3ee' },
  invite: { icon: 'fa-user-plus', color: '#10b981' },
};

interface NotificationItemProps { notification: Notification; index?: number; }

export default function NotificationItem({ notification, index = 0 }: NotificationItemProps) {
  const router = useRouter();
  const { markAsRead } = useNotificationStore();
  const cfg = TYPE_ICONS[notification.type] ?? TYPE_ICONS.system;
  const dateObj = new Date(notification.createdAt);
  const timeStr = isNaN(dateObj.getTime())
    ? ''
    : dateObj.toLocaleDateString('fa-IR');

  const handleClick = async () => {
    if (!notification.isRead) {
      markAsRead(notification.id);
      notificationsApi.markAsRead(notification.id).catch(() => {});
    }
    if (notification.link) router.push(notification.link);
  };

  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.04 }}
      onClick={handleClick}
      className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all border ${notification.isRead ? 'border-transparent hover:bg-gray-900/30' : 'border-red-900/20 bg-red-950/10 hover:bg-red-950/20'}`}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: cfg.color + '20', color: cfg.color }}>
        <i className={`fas ${cfg.icon}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm font-vazir ${notification.isRead ? 'text-gray-400' : 'text-gray-200 font-bold'}`}>{notification.title}</p>
          {!notification.isRead && <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />}
        </div>
        <p className="text-xs text-gray-600 font-vazir mt-0.5 line-clamp-2">{notification.body}</p>
        <p className="text-[10px] text-gray-700 font-vazir mt-1">{timeStr}</p>
      </div>
    </motion.div>
  );
}
