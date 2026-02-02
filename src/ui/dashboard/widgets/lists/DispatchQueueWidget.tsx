import type { WidgetProps } from '../../types'
import { Card } from '@/ui/components/Card'
import { useDispatches } from '@/modules/dispatch/hooks/useDispatches'
import { useMemo } from 'react'
import { TextSkeleton } from '@/ui/components/SkeletonCards'

export type DispatchQueueConfig = {
  title?: string
  maxItems?: number
  priorityFilter?: string
  statusFilter?: string
}

function PriorityPill({ priority }: { priority: string }) {
  const cls =
    priority === 'P1' || priority === 'HIGH' ? 'pill rejected' :
      priority === 'P2' || priority === 'MEDIUM' ? 'pill sendback' :
        'pill pending'
  return <span className={cls}>{priority}</span>
}

export function DispatchQueueWidget({ config }: WidgetProps<DispatchQueueConfig>) {
  const { title = 'Dispatch Queue', maxItems = 5, priorityFilter, statusFilter } = config ?? {}

  // Fetch dispatches from API
  const { data: dispatches, isLoading } = useDispatches({
    priority: priorityFilter,
    status: statusFilter || 'PENDING',
  })

  const display = useMemo(() => {
    if (!dispatches) return []
    return dispatches.slice(0, maxItems)
  }, [dispatches, maxItems])

  const getTimeAgo = (date: string | Date) => {
    const now = new Date()
    const then = new Date(date)
    const diffMs = now.getTime() - then.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)

    if (diffHours > 0) return `${diffHours}h`
    if (diffMins > 0) return `${diffMins}m`
    return 'Just now'
  }

  return (
    <Card className="p-0">
      <div className="p-4 border-b border-border-light flex items-center justify-between">
        <div className="card-title">{title}</div>
        <span className="text-xs text-muted">{dispatches?.length || 0} items</span>
      </div>
      <div className="p-4 grid gap-3">
        {isLoading ? (
          <div className="py-4">
            <TextSkeleton lines={2} centered />
          </div>
        ) : display.length === 0 ? (
          <div className="text-sm text-muted text-center py-4">No dispatches</div>
        ) : (
          display.map((d: any) => (
            <div key={d.id} className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-semibold text-text text-sm">{d.job || d.title || d.description}</span>
                <span className="text-xs text-muted">{d.region || d.location} • {d.tech || d.assignedTo || 'Unassigned'}</span>
              </div>
              <div className="flex items-center gap-2">
                <PriorityPill priority={d.priority || 'P3'} />
                <span className="text-xs text-muted">ETA {d.eta || getTimeAgo(d.scheduledAt || d.createdAt)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}

