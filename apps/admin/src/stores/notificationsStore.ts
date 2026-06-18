import { create } from 'zustand'
import type { Notification } from '@/types'

interface NotificationsState {
  notifications: Notification[]
  unreadCount: number
  isOpen: boolean
  
  setNotifications: (n: Notification[]) => void
  addNotification: (n: Notification) => void
  markAsRead: (id: string) => void
  markAllRead: () => void
  setOpen: (v: boolean) => void
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isOpen: false,

  setNotifications: (notifications) => set({
    notifications,
    unreadCount: notifications.filter(n => !n.isRead).length
  }),

  addNotification: (notification) => set((s) => ({
    notifications: [notification, ...s.notifications].slice(0, 50),
    unreadCount: s.unreadCount + (notification.isRead ? 0 : 1)
  })),

  markAsRead: (id) => set((s) => {
    const notifications = s.notifications.map(n => n.id === id ? { ...n, isRead: true } : n)
    return { notifications, unreadCount: notifications.filter(n => !n.isRead).length }
  }),

  markAllRead: () => set((s) => ({
    notifications: s.notifications.map(n => ({ ...n, isRead: true })),
    unreadCount: 0
  })),

  setOpen: (v) => set({ isOpen: v }),
}))
