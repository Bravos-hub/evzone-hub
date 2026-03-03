import { useNavigate } from 'react-router-dom'
import { PATHS } from '@/app/router/paths'
import { useDashboard } from '@/modules/analytics/hooks/useDashboard'
import type { WidgetProps } from '../../types'
import { KpiGenericWidget, type Trend } from './KpiGenericWidget'

export type KpiStationsConfig = {
  total?: number
  online?: number
  offline?: number
  trend?: Trend
  delta?: string
  variant?: 'total' | 'online' | 'offline'
}

function variantToStatusQuery(variant: KpiStationsConfig['variant']): 'all' | 'online' | 'offline' {
  switch (variant) {
    case 'online':
      return 'online'
    case 'offline':
      return 'offline'
    default:
      return 'all'
  }
}

export function KpiStationsWidget({ config }: WidgetProps<KpiStationsConfig>) {
  const navigate = useNavigate()
  const { data: dashboard } = useDashboard()

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

  const status = variantToStatusQuery(variant)

  return (
    <KpiGenericWidget
      config={{
        title,
        value,
        trend,
        delta,
        interactive: true,
        ariaLabel: `${title} - open stations with ${status} filter`,
        onClick: () => navigate(`${PATHS.STATIONS.ROOT}?status=${status}`),
      }}
    />
  )
}
