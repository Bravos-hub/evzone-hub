import { useNavigate } from 'react-router-dom'
import { PATHS } from '@/app/router/paths'
import { useDashboard } from '@/modules/analytics/hooks/useDashboard'
import type { WidgetProps } from '../../types'
import { KpiGenericWidget, type Trend } from './KpiGenericWidget'

export type KpiRevenueConfig = {
  amount: number
  currency?: string
  period?: string
  trend?: Trend
  delta?: string
}

function fmtCurrency(n: number, currency = '$') {
  if (n >= 1_000_000_000) return `${currency}${(n / 1_000_000_000).toFixed(2)}B`
  if (n >= 1_000_000) return `${currency}${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `${currency}${(n / 1_000).toFixed(1)}k`
  return `${currency}${n.toFixed(0)}`
}

function periodToQuery(period?: string): 'all' | 'today' | '30d' {
  if (!period) return 'all'
  const normalized = period.trim().toLowerCase()
  if (normalized === 'today') return 'today'
  if (normalized.includes('30') || normalized.includes('month')) return '30d'
  return 'all'
}

export function KpiRevenueWidget({ config }: WidgetProps<KpiRevenueConfig>) {
  const navigate = useNavigate()
  const { data: dashboard } = useDashboard()

  const amount = config?.amount ?? dashboard?.today?.revenue ?? 0
  const currency = config?.currency ?? '$'
  const period = config?.period ?? 'Today'
  const trend = config?.trend
  const delta = config?.delta
  const periodQuery = periodToQuery(period)

  return (
    <KpiGenericWidget
      config={{
        title: `Revenue (${period})`,
        value: fmtCurrency(amount, currency),
        trend,
        delta,
        interactive: true,
        ariaLabel: `Revenue (${period}) - open billing with ${periodQuery} period`,
        onClick: () => navigate(`${PATHS.BILLING}?period=${periodQuery}`),
      }}
    />
  )
}

