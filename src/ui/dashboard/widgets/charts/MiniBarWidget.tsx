import type { WidgetProps } from '../../types'

export type MiniBarConfig = {
  value: number
  color?: string
}

function clampPct(x: number) {
  return Math.max(0, Math.min(100, x))
}

export function MiniBar({ value, color }: { value: number; color: string }) {
  const v = clampPct(value)
  return (
    <div className="h-2 w-full rounded-full bg-white/5 border border-border-light overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${v}%`, background: color }} />
    </div>
  )
}

export type MetricRowConfig = {
  label: string
  value: number
  hint?: string
  color?: string
}

export function MetricRow({ label, value, hint, color = '#f77f00' }: MetricRowConfig) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex flex-col">
        <span className="text-xs text-muted">{label}</span>
        <span className="text-sm font-semibold text-text">{hint ?? value.toLocaleString()}</span>
      </div>
      <div className="w-32">
        <MiniBar value={value} color={color} />
      </div>
    </div>
  )
}

export function MiniBarWidget({ config }: WidgetProps<MiniBarConfig>) {
  const { value = 0, color = '#f77f00' } = config ?? {}
  return <MiniBar value={value} color={color} />
}

