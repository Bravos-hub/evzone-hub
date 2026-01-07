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

export function KpiStationsWidget({ config }: WidgetProps<KpiStationsConfig>) {
  const { total = 0, online = 0, offline = 0, trend, delta, variant = 'total' } = config ?? {}

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

