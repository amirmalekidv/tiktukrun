'use client'
import { useEffect } from 'react'
import { useNotificationsStore } from '@/stores/notificationsStore'
import { notificationsApi } from '@/lib/api'
import { timeAgo, cn } from '@/lib/utils'
import type { Notification } from '@/types'

const typeStyles = {
  info: 'text-sky-400 bg-sky-400/10',
  success: 'text-emerald-400 bg-emerald-400/10',
  warning: 'text-amber-400 bg-amber-400/10',
  error: 'text-red-400 bg-red-400/10',
}

const typeIcons = {
  info: 'fa-circle-info',
  success: 'fa-circle-check',
  warning: 'fa-triangle-exclamation',
  error: 'fa-circle-xmark',
}

// Map backend NotificationType enum to a UI severity used by this panel.
function mapType(t: string): Notification['type'] {
  const s = String(t || '').toUpperCase()
  if (s.includes('FAIL') || s.includes('CANCEL') || s.includes('REJECT') || s.includes('ERROR') || s.includes('BAN')) return 'error'
  if (s.includes('WARN') || s.includes('EXPIRE') || s.includes('PENDING')) return 'warning'
  if (s.includes('SUCCESS') || s.includes('CONFIRM') || s.includes('APPROV') || s.includes('REWARD') || s.includes('WIN') || s.includes('PAID')) return 'success'
  return 'info'
}

// notifications/me is single-wrapped: { success, data: { items, pagination } }
function readItems(res: any): any[] {
  const body = res?.data
  const inner = body && typeof body === 'object' && 'data' in body ? body.data : body
  if (Array.isArray(inner?.items)) return inner.items
  if (Array.isArray(inner)) return inner
  return []
}

export function NotificationsPanel() {
  const { notifications, setNotifications, markAsRead, markAllRead, setOpen } = useNotificationsStore()

  useEffect(() => {
    notificationsApi
      .getMine({ limit: 30 })
      .then(res => {
        const items = readItems(res).map((n: any): Notification => ({
          id: n.id,
          type: mapType(n.type),
          title: n.title,
          message: n.body ?? n.message ?? '',
          isRead: !!n.isRead,
          createdAt: n.createdAt,
          link: n.link ?? undefined,
        }))
        setNotifications(items)
      })
      .catch(() => setNotifications([]))
  }, [setNotifications])

  const handleMarkAsRead = (id: string) => {
    markAsRead(id)
    notificationsApi.markRead(id).catch(() => {})
  }

  const handleMarkAllRead = () => {
    markAllRead()
    notificationsApi.markAllRead().catch(() => {})
  }

  return (
    <>
      <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
      <div
        className="fixed top-16 left-4 z-40 w-80 max-h-[calc(100vh-5rem)] flex flex-col rounded-xl border border-slate-700/50 overflow-hidden slide-in-right"
        style={{ background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(16px)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/30">
          <h3 className="font-semibold text-slate-200 text-sm">اعلان‌ها</h3>
          <button
            onClick={handleMarkAllRead}
            className="text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            همه خواندم
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              <i className="fas fa-bell-slash text-2xl mb-2 block" />
              اعلانی وجود ندارد
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                onClick={() => handleMarkAsRead(n.id)}
                className={cn(
                  'flex gap-3 px-4 py-3 border-b border-slate-700/20 cursor-pointer hover:bg-slate-800/30 transition-colors',
                  !n.isRead && 'bg-slate-800/20'
                )}
              >
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm', typeStyles[n.type])}>
                  <i className={`fas ${typeIcons[n.type]}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-slate-200 truncate">{n.title}</p>
                    {!n.isRead && <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 mt-1" />}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-xs text-slate-600 mt-1">{timeAgo(n.createdAt)}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-700/30 text-center">
          <button
            onClick={() => setOpen(false)}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            بستن
          </button>
        </div>
      </div>
    </>
  )
}
