import type { WidgetProps } from '../../types'
import { KpiGenericWidget, type Trend } from './KpiGenericWidget'
import { useDashboard } from '@/modules/analytics/hooks/useDashboard'

export type KpiStationsConfig = {
  total?: number
  online?: number
  offline?: number
  trend?: Trend
  delta?: string
  variant?: 'total' | 'online' | 'offline'
}

export function KpiStationsWidget({ config }: WidgetProps<KpiStationsConfig>) {
  const { data: dashboard } = useDashboard()

  // Use dashboard data if available and config values are not provided
  const total = config?.total ?? dashboard?.chargers?.total ?? 0
  const online = config?.online ?? dashboard?.chargers?.online ?? 0
  const offline = config?.offline ?? dashboard?.chargers?.offline ?? 0
  const trend = config?.trend
  const delta = config?.delta
  const variant = config?.variant ?? 'total'

  let title: string
  let value: string

  switch (variant) {
    case 'online':
      title = 'Stations Online'
      value = online > 0 && total > 0 ? `${online} / ${total}` : String(online)
      break
    case 'offline':
      title = 'Stations Offline'
      value = String(offline)
      break
    default:
      title = 'Total Stations'
      value = total.toLocaleString()
  }

  return <KpiGenericWidget config={{ title, value, trend, delta }} />
}


