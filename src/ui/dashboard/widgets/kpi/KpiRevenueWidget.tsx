import type { WidgetProps } from '../../types'
import { KpiGenericWidget, type Trend } from './KpiGenericWidget'
import { useDashboard } from '@/modules/analytics/hooks/useDashboard'

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

export function KpiRevenueWidget({ config }: WidgetProps<KpiRevenueConfig>) {
  const { data: dashboard } = useDashboard()

  const amount = config?.amount ?? dashboard?.today?.revenue ?? 0
  const currency = config?.currency ?? '$'
  const period = config?.period ?? 'Today'
  const trend = config?.trend
  const delta = config?.delta

  return (
    <KpiGenericWidget
      config={{
        title: `Revenue (${period})`,
        value: fmtCurrency(amount, currency),
        trend,
        delta,
      }}
    />
  )
}

