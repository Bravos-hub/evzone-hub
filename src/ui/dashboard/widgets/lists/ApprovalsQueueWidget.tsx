import type { WidgetProps } from '../../types'
import { Card } from '@/ui/components/Card'

export type ApprovalItem = {
  id: string
  type: string
  owner: string
  age: string
  status: 'Pending' | 'Review' | 'Blocked'
}

export type ApprovalsQueueConfig = {
  title?: string
  items: ApprovalItem[]
  maxItems?: number
}

function StatusPill({ status }: { status: ApprovalItem['status'] }) {
  const cls =
    status === 'Blocked' ? 'pill rejected' : status === 'Review' ? 'pill sendback' : 'pill pending'
  return <span className={cls}>{status}</span>
}

export function ApprovalsQueueWidget({ config }: WidgetProps<ApprovalsQueueConfig>) {
  const { title = 'Approvals Queue', items = [], maxItems = 5 } = config ?? {}
  const display = items.slice(0, maxItems)

  return (
    <Card className="p-0">
      <div className="p-4 border-b border-border-light flex items-center justify-between">
        <div className="card-title">{title}</div>
        <span className="text-xs text-muted">{items.length} items</span>
      </div>
      <div className="p-4 grid gap-3">
        {display.length === 0 ? (
          <div className="text-sm text-muted text-center py-4">No pending approvals</div>
        ) : (
          display.map((a) => (
            <div key={a.id} className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-semibold text-text text-sm">{a.type}</span>
                <span className="text-xs text-muted">{a.owner}</span>
              </div>
              <div className="flex items-center gap-2">
                <StatusPill status={a.status} />
                <span className="text-xs text-muted">{a.age}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}

