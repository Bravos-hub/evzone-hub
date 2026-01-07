import type { WidgetProps } from '../../types'
import { KpiGenericWidget, type Trend } from './KpiGenericWidget'

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
  const { count = 0, period = 'Today', trend, delta } = config ?? {}

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

