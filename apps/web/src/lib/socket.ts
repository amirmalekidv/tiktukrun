'use client';
import { io, Socket } from 'socket.io-client';
import { AUTH_TOKEN_KEY, getWsRoot, refreshAccessToken } from './http';

let socket: Socket | null = null;
let refreshPromise: Promise<string | null> | null = null;

async function refreshSocketToken() {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export function getSocket(): Socket {
  if (typeof window === 'undefined') {
    throw new Error('Socket is not available on the server');
  }

  const token = localStorage.getItem(AUTH_TOKEN_KEY);

  if (!socket) {
    const wsRoot = getWsRoot();

    socket = io(`${wsRoot}/chat`, {
      path: '/socket.io',
      auth: { token: token ?? undefined },
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
      void refreshSocketToken().then((refreshedToken) => {
        const newToken = refreshedToken || localStorage.getItem(AUTH_TOKEN_KEY);
        if (socket && newToken) {
          socket.auth = { token: newToken };
          socket.connect();
        }
      });
    });
  } else {
    socket.auth = { token: token ?? undefined };
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
  teamId?: string,
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
    s.emit('report', { messageId, reason });
  } catch {
    // SSR or socket unavailable
  }
}
