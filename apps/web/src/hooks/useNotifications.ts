'use client';
import { useEffect } from 'react';
import useSWR from 'swr';
import { notificationsApi } from '@/lib/api/notifications';
import { useNotificationStore } from '@/stores/notificationStore';

export function useNotifications(page = 1) {
  const { setNotifications, addNotification, setUnreadCount } =
    useNotificationStore();

  const { data, error, isLoading, mutate } = useSWR(
    ['notifications', page],
    ([, p]) => notificationsApi.getNotifications({ page: p as number }).catch(() => null),
    { refreshInterval: 30000 }
  );

  const payload = data as { notifications?: unknown[]; items?: unknown[]; total?: number } | null;

  useEffect(() => {
    const list = payload?.notifications ?? payload?.items;
    if (list) {
      setNotifications(list as never);
    }
  }, [payload, setNotifications]);

  // Real-time socket subscription
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let cleanup: (() => void) | undefined;

    const setup = async () => {
      try {
        const { getSocket } = await import('@/lib/socket');
        const socket = getSocket();

        const onNotification = (notif: Parameters<typeof addNotification>[0]) => {
          addNotification(notif);
          mutate();
        };

        socket.on('notification', onNotification);

        return () => {
          socket.off('notification', onNotification);
        };
      } catch {
        return () => {};
      }
    };

    setup().then((fn) => { cleanup = fn; });

    return () => {
      if (cleanup) cleanup();
    };
  }, [addNotification, mutate]);

  // Poll unread count
  useSWR('notifications-unread', () => notificationsApi.getUnreadCount().catch(() => null), {
    refreshInterval: 30000,
    onSuccess: (d) => setUnreadCount(d?.count ?? 0),
  });

  return {
    notifications: payload?.notifications ?? payload?.items ?? [],
    total: payload?.total ?? 0,
    isLoading,
    error,
    mutate,
  };
}
