import type { WidgetProps } from '../../types'
import { Card } from '@/ui/components/Card'

export type BarChartConfig = {
  title?: string
  subtitle?: string
  values: number[]
  color?: string
  labels?: string[]
}

function BarChartSvg({ values, color, labels }: { values: number[]; color: string; labels?: string[] }) {
  const w = 520
  const h = 240
  const padX = 45
  const padTop = 25
  const padBottom = 35
  const chartW = w - padX * 2
  const chartH = h - padTop - padBottom
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const range = max - min || 1
  const bw = chartW / values.length
  
  // Generate grid lines (5 horizontal lines for better granularity)
  const gridLines = 5
  const gridYPositions: number[] = []
  for (let i = 0; i <= gridLines; i++) {
    gridYPositions.push(padTop + (chartH * i) / gridLines)
  }

  // Format value for y-axis labels
  const formatValue = (v: number) => {
    if (v >= 1000) return `${(v / 1000).toFixed(1)}k`
    return v.toFixed(0)
  }

  // Create gradient ID from color
  const gradientId = `barGrad-${color.replace('#', '')}`

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <defs>
        {/* Modern gradient for bars */}
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.75" />
        </linearGradient>
        {/* Shadow filter for depth */}
        <filter id={`shadow-${gradientId}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
          <feOffset dx="0" dy="2" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.3" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
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
      
      {/* Y-axis labels with better typography */}
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

      {/* X-axis line - more subtle */}
      <line
        x1={padX}
        y1={h - padBottom}
        x2={w - padX}
        y2={h - padBottom}
        stroke="rgba(255,255,255,.08)"
        strokeWidth="1"
      />

      {/* Bars with modern styling */}
      {values.map((v, i) => {
        const x = padX + i * bw + bw * 0.12
        const barW = bw * 0.76
        const barH = (chartH * (v - min)) / range
        const y = h - padBottom - barH
        const barCenterX = x + barW / 2
        
        // Skip rendering if value is 0
        if (v === 0) {
          return (
            <g key={i}>
              <rect
                x={x}
                y={h - padBottom - 2}
                width={barW}
                height={2}
                rx={3}
                fill="rgba(255,255,255,.05)"
              />
              {/* X-axis label for zero values */}
              {labels && labels[i] && (
                <text
                  x={barCenterX}
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
        }
        
        return (
          <g key={i} filter={`url(#shadow-${gradientId})`}>
            {/* Subtle background glow */}
            <rect
              x={x - 1}
              y={y - 1}
              width={barW + 2}
              height={barH + 1}
              rx={8}
              fill={color}
              opacity={0.1}
            />
            {/* Main bar with gradient */}
            <rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx={8}
              fill={`url(#${gradientId})`}
            />
            {/* Top highlight for 3D effect */}
            <rect
              x={x}
              y={y}
              width={barW}
              height={Math.min(barH * 0.15, 8)}
              rx={8}
              fill="rgba(255,255,255,.25)"
            />
            {/* Value label on top */}
            {barH > 25 && (
              <text
                x={barCenterX}
                y={y - 8}
                textAnchor="middle"
                fontSize="11"
                fill="rgba(255,255,255,.9)"
                fontWeight="700"
                fontFamily="system-ui, -apple-system, sans-serif"
              >
                {formatValue(v)}
              </text>
            )}
            {/* X-axis label directly under bar */}
            {labels && labels[i] && (
              <text
                x={barCenterX}
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

export function BarChartWidget({ config }: WidgetProps<BarChartConfig>) {
  const { title, subtitle, values = [], color = '#f77f00', labels } = config ?? {}

  return (
    <Card>
      {title && (
        <div className="mb-4">
          <div className="card-title">{title}</div>
          {subtitle && <div className="text-xs text-muted mt-1">{subtitle}</div>}
        </div>
      )}
      <div className="px-2">
        <BarChartSvg values={values} color={color} labels={labels} />
      </div>
    </Card>
  )
}

