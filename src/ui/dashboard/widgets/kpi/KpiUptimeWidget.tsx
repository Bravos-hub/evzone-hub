import type { WidgetProps } from '../../types'
import { KpiGenericWidget, type Trend } from './KpiGenericWidget'
import { useDashboard } from '@/modules/analytics/hooks/useDashboard'

export type KpiUptimeConfig = {
  value?: number
  trend?: Trend
  delta?: string
}

export function KpiUptimeWidget({ config }: WidgetProps<KpiUptimeConfig>) {
  const { data: dashboard } = useDashboard()
  const total = dashboard?.chargers?.total ?? 0
  const online = dashboard?.chargers?.online ?? 0
  const fallbackValue = total > 0 ? (online / total) * 100 : 0
  const value = config?.value ?? fallbackValue
  const trend = config?.trend
  const delta = config?.delta

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

