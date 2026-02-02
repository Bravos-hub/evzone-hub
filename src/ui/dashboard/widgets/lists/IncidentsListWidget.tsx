import type { WidgetProps } from '../../types'
import { Card } from '@/ui/components/Card'
import { useIncidents } from '@/modules/incidents/hooks/useIncidents'
import { useMemo } from 'react'
import { TextSkeleton } from '@/ui/components/SkeletonCards'

export type IncidentsListConfig = {
  title?: string
  maxItems?: number
  severityFilter?: string
  statusFilter?: string
}

function SevPill({ sev }: { sev: string }) {
  const cls =
    sev === 'CRITICAL' || sev === 'SEV1' ? 'pill rejected' :
      sev === 'HIGH' || sev === 'SEV2' ? 'pill sendback' :
        'pill pending'
  return <span className={cls}>{sev}</span>
}

export function IncidentsListWidget({ config }: WidgetProps<IncidentsListConfig>) {
  const { title = 'Incidents', maxItems = 5, severityFilter, statusFilter } = config ?? {}

  // Fetch incidents from API
  const { data: incidents, isLoading } = useIncidents({
    severity: severityFilter,
    status: statusFilter || 'OPEN',
  })

  const items = useMemo(() => {
    if (!incidents) return []
    return incidents.slice(0, maxItems)
  }, [incidents, maxItems])

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
        <span className="text-xs text-muted">{incidents?.length || 0} items</span>
      </div>
      <div className="p-4 grid gap-3">
        {isLoading ? (
          <div className="py-4">
            <TextSkeleton lines={2} centered />
          </div>
        ) : items.length === 0 ? (
          <div className="text-sm text-muted text-center py-4">No incidents</div>
        ) : (
          items.map((inc: any) => (
            <div key={inc.id} className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-semibold text-text text-sm">{inc.title || inc.description}</span>
                <span className="text-xs text-muted">
                  {inc.assignedTo || 'Unassigned'} • ETA {inc.estimatedResolution ? getTimeAgo(inc.estimatedResolution) : 'TBD'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <SevPill sev={inc.severity || 'LOW'} />
                {inc.sla && <span className="text-xs text-muted">SLA {inc.sla}</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}

