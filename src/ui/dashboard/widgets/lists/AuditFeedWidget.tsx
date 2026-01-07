import type { WidgetProps } from '../../types'
import { Card } from '@/ui/components/Card'

export type AuditEvent = {
  id: string
  actor: string
  action: string
  scope: string
  when: string
}

export type AuditFeedConfig = {
  title?: string
  events: AuditEvent[]
  maxItems?: number
}

export function AuditFeedWidget({ config }: WidgetProps<AuditFeedConfig>) {
  const { title = 'Audit Feed', events = [], maxItems = 5 } = config ?? {}
  const display = events.slice(0, maxItems)

  return (
    <Card className="p-0">
      <div className="p-4 border-b border-border-light">
        <div className="card-title">{title}</div>
      </div>
      <div className="p-4 grid gap-2">
        {display.length === 0 ? (
          <div className="text-sm text-muted text-center py-4">No recent events</div>
        ) : (
          display.map((e) => (
            <div key={e.id} className="flex items-center justify-between text-sm">
              <span className="text-muted">
                <span className="text-text font-medium">{e.actor}</span> {e.action} — {e.scope}
              </span>
              <span className="text-xs text-muted">{e.when}</span>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}

