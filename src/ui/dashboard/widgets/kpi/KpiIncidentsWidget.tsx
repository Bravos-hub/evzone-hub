import type { WidgetProps } from '../../types'
import { KpiGenericWidget, type Trend } from './KpiGenericWidget'

export type KpiIncidentsConfig = {
  count: number
  period?: string
  trend?: Trend
  delta?: string
}

export function KpiIncidentsWidget({ config }: WidgetProps<KpiIncidentsConfig>) {
  const { count = 0, period = '24h', trend, delta } = config ?? {}

  return (
    <KpiGenericWidget
      config={{
        title: `Incidents (${period})`,
        value: String(count),
        trend,
        delta,
      }}
    />
  )
}

