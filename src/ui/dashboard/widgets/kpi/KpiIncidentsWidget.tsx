import { useNavigate } from 'react-router-dom'
import { PATHS } from '@/app/router/paths'
import { useDashboard } from '@/modules/analytics/hooks/useDashboard'
import { useIncidents } from '@/modules/incidents/hooks/useIncidents'
import type { WidgetProps } from '../../types'
import { KpiGenericWidget, type Trend } from './KpiGenericWidget'

export type KpiIncidentsConfig = {
  count?: number
  period?: string
  trend?: Trend
  delta?: string
}

function periodToPreset(period?: string): 'all' | 'open' | '24h' {
  if (!period) return 'all'
  const normalized = period.trim().toLowerCase()
  if (normalized === '24h') return '24h'
  if (normalized === 'open') return 'open'
  return 'all'
}

export function KpiIncidentsWidget({ config }: WidgetProps<KpiIncidentsConfig>) {
  const navigate = useNavigate()
  const { data: dashboard } = useDashboard()
  const { data: incidents = [] } = useIncidents()

  const count = config?.count ?? dashboard?.today?.incidents ?? incidents.length
  const period = config?.period ?? '24h'
  const trend = config?.trend
  const delta = config?.delta
  const preset = periodToPreset(period)

  return (
    <KpiGenericWidget
      config={{
        title: `Incidents (${period})`,
        value: String(count),
        trend,
        delta,
        interactive: true,
        ariaLabel: `Incidents (${period}) - open incidents with ${preset} preset`,
        onClick: () => navigate(`${PATHS.INCIDENTS}?preset=${preset}`),
      }}
    />
  )
}
