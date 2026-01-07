import type { WidgetProps } from '../../types'
import { Card } from '@/ui/components/Card'
import { MiniBar } from '../charts/MiniBarWidget'

export type AlertMetric = {
  label: string
  value: number
  max: number
  color: string
}

export type AlertsPanelConfig = {
  title?: string
  subtitle?: string
  metrics: AlertMetric[]
}

export function AlertsPanelWidget({ config }: WidgetProps<AlertsPanelConfig>) {
  const { title = 'Alerts & Vulnerabilities', subtitle, metrics = [] } = config ?? {}

  return (
    <Card className="p-0">
      <div className="p-4 border-b border-border-light">
        <div className="card-title">{title}</div>
        {subtitle && <div className="text-xs text-muted">{subtitle}</div>}
      </div>
      <div className="p-4 grid gap-3">
        {metrics.map((m, i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <div className="flex flex-col min-w-[80px]">
              <span className="text-xs text-muted">{m.label}</span>
              <span className="text-sm font-semibold text-text">{m.value}</span>
            </div>
            <div className="flex-1">
              <MiniBar value={(m.value / m.max) * 100} color={m.color} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

