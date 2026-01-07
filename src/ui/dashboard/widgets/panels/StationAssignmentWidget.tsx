import type { WidgetProps } from '../../types'
import { Card } from '@/ui/components/Card'

export type StationAssignment = {
  id: string
  name: string
  location: string
  status: 'online' | 'offline' | 'warning'
  capability: 'Charge' | 'Swap' | 'Both'
  shift: string
  attendant: string
}

export type StationMetricTone = 'ok' | 'warn' | 'danger'

export type StationMetric = {
  label: string
  value: string
  tone?: StationMetricTone
}

export type StationAssignmentConfig = {
  title?: string
  subtitle?: string
  station?: StationAssignment
  metrics?: StationMetric[]
}

function statusClass(status: StationAssignment['status']) {
  switch (status) {
    case 'online':
      return 'text-ok border-ok/40 bg-ok/10'
    case 'warning':
      return 'text-warn border-warn/40 bg-warn/10'
    case 'offline':
      return 'text-danger border-danger/40 bg-danger/10'
    default:
      return 'text-muted border-border-light bg-panel'
  }
}

function toneClass(tone?: StationMetricTone) {
  switch (tone) {
    case 'ok':
      return 'text-ok'
    case 'warn':
      return 'text-warn'
    case 'danger':
      return 'text-danger'
    default:
      return 'text-text'
  }
}

function capabilityLabel(capability: StationAssignment['capability']) {
  if (capability === 'Both') return 'Charge + Swap'
  return capability
}

export function StationAssignmentWidget({ config }: WidgetProps<StationAssignmentConfig>) {
  const {
    title = 'Assigned station',
    subtitle = 'Station details for this shift',
    station,
    metrics = [],
  } = config ?? {}

  if (!station) {
    return (
      <Card>
        <div className="card-title">{title}</div>
        <div className="text-sm text-muted">No station assigned yet.</div>
      </Card>
    )
  }

  return (
    <Card className="p-0">
      <div className="p-4 border-b border-border-light flex items-start justify-between gap-3">
        <div>
          <div className="card-title">{title}</div>
          {subtitle && <div className="text-xs text-muted">{subtitle}</div>}
        </div>
        <span className={`text-[10px] uppercase font-semibold rounded-full px-2 py-0.5 border ${statusClass(station.status)}`}>
          {station.status}
        </span>
      </div>

      <div className="p-4 grid gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-semibold text-text">{station.name}</div>
            <div className="text-xs text-muted">
              {station.id} | {station.location}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted">Station type</div>
            <div className="text-sm font-semibold text-text">{capabilityLabel(station.capability)}</div>
          </div>
        </div>

        {metrics.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {metrics.map((m) => (
              <div key={m.label} className="panel">
                <div className="text-[11px] uppercase text-muted">{m.label}</div>
                <div className={`text-lg font-semibold ${toneClass(m.tone)}`}>{m.value}</div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
          <div>Shift: {station.shift}</div>
          <div>Attendant: {station.attendant}</div>
        </div>
      </div>
    </Card>
  )
}
