import type { WidgetProps } from '../../types'
import { KpiGenericWidget, type Trend } from './KpiGenericWidget'
import { useIncidents } from '@/modules/incidents/hooks/useIncidents'

export type KpiIncidentsConfig = {
  count?: number
  period?: string
  trend?: Trend
  delta?: string
}

export function KpiIncidentsWidget({ config }: WidgetProps<KpiIncidentsConfig>) {
  const { data: incidents = [] } = useIncidents()
  const count = config?.count ?? incidents.length
  const period = config?.period ?? '24h'
  const trend = config?.trend
  const delta = config?.delta

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

