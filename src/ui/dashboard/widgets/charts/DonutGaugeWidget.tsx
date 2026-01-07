import type { WidgetProps } from '../../types'
import { Card } from '@/ui/components/Card'

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
  const r = 56
  const strokeWidth = 16
  const c = 2 * Math.PI * r
  const dash = (pct / 100) * c
  const rest = c - dash
  const gradientId = `donutGrad-${color.replace(/[^a-zA-Z0-9]/g, '')}`

  return (
    <Card>
      {title && (
        <div className="mb-4">
          <div className="card-title">{title}</div>
          {subtitle && <div className="text-xs text-muted mt-1">{subtitle}</div>}
        </div>
      )}
      <div className="flex items-center justify-center gap-6 flex-wrap">
        <div className="relative">
          <svg width={160} height={160} viewBox="0 0 160 160" aria-hidden="true">
            <defs>
              {/* Modern gradient for donut */}
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={color} stopOpacity="1" />
                <stop offset="100%" stopColor={color} stopOpacity="0.7" />
              </linearGradient>
              {/* Glow filter */}
              <filter id={`donutGlow-${gradientId}`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            
            {/* Background circle - more subtle */}
            <circle 
              cx="80" 
              cy="80" 
              r={r} 
              stroke="rgba(255,255,255,.06)" 
              strokeWidth={strokeWidth} 
              fill="none" 
            />
            
            {/* Progress circle with gradient and glow */}
            <circle
              cx="80"
              cy="80"
              r={r}
              stroke={`url(#${gradientId})`}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${dash} ${rest}`}
              strokeLinecap="round"
              transform="rotate(-90 80 80)"
              filter={`url(#donutGlow-${gradientId})`}
            />
            
            {/* Center text - more prominent */}
            <text 
              x="80" 
              y="78" 
              textAnchor="middle" 
              fontSize="28" 
              fill="white" 
              fontWeight="800"
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              {pct.toFixed(1)}%
            </text>
            <text 
              x="80" 
              y="98" 
              textAnchor="middle" 
              fontSize="12" 
              fill="rgba(255,255,255,.65)" 
              fontWeight="600"
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              {label}
            </text>
          </svg>
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

