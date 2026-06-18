import { io, type Socket } from 'socket.io-client'
import { getAccessToken } from './auth'

// =============================================
// TIK TAK RUN Admin — Socket.io Client
// =============================================

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000'

let socket: Socket | null = null

export function getAdminSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      path: '/socket.io',
      auth: {
        token: getAccessToken(),
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: false,
    })

    socket.on('connect', () => {
      console.log('[Admin Socket] Connected:', socket?.id)
      socket?.emit('joinAdminRoom')
    })

    socket.on('disconnect', (reason) => {
      console.log('[Admin Socket] Disconnected:', reason)
    })

    socket.on('connect_error', (error) => {
      console.warn('[Admin Socket] Connection error:', error.message)
    })
  }

  return socket
}

export function connectAdminSocket(): Socket {
  const s = getAdminSocket()
  if (!s.connected) {
    s.connect()
  }
  return s
}

export function disconnectAdminSocket(): void {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export type AdminSocketEvent =
  | 'activity'
  | 'new_booking'
  | 'new_payment'
  | 'new_review'
  | 'customer_level_up'
  | 'campaign_sent'
  | 'deal_moved'
  | 'support_ticket'
  | 'admin_notification'
