import type { WidgetProps } from '../../types'

export type Trend = 'up' | 'down' | 'flat'

export type KpiGenericConfig = {
  title: string
  value: string
  delta?: string
  trend?: Trend
}

function TrendPill({ trend }: { trend: Trend }) {
  if (trend === 'up') return <span className="pill approved">▲ Up</span>
  if (trend === 'down') return <span className="pill rejected">▼ Down</span>
  return <span className="pill pending">• Flat</span>
}

export function KpiGenericWidget({ config }: WidgetProps<KpiGenericConfig>) {
  const { title = 'KPI', value = '—', delta, trend } = config ?? {}

  return (
    <div className="rounded-lg border border-border-light bg-panel shadow-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.5px] text-muted mb-1.5">{title}</div>
          <div className="text-xl font-semibold tracking-tight text-text">{value}</div>
        </div>
        {(trend || delta) && (
          <div className="text-right flex-shrink-0">
            {trend && <TrendPill trend={trend} />}
            {delta && <div className="text-[10px] text-muted mt-1">{delta}</div>}
          </div>
        )}
      </div>
    </div>
  )
}

/** Simple KPI card without trend (backward compat) */
export function KpiSimpleWidget({ config }: WidgetProps<{ title: string; value: string }>) {
  const { title = 'KPI', value = '—' } = config ?? {}
  return (
    <div className="rounded-lg border border-border-light bg-panel shadow-card p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.5px] text-muted mb-1.5">{title}</p>
      <p className="text-xl font-semibold tracking-tight text-text">{value}</p>
    </div>
  )
}

