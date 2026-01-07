import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'

type NotificationType = 'System' | 'Alert' | 'Info' | 'Warning'
type Notification = {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: string
  read: boolean
}

/**
 * Notifications Page - All roles
 */
export function Notifications() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'notifications')

  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 'N-001', type: 'Alert', title: 'Incident INC-2401 opened', message: 'Mobile money confirmations delayed', timestamp: '10m ago', read: false },
    { id: 'N-002', type: 'System', title: 'Scheduled maintenance', message: 'Analytics pipeline maintenance tonight 2:00 AM', timestamp: '1h ago', read: false },
    { id: 'N-003', type: 'Info', title: 'New station added', message: 'ST-0018 Berlin North has been registered', timestamp: '3h ago', read: true },
    { id: 'N-004', type: 'Warning', title: 'Low battery inventory', message: 'Gulu Main Street swap station below threshold', timestamp: '5h ago', read: true },
  ])

  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const filtered = useMemo(() => {
    return notifications.filter((n) => (filter === 'unread' ? !n.read : true))
  }, [notifications, filter])

  const unreadCount = notifications.filter((n) => !n.read).length

  function markRead(id: string) {
    setNotifications((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  function markAllRead() {
    setNotifications((list) => list.map((n) => ({ ...n, read: true })))
  }

  function typeColor(t: NotificationType) {
    switch (t) {
      case 'Alert': return 'bg-danger/20 text-danger'
      case 'Warning': return 'bg-warn/20 text-warn'
      case 'System': return 'bg-accent/20 text-accent'
      case 'Info': return 'bg-muted/20 text-muted'
    }
  }

  return (
    <DashboardLayout pageTitle="Notifications">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <button
            className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'all' ? 'bg-accent text-white' : 'text-muted hover:text-text'}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'unread' ? 'bg-accent text-white' : 'text-muted hover:text-text'}`}
            onClick={() => setFilter('unread')}
          >
            Unread ({unreadCount})
          </button>
        </div>
        {unreadCount > 0 && (
          <button className="btn secondary" onClick={markAllRead}>
            Mark all read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-2">
        {filtered.map((n) => (
          <div
            key={n.id}
            className={`card cursor-pointer ${!n.read ? 'border-l-4 border-l-accent' : ''}`}
            onClick={() => markRead(n.id)}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`pill ${typeColor(n.type)}`}>{n.type}</span>
                  <span className="font-semibold text-text">{n.title}</span>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-accent" />}
                </div>
                <div className="text-sm text-muted mt-1">{n.message}</div>
              </div>
              <span className="text-xs text-muted">{n.timestamp}</span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="card text-center text-muted py-8">
            No notifications
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

