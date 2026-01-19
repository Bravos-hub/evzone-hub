import type { WidgetProps } from '../../types'
import { KpiGenericWidget, type Trend } from './KpiGenericWidget'
import { useDashboard } from '@/core/api/hooks/useDashboard'

export type KpiSessionsConfig = {
  count: number
  period?: string
  trend?: Trend
  delta?: string
}

function fmtCompact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

export function KpiSessionsWidget({ config }: WidgetProps<KpiSessionsConfig>) {
  const { data: dashboard } = useDashboard()

  const count = config?.count ?? dashboard?.today?.sessions ?? 0
  const period = config?.period ?? 'Today'
  const trend = config?.trend
  const delta = config?.delta

  return (
    <KpiGenericWidget
      config={{
        title: `Sessions (${period})`,
        value: fmtCompact(count),
        trend,
        delta,
      }}
    />
  )
}

