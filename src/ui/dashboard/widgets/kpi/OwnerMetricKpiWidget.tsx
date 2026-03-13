import { useNavigate } from 'react-router-dom'
import { PATHS } from '@/app/router/paths'
import { useOwnerDashboardData } from '@/modules/analytics/hooks/useOwnerDashboardData'
import type { WidgetProps } from '../../types'
import { KpiGenericWidget, type Trend } from './KpiGenericWidget'

type OwnerMetricKey =
  | 'revenue'
  | 'energySoldKwh'
  | 'sessions'
  | 'utilizationPct'
  | 'uptimePct'
  | 'activeStations'
  | 'avgSessionDurationMinutes'
  | 'margin'

export type OwnerMetricKpiConfig = {
  metric: OwnerMetricKey
  title: string
  format?: 'currency' | 'number' | 'percent' | 'duration' | 'energy'
  path?: string
}

function formatValue(value: number | null, format?: OwnerMetricKpiConfig['format']) {
  if (value == null) return 'N/A'
  if (format === 'currency') return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
  if (format === 'percent') return `${value.toFixed(1)}%`
  if (format === 'duration') return `${value.toFixed(1)} min`
  if (format === 'energy') return `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })} kWh`
  return value.toLocaleString(undefined, { maximumFractionDigits: 1 })
}

function toTrend(deltaPct: number | null): Trend | undefined {
  if (deltaPct == null) return undefined
  if (deltaPct > 0.05) return 'up'
  if (deltaPct < -0.05) return 'down'
  return 'flat'
}

export function OwnerMetricKpiWidget({ config }: WidgetProps<OwnerMetricKpiConfig>) {
  const navigate = useNavigate()
  const { data } = useOwnerDashboardData()
  if (!config?.metric || !data) return null

  const metric = data.kpis[config.metric]
  const delta = metric.deltaPct == null ? 'No baseline' : `${metric.deltaPct > 0 ? '+' : ''}${metric.deltaPct.toFixed(1)}% vs prev`

  return (
    <KpiGenericWidget
      config={{
        title: config.title,
        value: formatValue(metric.value, config.format),
        delta,
        trend: toTrend(metric.deltaPct),
        interactive: Boolean(config.path),
        ariaLabel: config.title,
        onClick: config.path ? () => navigate(config.path as string) : undefined,
      }}
    />
  )
}
