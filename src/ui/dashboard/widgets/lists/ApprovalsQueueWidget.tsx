import type { WidgetProps } from '../../types'
import { Card } from '@/ui/components/Card'
import { useApprovals } from '@/modules/approvals/hooks/useApprovals'
import { useMemo } from 'react'

export type ApprovalsQueueConfig = {
  title?: string
  maxItems?: number
  typeFilter?: 'KYC' | 'TENANT_APPLICATION' | 'ACCESS_REQUEST' | 'DOCUMENT_VERIFICATION'
}

function StatusPill({ status }: { status: string }) {
  const cls =
    status === 'REJECTED' ? 'pill rejected' : status === 'APPROVED' ? 'pill approved' : 'pill pending'
  return <span className={cls}>{status}</span>
}

export function ApprovalsQueueWidget({ config }: WidgetProps<ApprovalsQueueConfig>) {
  const { title = 'Approvals Queue', maxItems = 5, typeFilter } = config ?? {}

  // Fetch approvals from API
  const { data: approvals, isLoading } = useApprovals({
    type: typeFilter,
  })

  const display = useMemo(() => {
    if (!approvals) return []
    return approvals.slice(0, maxItems)
  }, [approvals, maxItems])

  const getTimeAgo = (date: string) => {
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
      <div className="p-4 border-b border-border-light flex items-center justify-between">
        <div className="card-title">{title}</div>
        <span className="text-xs text-muted">{approvals?.length || 0} items</span>
      </div>
      <div className="p-4 grid gap-3">
        {isLoading ? (
          <div className="text-sm text-muted text-center py-4">Loading...</div>
        ) : display.length === 0 ? (
          <div className="text-sm text-muted text-center py-4">No pending approvals</div>
        ) : (
          display.map((a) => (
            <div key={a.id} className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-semibold text-text text-sm">{a.type}</span>
                <span className="text-xs text-muted">{a.applicantName}</span>
              </div>
              <div className="flex items-center gap-2">
                <StatusPill status={a.status} />
                <span className="text-xs text-muted">{getTimeAgo(a.submittedAt)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}

