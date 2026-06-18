'use client';
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useNotificationStore } from '@/stores/notificationStore';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationItem from './NotificationItem';

interface NotificationDropdownProps {
  onClose: () => void;
}

export default function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const { notifications, markAllAsRead } = useNotificationStore();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications on mount
  useNotifications(1);

  const recent = notifications.slice(0, 5);

  // Click-outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <motion.div
      ref={dropdownRef}
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      // Use right-0 for RTL layout so dropdown opens to the left
      className="absolute right-0 top-12 w-80 bg-[#0d0d0d] border border-red-900/30 rounded-2xl shadow-2xl z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800/50">
        <h3 className="font-cinzel text-red-500 text-sm">اعلان‌ها</h3>
        <button
          onClick={markAllAsRead}
          className="text-xs text-gray-500 hover:text-gray-300 font-vazir transition-colors"
        >
          خواندن همه
        </button>
      </div>

      {/* Notification list */}
      <div className="max-h-80 overflow-y-auto divide-y divide-gray-900/50">
        {recent.length === 0 ? (
          <div className="p-6 text-center text-gray-600 font-vazir text-sm">
            <i className="fas fa-bell-slash text-2xl mb-2 block" />
            اعلانی وجود ندارد
          </div>
        ) : (
          recent.map((n, i) => (
            <NotificationItem key={n.id} notification={n} index={i} />
          ))
        )}
      </div>

      {/* Footer link */}
      <div className="p-3 border-t border-gray-800/50">
        <Link
          href="/notifications"
          onClick={onClose}
          className="block text-center text-xs text-red-400 hover:text-red-300 font-vazir transition-colors"
        >
          مشاهده همه اعلان‌ها
          <i className="fas fa-arrow-left mr-1 text-[10px]" />
        </Link>
      </div>
    </motion.div>
  );
}
