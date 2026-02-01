import type { WidgetProps } from '../../types'
import { Card } from '@/ui/components/Card'
import { useAuditLogs } from '@/modules/audit/hooks/useAuditLogs'
import { useMemo } from 'react'

export type AuditFeedConfig = {
  title?: string
  maxItems?: number
  resourceFilter?: string
  actionFilter?: string
}

export function AuditFeedWidget({ config }: WidgetProps<AuditFeedConfig>) {
  const { title = 'Audit Feed', maxItems = 5, resourceFilter, actionFilter } = config ?? {}

  // Fetch audit logs from API
  const { data: auditData, isLoading } = useAuditLogs({
    resource: resourceFilter,
    action: actionFilter,
    limit: maxItems,
    page: 1,
  })

  const display = useMemo(() => {
    if (!auditData?.data) return []
    return auditData.data.slice(0, maxItems)
  }, [auditData, maxItems])

  const getTimeAgo = (date: string | Date) => {
    const now = new Date()
    const then = new Date(date)
    const diffMs = now.getTime() - then.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) return `${diffDays}d ago`
    if (diffHours > 0) return `${diffHours}h ago`
    if (diffMins > 0) return `${diffMins}m ago`
    return 'Just now'
  }

  return (
    <Card className="p-0">
      <div className="p-4 border-b border-border-light">
        <div className="card-title">{title}</div>
      </div>
      <div className="p-4 grid gap-2">
        {isLoading ? (
          <div className="text-sm text-muted text-center py-4">Loading...</div>
        ) : display.length === 0 ? (
          <div className="text-sm text-muted text-center py-4">No recent events</div>
        ) : (
          display.map((e) => (
            <div key={e.id} className="flex items-center justify-between text-sm">
              <span className="text-muted">
                <span className="text-text font-medium">{e.actorName || e.actor}</span> {e.action} — {e.resource}
              </span>
              <span className="text-xs text-muted">{getTimeAgo(e.timestamp)}</span>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}

