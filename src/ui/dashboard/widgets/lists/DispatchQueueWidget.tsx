import type { WidgetProps } from '../../types'
import { Card } from '@/ui/components/Card'

export type DispatchItem = {
  id: string
  job: string
  region: string
  tech: string
  eta: string
  priority: 'P1' | 'P2' | 'P3'
}

export type DispatchQueueConfig = {
  title?: string
  items: DispatchItem[]
  maxItems?: number
}

function PriorityPill({ priority }: { priority: DispatchItem['priority'] }) {
  const cls =
    priority === 'P1' ? 'pill rejected' : priority === 'P2' ? 'pill sendback' : 'pill pending'
  return <span className={cls}>{priority}</span>
}

export function DispatchQueueWidget({ config }: WidgetProps<DispatchQueueConfig>) {
  const { title = 'Dispatch Queue', items = [], maxItems = 5 } = config ?? {}
  const display = items.slice(0, maxItems)

  return (
    <Card className="p-0">
      <div className="p-4 border-b border-border-light flex items-center justify-between">
        <div className="card-title">{title}</div>
        <span className="text-xs text-muted">{items.length} items</span>
      </div>
      <div className="p-4 grid gap-3">
        {display.length === 0 ? (
          <div className="text-sm text-muted text-center py-4">No dispatches</div>
        ) : (
          display.map((d) => (
            <div key={d.id} className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-semibold text-text text-sm">{d.job}</span>
                <span className="text-xs text-muted">{d.region} • {d.tech}</span>
              </div>
              <div className="flex items-center gap-2">
                <PriorityPill priority={d.priority} />
                <span className="text-xs text-muted">ETA {d.eta}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}

