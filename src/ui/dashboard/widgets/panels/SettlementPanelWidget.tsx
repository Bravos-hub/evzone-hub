import { useMemo } from 'react'
import type { WidgetProps } from '../../types'
import { Card } from '@/ui/components/Card'
import { useSettlements } from '@/modules/finance/settlements/useSettlements'
import { TextSkeleton } from '@/ui/components/SkeletonCards'

export type PaymentIssue = {
  id: string
  provider: string
  type: string
  amount: number
  status: 'Open' | 'Retrying' | 'Resolved'
}

export type SettlementPanelConfig = {
  title?: string
  subtitle?: string
  issues?: PaymentIssue[]
  exports?: Array<{ label: string; status: string; when: string }>
}

function StatusPill({ status }: { status: PaymentIssue['status'] }) {
  const cls =
    status === 'Open' ? 'pill rejected' : status === 'Retrying' ? 'pill sendback' : 'pill approved'
  return <span className={cls}>{status}</span>
}

function normalizeStatus(value: unknown): PaymentIssue['status'] {
  const raw = String(value || '').toLowerCase()
  if (raw.includes('resolved') || raw.includes('complete') || raw.includes('success')) return 'Resolved'
  if (raw.includes('retry')) return 'Retrying'
  return 'Open'
}

export function SettlementPanelWidget({ config }: WidgetProps<SettlementPanelConfig>) {
  const { data: settlements = [], isLoading } = useSettlements()

  const issues = useMemo(() => {
    if (config?.issues && config.issues.length > 0) return config.issues
    return settlements
      .map((record) => ({
        id: record.id,
        provider: record.region || record.org || 'N/A',
        type: record.type || 'Settlement',
        amount: record.amount ?? 0,
        status: normalizeStatus(record.status),
      }))
      .filter((issue) => issue.status !== 'Resolved')
  }, [config?.issues, settlements])

  const title = config?.title ?? 'Settlement & Payments'
  const subtitle = config?.subtitle
  const exports = config?.exports ?? []

  return (
    <Card className="p-0">
      <div className="p-4 border-b border-border-light">
        <div className="card-title">{title}</div>
        {subtitle && <div className="text-xs text-muted">{subtitle}</div>}
      </div>
      <div className="p-4 grid gap-4">
        <div className="grid gap-2">
          {isLoading && issues.length === 0 && (
            <div className="py-4">
              <TextSkeleton lines={2} centered />
            </div>
          )}
          {!isLoading && issues.length === 0 && (
            <div className="text-sm text-center py-4 text-muted">No settlement issues reported.</div>
          )}
          {issues.map((p) => (
            <div key={p.id} className="panel flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-text">{p.type}</div>
                <div className="text-xs text-muted">{p.provider} - ${p.amount.toLocaleString()}</div>
              </div>
              <StatusPill status={p.status} />
            </div>
          ))}
        </div>
        {exports.length > 0 && (
          <div className="panel">
            <div className="text-sm font-semibold text-text mb-2">Exports & reporting</div>
            <div className="grid gap-1 text-xs text-muted">
              {exports.map((e, i) => (
                <div key={i}>{e.label} - {e.status} - {e.when}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
