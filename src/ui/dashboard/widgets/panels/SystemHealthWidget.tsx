import type { WidgetProps } from '../../types'
import { Card } from '@/ui/components/Card'
import { useSystemHealth } from '@/modules/analytics/hooks/useAnalytics'

export type HealthItem = {
  service: string
  status: 'Operational' | 'Degraded' | 'Outage' | 'PartialOutage'
  p95?: number
  errors?: number
  backlog?: number
}

export type SystemHealthConfig = {
  title?: string
  items: HealthItem[]
}

function StatusPill({ status }: { status: HealthItem['status'] }) {
  const cls =
    status === 'Operational'
      ? 'pill approved'
      : status === 'Degraded'
        ? 'pill sendback'
        : 'pill rejected'
  return <span className={cls}>{status}</span>
}

export function SystemHealthWidget({ config }: WidgetProps<SystemHealthConfig>) {
  const { title = 'System Health' } = config ?? {}

  const { data: healthData, isLoading } = useSystemHealth() as any

  const items = (healthData?.services || []).map((s: any) => ({
    service: s.name,
    status: s.status,
    p95: s.latency,
    errors: s.errors
  }))

  return (
    <Card className="p-0">
      <div className="p-4 border-b border-border-light">
        <div className="card-title">{title}</div>
      </div>
      <div className="p-4 grid gap-3">
        {isLoading ? (
          <div className="text-sm text-center py-4 text-muted">Loading health status...</div>
        ) : (
          items.map((h: any) => (
            <div key={h.service} className="flex items-center justify-between text-sm">
              <div className="flex flex-col">
                <span className="font-semibold text-text">{h.service}</span>
                {(h.p95 !== undefined || h.errors !== undefined || h.backlog !== undefined) && (
                  <span className="text-xs text-muted">
                    {h.p95 !== undefined && `p95 ${h.p95}ms`}
                    {h.errors !== undefined && ` • errors ${h.errors.toFixed(2)}%`}
                    {h.backlog !== undefined && ` • backlog ${h.backlog}`}
                  </span>
                )}
              </div>
              <StatusPill status={h.status} />
            </div>
          ))
        )}
      </div>
    </Card>
  )
}

