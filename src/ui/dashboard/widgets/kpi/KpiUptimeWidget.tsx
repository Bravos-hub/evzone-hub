import { useNavigate } from 'react-router-dom'
import { PATHS } from '@/app/router/paths'
import { useDashboard } from '@/modules/analytics/hooks/useDashboard'
import type { WidgetProps } from '../../types'
import { KpiGenericWidget, type Trend } from './KpiGenericWidget'

export type KpiUptimeConfig = {
  value?: number
  trend?: Trend
  delta?: string
}

export function KpiUptimeWidget({ config }: WidgetProps<KpiUptimeConfig>) {
  const navigate = useNavigate()
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
        interactive: true,
        ariaLabel: 'SLA / Uptime - open online stations',
        onClick: () => navigate(`${PATHS.STATIONS.ROOT}?status=online`),
      }}
    />
  )
}

