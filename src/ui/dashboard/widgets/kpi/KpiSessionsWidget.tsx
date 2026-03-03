import { useNavigate } from 'react-router-dom'
import { PATHS } from '@/app/router/paths'
import { useDashboard } from '@/modules/analytics/hooks/useDashboard'
import type { WidgetProps } from '../../types'
import { KpiGenericWidget, type Trend } from './KpiGenericWidget'

export type KpiSessionsConfig = {
  count: number
  period?: string
  trend?: Trend
  delta?: string
}

function fmtCompact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

function periodToPreset(period?: string): 'all' | 'today' | 'active' {
  if (!period) return 'all'
  const normalized = period.trim().toLowerCase()
  if (normalized === 'today') return 'today'
  if (normalized === 'active') return 'active'
  return 'all'
}

export function KpiSessionsWidget({ config }: WidgetProps<KpiSessionsConfig>) {
  const navigate = useNavigate()
  const { data: dashboard } = useDashboard()

  const count = config?.count ?? dashboard?.today?.sessions ?? 0
  const period = config?.period ?? 'Today'
  const trend = config?.trend
  const delta = config?.delta
  const preset = periodToPreset(period)

  return (
    <KpiGenericWidget
      config={{
        title: `Sessions (${period})`,
        value: fmtCompact(count),
        trend,
        delta,
        interactive: true,
        ariaLabel: `Sessions (${period}) - open sessions with ${preset} preset`,
        onClick: () => navigate(`${PATHS.SESSIONS}?preset=${preset}`),
      }}
    />
  )
}

