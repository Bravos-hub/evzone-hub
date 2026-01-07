import type { WidgetProps } from '../../types'
import { Card } from '@/ui/components/Card'

export type LineChartConfig = {
  title?: string
  subtitle?: string
  values: number[]
  stroke?: string
  labels?: string[]
}

function LineChartSvg({ values, stroke, labels }: { values: number[]; stroke: string; labels?: string[] }) {
  const w = 520
  const h = 240
  const padX = 45
  const padTop = 25
  const padBottom = 35
  const chartW = w - padX * 2
  const chartH = h - padTop - padBottom
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const norm = (v: number) => (v - min) / range
  
  const pts = values.map((v, i) => {
    const x = padX + (i * chartW) / Math.max(1, values.length - 1)
    const y = padTop + (1 - norm(v)) * chartH
    return { x, y, value: v }
  })

  // Generate grid lines
  const gridLines = 5
  const gridYPositions: number[] = []
  for (let i = 0; i <= gridLines; i++) {
    gridYPositions.push(padTop + (chartH * i) / gridLines)
  }

  // Format value for y-axis labels
  const formatValue = (v: number) => {
    if (v >= 1000) return `$${(v / 1000).toFixed(1)}k`
    return `$${v.toFixed(0)}`
  }

  // Create smooth curve path using quadratic bezier
  const createSmoothPath = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return ''
    let path = `M ${points[0].x},${points[0].y}`
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1]
      const curr = points[i]
      const next = points[i + 1]
      if (next) {
        const cp1x = prev.x + (curr.x - prev.x) * 0.5
        const cp1y = prev.y
        const cp2x = curr.x - (next.x - curr.x) * 0.5
        const cp2y = curr.y
        path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${curr.x},${curr.y}`
      } else {
        path += ` L ${curr.x},${curr.y}`
      }
    }
    return path
  }

  // Create area gradient path - use simple path for area
  const areaPath = pts.length > 0
    ? `M ${pts[0].x} ${h - padBottom} L ${pts.map(p => `${p.x},${p.y}`).join(' L ')} L ${pts[pts.length - 1].x} ${h - padBottom} Z`
    : ''

  const gradientId = `lineGrad-${stroke.replace('#', '')}`

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <defs>
        {/* Enhanced gradient for area fill */}
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.4" />
          <stop offset="50%" stopColor={stroke} stopOpacity="0.15" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0.02" />
        </linearGradient>
        {/* Glow filter for line */}
        <filter id={`glow-${gradientId}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Subtle grid lines */}
      {gridYPositions.map((y, i) => (
        <line
          key={i}
          x1={padX}
          y1={y}
          x2={w - padX}
          y2={y}
          stroke="rgba(255,255,255,.04)"
          strokeWidth="1"
          strokeDasharray={i === gridLines ? "0" : "3,3"}
        />
      ))}

      {/* Y-axis labels */}
      {gridYPositions.map((y, i) => {
        const value = max - (range * i) / gridLines
        return (
          <text
            key={`label-${i}`}
            x={padX - 12}
            y={y + 5}
            textAnchor="end"
            fontSize="11"
            fill="rgba(255,255,255,.5)"
            fontWeight="600"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            {formatValue(value)}
          </text>
        )
      })}

      {/* X-axis line */}
      <line
        x1={padX}
        y1={h - padBottom}
        x2={w - padX}
        y2={h - padBottom}
        stroke="rgba(255,255,255,.08)"
        strokeWidth="1"
      />

      {/* Area fill with gradient */}
      {areaPath && (
        <path
          d={areaPath}
          fill={`url(#${gradientId})`}
        />
      )}

      {/* Smooth line with glow */}
      {pts.length > 1 && (
        <path
          d={createSmoothPath(pts)}
          fill="none"
          stroke={stroke}
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
          filter={`url(#glow-${gradientId})`}
        />
      )}

      {/* Enhanced data points */}
      {pts.map((p, i) => {
        if (p.value === 0) return (
          <g key={i}>
            {/* X-axis label for zero values */}
            {labels && labels[i] && (
              <text
                x={p.x}
                y={h - padBottom + 18}
                textAnchor="middle"
                fontSize="10"
                fill="rgba(255,255,255,.5)"
                fontWeight="600"
                fontFamily="system-ui, -apple-system, sans-serif"
                style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}
              >
                {labels[i]}
              </text>
            )}
          </g>
        )
        return (
          <g key={i}>
            {/* Outer glow ring */}
            <circle cx={p.x} cy={p.y} r={8} fill={stroke} opacity={0.15} />
            {/* Middle ring */}
            <circle cx={p.x} cy={p.y} r={6} fill={stroke} opacity={0.3} />
            {/* Inner point */}
            <circle cx={p.x} cy={p.y} r={4} fill={stroke} />
            {/* Bright center */}
            <circle cx={p.x} cy={p.y} r={2.5} fill="white" opacity={0.95} />
            {/* X-axis label directly under data point */}
            {labels && labels[i] && (
              <text
                x={p.x}
                y={h - padBottom + 18}
                textAnchor="middle"
                fontSize="10"
                fill="rgba(255,255,255,.5)"
                fontWeight="600"
                fontFamily="system-ui, -apple-system, sans-serif"
                style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}
              >
                {labels[i]}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

export function LineChartWidget({ config }: WidgetProps<LineChartConfig>) {
  const { title, subtitle, values = [], stroke = '#03cd8c', labels } = config ?? {}

  return (
    <Card>
      {title && (
        <div className="mb-4">
          <div className="card-title">{title}</div>
          {subtitle && <div className="text-xs text-muted mt-1">{subtitle}</div>}
        </div>
      )}
      <div className="px-2">
        <LineChartSvg values={values} stroke={stroke} labels={labels} />
      </div>
    </Card>
  )
}

