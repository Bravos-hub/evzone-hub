import type { WidgetProps } from '../../types'
import { KpiGenericWidget, type Trend } from './KpiGenericWidget'

export type KpiUptimeConfig = {
  value: number
  trend?: Trend
  delta?: string
}

export function KpiUptimeWidget({ config }: WidgetProps<KpiUptimeConfig>) {
  const { value = 0, trend, delta } = config ?? {}

  return (
    <KpiGenericWidget
      config={{
        title: 'SLA / Uptime',
        value: `${value.toFixed(1)}%`,
        trend,
        delta,
      }}
    />
  )
}

