import type { WidgetProps } from '../../types'
import { Card } from '@/ui/components/Card'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

export type DonutGaugeConfig = {
  title?: string
  subtitle?: string
  value: number
  label?: string
  color?: string
  target?: number
  secondaryLabel?: string
  secondaryValue?: string
}

export function DonutGaugeWidget({ config }: WidgetProps<DonutGaugeConfig>) {
  const {
    title,
    subtitle,
    value = 0,
    label = 'Value',
    color = 'rgba(3,205,140,.95)',
    target,
    secondaryLabel,
    secondaryValue,
  } = config ?? {}

  const pct = Math.max(0, Math.min(100, value))
  const data = [
    { name: 'Value', value: pct },
    { name: 'Remaining', value: 100 - pct },
  ]

  return (
    <Card>
      {title && (
        <div className="mb-4">
          <div className="card-title">{title}</div>
          {subtitle && <div className="text-xs text-muted mt-1">{subtitle}</div>}
        </div>
      )}
      <div className="flex items-center justify-center gap-6 flex-wrap">
        <div className="relative h-[160px] w-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={76}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
                stroke="none"
              >
                <Cell fill={color} />
                <Cell fill="rgba(255,255,255,0.06)" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Centered Text Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-extrabold text-text">
              {pct.toFixed(1)}%
            </span>
            <span className="text-xs font-semibold text-muted mt-1 uppercase tracking-wide">
              {label}
            </span>
          </div>
        </div>

        <div className="grid gap-3">
          {target !== undefined && (
            <div className="rounded-xl border border-border-light bg-panel-2/50 px-4 py-3 min-w-[100px]">
              <div className="text-xs text-muted mb-1 font-medium">Target</div>
              <div className="text-lg font-extrabold text-text">{target}%</div>
            </div>
          )}
          {secondaryLabel && secondaryValue && (
            <div className="rounded-xl border border-border-light bg-panel-2/50 px-4 py-3 min-w-[100px]">
              <div className="text-xs text-muted mb-1 font-medium">{secondaryLabel}</div>
              <div className="text-lg font-extrabold text-text">{secondaryValue}</div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
