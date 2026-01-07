import type { WidgetProps } from '../../types'
import { KpiGenericWidget, type Trend } from './KpiGenericWidget'

export type KpiUtilizationConfig = {
  value: number
  trend?: Trend
  delta?: string
}

export function KpiUtilizationWidget({ config }: WidgetProps<KpiUtilizationConfig>) {
  const { value = 0, trend, delta } = config ?? {}

  return (
    <KpiGenericWidget
      config={{
        title: 'Utilization',
        value: `${value.toFixed(0)}%`,
        trend,
        delta,
      }}
    />
  )
}

