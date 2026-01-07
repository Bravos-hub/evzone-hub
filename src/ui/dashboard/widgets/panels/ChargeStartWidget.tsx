import type { WidgetProps } from '../../types'
import { Card } from '@/ui/components/Card'

export type ChargeScan = {
  chargerId: string
  rfid: string
  time: string
  status: 'ready' | 'started'
}

export type ChargeStartConfig = {
  title?: string
  subtitle?: string
  tips?: string[]
  recentScans?: ChargeScan[]
}

function scanStatusClass(status: ChargeScan['status']) {
  return status === 'started' ? 'approved' : 'pending'
}

export function ChargeStartWidget({ config }: WidgetProps<ChargeStartConfig>) {
  const {
    title = 'Start charge session',
    subtitle = 'Scan charger QR or tap RFID to begin',
    tips = [],
    recentScans = [],
  } = config ?? {}

  return (
    <Card className="p-0">
      <div className="p-4 border-b border-border-light flex items-start justify-between gap-3">
        <div>
          <div className="card-title">{title}</div>
          {subtitle && <div className="text-xs text-muted">{subtitle}</div>}
        </div>
        <div className="flex items-center gap-2 text-[10px] uppercase font-semibold text-muted">
          <span className="h-2 w-2 rounded-full bg-ok animate-pulse" />
          Scanner ready
        </div>
      </div>

      <div className="p-4 grid gap-4">
        <div className="grid gap-2">
          <label className="text-xs text-muted">Charger QR / ID</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input className="input flex-1" placeholder="CP-A1 or QR payload" />
            <button className="btn secondary whitespace-nowrap">Scan QR</button>
          </div>
        </div>

        <div className="grid gap-2">
          <label className="text-xs text-muted">Customer RFID</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input className="input flex-1" placeholder="RFID tag" />
            <button className="btn secondary whitespace-nowrap">Tap RFID</button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button className="btn">Start session</button>
          <button className="btn secondary">Assign bay</button>
          <button className="btn secondary">Manual entry</button>
        </div>

        {tips.length > 0 && (
          <div className="grid gap-2 sm:grid-cols-3">
            {tips.map((tip) => (
              <div key={tip} className="panel text-xs">
                {tip}
              </div>
            ))}
          </div>
        )}

        {recentScans.length > 0 && (
          <div className="grid gap-2">
            <div className="text-[11px] uppercase font-semibold text-muted">Recent scans</div>
            {recentScans.map((scan) => (
              <div key={`${scan.chargerId}-${scan.rfid}`} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border-light bg-panel/40">
                <div>
                  <div className="text-sm font-semibold text-text">{scan.chargerId}</div>
                  <div className="text-xs text-muted">RFID {scan.rfid}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted">{scan.time}</div>
                  <span className={`pill ${scanStatusClass(scan.status)}`}>{scan.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}
