'use client';
import { useState } from 'react';
import { useNotificationStore } from '@/stores/notificationStore';
import NotificationDropdown from './NotificationDropdown';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { unreadCount } = useNotificationStore();
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} className="relative text-gray-400 hover:text-red-400 transition-colors p-2">
        <i className="fas fa-bell text-lg" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center font-cinzel">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {open && <NotificationDropdown onClose={() => setOpen(false)} />}
    </div>
  );
}
