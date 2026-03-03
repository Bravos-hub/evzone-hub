import type { WidgetProps } from '../../types'

export type Trend = 'up' | 'down' | 'flat'

export type KpiGenericConfig = {
  title: string
  value: string
  delta?: string
  trend?: Trend
  onClick?: () => void
  ariaLabel?: string
  interactive?: boolean
}

function TrendPill({ trend }: { trend: Trend }) {
  if (trend === 'up') return <span className="pill approved">▲ Up</span>
  if (trend === 'down') return <span className="pill rejected">▼ Down</span>
  return <span className="pill pending">• Flat</span>
}

export function KpiGenericWidget({ config }: WidgetProps<KpiGenericConfig>) {
  const { title = 'KPI', value = '—', delta, trend, onClick, ariaLabel, interactive } = config ?? {}

  const body = (
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
  )

  if (interactive && onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel ?? title}
        className="w-full rounded-lg border border-border-light bg-panel shadow-card p-4 text-left cursor-pointer transition-colors hover:border-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
      >
        {body}
      </button>
    )
  }

  return <div className="rounded-lg border border-border-light bg-panel shadow-card p-4">{body}</div>
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
