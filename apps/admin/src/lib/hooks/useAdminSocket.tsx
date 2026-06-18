'use client';
/**
 * TIK TAK RUN — Admin Socket Hook
 * مدیریت مرکزی Socket.io برای ادمین
 */

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';

type SocketEvent =
  | 'bookings:new'
  | 'chats:reported'
  | 'tickets:new'
  | 'payment:success'
  | 'user:online'
  | 'system:alert';

type EventCallback = (data: unknown) => void;

let socketInstance: Socket | null = null;

export function useAdminSocket() {
  const listenersRef = useRef<Map<string, EventCallback>>(new Map());

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('admin_token');
    if (!token) return;

    if (!socketInstance || !socketInstance.connected) {
      socketInstance = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketInstance.on('connect', () => {
        console.log('[Socket] Connected to admin namespace');
      });

      socketInstance.on('disconnect', () => {
        console.log('[Socket] Disconnected');
      });

      socketInstance.on('connect_error', (err) => {
        console.warn('[Socket] Connection error:', err.message);
      });

      // Default handlers with toast notifications
      socketInstance.on('bookings:new', (data: { code: string; game: string; user: string }) => {
        toast.custom(
          () => (
            <div className="bg-slate-800 border border-red-500/30 rounded-lg p-3 flex items-center gap-3 shadow-lg">
              <span className="text-2xl">📋</span>
              <div>
                <p className="text-white font-bold text-sm">رزرو جدید #{data.code}</p>
                <p className="text-slate-400 text-xs">{data.user} — {data.game}</p>
              </div>
            </div>
          ) as unknown as string,
          { duration: 4000 }
        );
      });

      socketInstance.on('chats:reported', (data: { count: number }) => {
        toast.error(`${data.count} پیام جدید گزارش شد`, { duration: 3000 });
      });

      socketInstance.on('tickets:new', (data: { code: string; subject: string }) => {
        toast.custom(
          () => (
            <div className="bg-slate-800 border border-yellow-500/30 rounded-lg p-3 flex items-center gap-3 shadow-lg">
              <span className="text-2xl">🎫</span>
              <div>
                <p className="text-white font-bold text-sm">تیکت جدید #{data.code}</p>
                <p className="text-slate-400 text-xs">{data.subject}</p>
              </div>
            </div>
          ) as unknown as string,
          { duration: 4000 }
        );
      });

      socketInstance.on('payment:success', (data: { amount: string; user: string }) => {
        toast.success(`پرداخت موفق: ${data.amount} تومان — ${data.user}`, { duration: 3000 });
      });
    }

    return () => {
      // Keep socket alive — don't disconnect on unmount
    };
  }, []);

  const subscribe = useCallback((event: SocketEvent, callback: EventCallback) => {
    if (!socketInstance) return;
    socketInstance.on(event, callback);
    listenersRef.current.set(event, callback);

    return () => {
      if (socketInstance) {
        socketInstance.off(event, callback);
        listenersRef.current.delete(event);
      }
    };
  }, []);

  const emit = useCallback((event: string, data?: unknown) => {
    if (socketInstance?.connected) {
      socketInstance.emit(event, data);
    }
  }, []);

  const getSocket = useCallback(() => socketInstance, []);

  return { subscribe, emit, getSocket };
}

export function useSocketEvent(event: SocketEvent, callback: EventCallback) {
  const { subscribe } = useAdminSocket();

  useEffect(() => {
    const unsubscribe = subscribe(event, callback);
    return unsubscribe;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);
}
