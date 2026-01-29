import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useNotifications } from '@/modules/notifications/hooks/useNotifications'
import { getErrorMessage } from '@/core/api/errors'
import { PATHS } from '@/app/router/paths'
import type { NotificationItem, NotificationKind, NoticeChannel } from '@/core/api/types'
import { ListCardSkeleton } from '@/ui/components/SkeletonCards'

type NotificationView = NotificationItem & {
  timestamp: string
  createdAtMs: number
}

const channelLabel: Record<NoticeChannel, string> = {
  'in-app': 'In-App',
  email: 'Email',
  sms: 'SMS',
}

const kindLabel: Record<NotificationKind, string> = {
  alert: 'Alert',
  system: 'System',
  info: 'Info',
  warning: 'Warning',
  notice: 'Notice',
  message: 'Message',
  payment: 'Payment',
  application: 'Application',
}

const toTimeAgo = (value: string | number | Date) => {
  const time = typeof value === 'number' ? value : new Date(value).getTime()
  if (!Number.isFinite(time)) return 'Just now'
  const diffMs = Math.max(0, Date.now() - time)
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

/**
 * Notifications Page - All roles
 */
export function Notifications() {
  const navigate = useNavigate()
  const { data: notifications = [], isLoading, error } = useNotifications()

  const [readState, setReadState] = useState<Record<string, boolean>>({})

  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const allNotifications = useMemo<NotificationView[]>(() => {
    return notifications
      .map((n) => {
        const createdAtMs = new Date(n.createdAt).getTime()
        return {
          ...n,
          read: readState[n.id] ?? n.read,
          createdAtMs: Number.isFinite(createdAtMs) ? createdAtMs : Date.now(),
          timestamp: toTimeAgo(n.createdAt),
        }
      })
      .sort((a, b) => b.createdAtMs - a.createdAtMs)
  }, [notifications, readState])

  const filtered = useMemo(() => {
    return allNotifications.filter((n) => (filter === 'unread' ? !n.read : true))
  }, [allNotifications, filter])

  const unreadCount = allNotifications.filter((n) => !n.read).length

  function markRead(id: string) {
    setReadState((prev) => ({ ...prev, [id]: true }))
  }

  function resolveTargetPath(item: NotificationItem) {
    if (item.targetPath) return item.targetPath
    switch (item.kind) {
      case 'alert':
        return PATHS.INCIDENTS
      case 'warning':
        return PATHS.OWNER.ALERTS
      case 'application':
        return `${PATHS.SITE_OWNER.TENANTS}?tab=applications`
      case 'payment':
        return PATHS.SITE_OWNER.TENANTS
      case 'notice':
      case 'message':
        return PATHS.SITE_OWNER.TENANTS
      default:
        return PATHS.NOTIFICATIONS
    }
  }

  function handleOpen(item: NotificationItem) {
    markRead(item.id)
    const target = resolveTargetPath(item)
    if (target && target !== PATHS.NOTIFICATIONS) {
      navigate(target)
    }
  }

  function markAllRead() {
    setReadState((prev) => {
      const next = { ...prev }
      allNotifications.forEach((n) => {
        next[n.id] = true
      })
      return next
    })
  }

  function typeColor(t: NotificationKind) {
    switch (t) {
      case 'alert': return 'bg-danger/20 text-danger'
      case 'warning': return 'bg-warn/20 text-warn'
      case 'system': return 'bg-accent/20 text-accent'
      case 'info': return 'bg-muted/20 text-muted'
      case 'notice': return 'bg-ok/10 text-ok'
      case 'message': return 'bg-accent/10 text-accent'
      case 'payment': return 'bg-ok/10 text-ok'
      case 'application': return 'bg-warning/10 text-warning'
    }
  }

  return (
    <DashboardLayout pageTitle="Notifications">
      {error && (
        <div className="card mb-4 bg-red-50 border border-red-200 text-red-700 text-sm">
          {getErrorMessage(error)}
        </div>
      )}

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
        {isLoading ? (
          <ListCardSkeleton items={4} />
        ) : (
          <>
            {filtered.map((n) => (
              <div
                key={n.id}
                className={`card cursor-pointer ${!n.read ? 'border-l-4 border-l-accent' : ''}`}
                onClick={() => handleOpen(n)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`pill ${typeColor(n.kind)}`}>{kindLabel[n.kind]}</span>
                      <span className="font-semibold text-text">{n.title}</span>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-accent" />}
                    </div>
                    <div className="text-sm text-muted mt-1">{n.message}</div>
                    {(n.channels || n.status || n.source) && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {n.source && (
                          <span className="pill bg-muted/20 text-muted text-[11px] uppercase tracking-wide">{n.source}</span>
                        )}
                        {n.status && (
                          <span className="pill bg-muted/20 text-muted text-[11px] uppercase tracking-wide">{n.status}</span>
                        )}
                        {n.channels?.map((channel) => (
                          <span key={channel} className="pill bg-muted/20 text-muted text-[11px] uppercase tracking-wide">
                            {channelLabel[channel]}
                          </span>
                        ))}
                      </div>
                    )}
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
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

