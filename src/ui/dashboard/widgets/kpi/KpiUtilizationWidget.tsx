import type { WidgetProps } from '../../types'
import { KpiGenericWidget, type Trend } from './KpiGenericWidget'
import { useDashboard } from '@/core/api/hooks/useDashboard'

export type KpiUtilizationConfig = {
  value: number
  trend?: Trend
  delta?: string
}

export function KpiUtilizationWidget({ config }: WidgetProps<KpiUtilizationConfig>) {
  const { data: dashboard } = useDashboard()

  // Calculate utilization: active sessions / total chargers * 100
  const calculatedValue = (dashboard?.chargers?.total ?? 0) > 0
    ? Math.round(((dashboard?.realTime?.activeSessions ?? 0) / (dashboard?.chargers?.total ?? 1)) * 100)
    : 0

  const value = config?.value ?? calculatedValue
  const trend = config?.trend
  const delta = config?.delta

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

