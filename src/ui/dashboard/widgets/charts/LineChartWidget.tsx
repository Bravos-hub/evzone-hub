import type { WidgetProps } from '../../types'
import { Card } from '@/ui/components/Card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts'

export type LineChartConfig = {
  title?: string
  subtitle?: string
  values: number[]
  stroke?: string
  labels?: string[]
}

export function LineChartWidget({ config }: WidgetProps<LineChartConfig>) {
  const { title, subtitle, values = [], stroke = '#03cd8c', labels } = config ?? {}

  // Transform data for Recharts
  const data = values.map((value, index) => ({
    name: labels?.[index] || `Point ${index + 1}`,
    value: value,
  }))

  return (
    <Card>
      {title && (
        <div className="mb-4">
          <div className="card-title">{title}</div>
          {subtitle && <div className="text-xs text-muted mt-1">{subtitle}</div>}
        </div>
      )}
      <div className="px-2" style={{ height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{
              top: 25,
              right: 20,
              left: 0,
              bottom: 35,
            }}
          >
            <defs>
              <linearGradient id={`colorValue-${stroke.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={stroke} stopOpacity={0.4} />
                <stop offset="50%" stopColor={stroke} stopOpacity={0.15} />
                <stop offset="95%" stopColor={stroke} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,.04)"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tick={{ fill: 'rgba(255,255,255,.5)', fontSize: 10, fontWeight: 600 }}
              stroke="rgba(255,255,255,.08)"
              style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}
            />
            <YAxis
              tick={{ fill: 'rgba(255,255,255,.5)', fontSize: 11, fontWeight: 600 }}
              stroke="rgba(255,255,255,.08)"
              tickFormatter={(value) => {
                if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`
                return `$${value.toFixed(0)}`
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0,0,0,0.8)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value: number | undefined) => {
                if (value === undefined) return ['N/A', 'Value'] as [string, string]
                if (value >= 1000) return [`$${(value / 1000).toFixed(1)}k`, 'Value'] as [string, string]
                return [`$${value.toFixed(0)}`, 'Value'] as [string, string]
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={stroke}
              strokeWidth={3}
              fill={`url(#colorValue-${stroke.replace('#', '')})`}
              activeDot={{ r: 6, fill: stroke, stroke: '#fff', strokeWidth: 2 }}
              dot={{ r: 4, fill: stroke, stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
