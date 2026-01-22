import type { WidgetProps } from '../../types'
import { Card } from '@/ui/components/Card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export type BarChartConfig = {
  title?: string
  subtitle?: string
  values: number[]
  color?: string
  labels?: string[]
}

export function BarChartWidget({ config }: WidgetProps<BarChartConfig>) {
  const { title, subtitle, values = [], color = '#f77f00', labels } = config ?? {}

  // Transform data for Recharts
  const data = values.map((value, index) => ({
    name: labels?.[index] || `${index + 1}`,
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
          <BarChart
            data={data}
            margin={{
              top: 25,
              right: 20,
              left: 0,
              bottom: 35,
            }}
          >
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
                if (value >= 1000) return `${(value / 1000).toFixed(1)}k`
                return value.toFixed(0)
              }}
            />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              contentStyle={{
                backgroundColor: 'rgba(0,0,0,0.8)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value: any) => {
                if (value >= 1000) return [`${(value / 1000).toFixed(1)}k`, 'Value']
                return [value.toFixed(0), 'Value']
              }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={50}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
