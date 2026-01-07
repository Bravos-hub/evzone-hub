import type { WidgetProps } from '../../types'
import { Card } from '@/ui/components/Card'

export type IncidentItem = {
  id: string
  title: string
  sev: 'SEV1' | 'SEV2' | 'SEV3'
  owner: string
  eta: string
  sla?: string
}

export type IncidentsListConfig = {
  title?: string
  incidents: IncidentItem[]
  maxItems?: number
}

function SevPill({ sev }: { sev: IncidentItem['sev'] }) {
  const cls =
    sev === 'SEV1' ? 'pill rejected' : sev === 'SEV2' ? 'pill sendback' : 'pill pending'
  return <span className={cls}>{sev}</span>
}

export function IncidentsListWidget({ config }: WidgetProps<IncidentsListConfig>) {
  const { title = 'Incidents', incidents = [], maxItems = 5 } = config ?? {}
  const items = incidents.slice(0, maxItems)

  return (
    <Card className="p-0">
      <div className="p-4 border-b border-border-light flex items-center justify-between">
        <div className="card-title">{title}</div>
        <span className="text-xs text-muted">{incidents.length} items</span>
      </div>
      <div className="p-4 grid gap-3">
        {items.length === 0 ? (
          <div className="text-sm text-muted text-center py-4">No incidents</div>
        ) : (
          items.map((inc) => (
            <div key={inc.id} className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-semibold text-text text-sm">{inc.title}</span>
                <span className="text-xs text-muted">{inc.owner} • ETA {inc.eta}</span>
              </div>
              <div className="flex items-center gap-2">
                <SevPill sev={inc.sev} />
                {inc.sla && <span className="text-xs text-muted">SLA {inc.sla}</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}

