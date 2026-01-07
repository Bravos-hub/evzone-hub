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

export function KpiRevenueWidget({ config }: WidgetProps<KpiRevenueConfig>) {
  const { amount = 0, currency = '$', period = 'Today', trend, delta } = config ?? {}

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

