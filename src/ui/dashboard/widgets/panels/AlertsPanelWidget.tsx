import { useMemo } from 'react'
import type { WidgetProps } from '../../types'
import { Card } from '@/ui/components/Card'
import { MiniBar } from '../charts/MiniBarWidget'
import { useNotifications } from '@/modules/notifications/hooks/useNotifications'

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
  const { data: notifications = [] } = useNotifications()

  const metrics = useMemo(() => {
    if (config?.metrics && config.metrics.length > 0) return config.metrics

    const counts = { critical: 0, high: 0, medium: 0 }
    notifications.forEach((item: any) => {
      const sev = String(item?.metadata?.severity || '').toLowerCase()
      if (sev === 'critical') counts.critical += 1
      else if (sev === 'high') counts.high += 1
      else if (sev === 'medium') counts.medium += 1
      else if (item.kind === 'alert') counts.high += 1
      else if (item.kind === 'warning') counts.medium += 1
    })

    return [
      { label: 'Critical', value: counts.critical, max: Math.max(20, counts.critical), color: '#ef4444' },
      { label: 'High', value: counts.high, max: Math.max(20, counts.high), color: '#f59e0b' },
      { label: 'Medium', value: counts.medium, max: Math.max(20, counts.medium), color: '#f77f00' },
    ]
  }, [config?.metrics, notifications])

  const { title = 'Alerts & Vulnerabilities', subtitle } = config ?? {}

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

