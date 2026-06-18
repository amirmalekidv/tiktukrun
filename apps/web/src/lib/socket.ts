'use client';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (typeof window === 'undefined') {
    throw new Error('Socket is not available on the server');
  }

  if (!socket) {
    const token = localStorage.getItem('auth_token');
    const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

    // Namespace must be appended to the base URL, not passed as option
    socket = io(`${BASE}/chat`, {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      timeout: 10000,
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
      // Refresh token and retry
      const newToken = localStorage.getItem('auth_token');
      if (socket && newToken) {
        socket.auth = { token: newToken };
        socket.connect();
      }
    });
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function joinRoom(roomType: 'global' | 'team', teamId?: string) {
  try {
    const s = getSocket();
    s.emit('joinRoom', { roomType, teamId });
  } catch {
    // SSR or socket unavailable
  }
}

export function leaveRoom(roomType: 'global' | 'team', teamId?: string) {
  try {
    const s = getSocket();
    s.emit('leaveRoom', { roomType, teamId });
  } catch {
    // SSR or socket unavailable
  }
}

export function sendMessage(
  text: string,
  roomType: 'global' | 'team',
  teamId?: string
) {
  try {
    const s = getSocket();
    s.emit('message', { text, roomType, teamId });
  } catch {
    // SSR or socket unavailable
  }
}

export function emitTyping(roomType: 'global' | 'team', teamId?: string) {
  try {
    const s = getSocket();
    s.emit('typing', { roomType, teamId });
  } catch {
    // SSR or socket unavailable
  }
}

export function reportMessage(messageId: string, reason: string) {
  try {
    const s = getSocket();
    s.emit('reportMessage', { messageId, reason });
  } catch {
    // SSR or socket unavailable
  }
}
