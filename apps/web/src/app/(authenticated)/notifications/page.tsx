'use client';
import { motion } from 'framer-motion';
import { useNotificationStore } from '@/stores/notificationStore';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationItem from '@/components/notifications/NotificationItem';
import { notificationsApi } from '@/lib/api/notifications';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const { notifications, unreadCount, markAllAsRead } = useNotificationStore();
  const { isLoading, mutate } = useNotifications(1);
  const handleMarkAll = async () => {
    markAllAsRead();
    try { await notificationsApi.markAllAsRead(); toast.success('همه خوانده شد'); mutate(); }
    catch { toast.error('خطا'); }
  };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="font-cinzel text-2xl text-red-500">اعلان‌ها</h1>
          {unreadCount > 0 && <p className="text-gray-500 font-vazir text-sm mt-1">{unreadCount} اعلان خوانده‌نشده</p>}
        </div>
        {unreadCount > 0 && <button onClick={handleMarkAll} className="text-sm text-red-400 border border-red-900/30 px-4 py-2 rounded-xl font-vazir hover:bg-red-900/20">خواندن همه</button>}
      </div>
      <div className="dark-card rounded-2xl border border-red-900/20 bg-[#0d0d0d] divide-y divide-gray-900/50 overflow-hidden">
        {isLoading ? [...Array(5)].map((_,i) => <div key={i} className="h-16 bg-gray-900/30 animate-pulse m-2 rounded-xl" />) :
          notifications.length === 0 ? <div className="py-20 text-center"><i className="fas fa-bell text-5xl text-gray-700 mb-4" /><p className="text-gray-500 font-vazir">اعلانی وجود ندارد</p></div> :
          notifications.map((n, i) => <NotificationItem key={n.id} notification={n} index={i} />)
        }
      </div>
    </motion.div>
  );
}
