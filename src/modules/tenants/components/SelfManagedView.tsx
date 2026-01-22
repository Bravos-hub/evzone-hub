import { Card } from '@/ui/components/Card'
import type { TenantSiteSummary } from '../types/tenant'

type SelfManagedViewProps = {
  site: TenantSiteSummary
}

export function SelfManagedView({ site }: SelfManagedViewProps) {
  const totalStations = site.stations.length
  const activeStations = site.stations.filter(station => station.status === 'ACTIVE').length
  const maintenanceStations = site.stations.filter(station => station.status === 'MAINTENANCE').length
  const inactiveStations = Math.max(0, totalStations - activeStations - maintenanceStations)
  const activeSessions = Math.max(0, site.sessions)

  const alertStations = site.stations.filter(
    station => station.status === 'MAINTENANCE' || station.status === 'INACTIVE'
  )

  const utilization = totalStations > 0 ? Math.round((activeStations / totalStations) * 100) : 0

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="p-4">
        <div className="text-xs uppercase tracking-wide text-muted font-semibold">Live Station Status</div>
        <div className="mt-3 flex items-center gap-4 text-sm">
          <div>
            <div className="text-lg font-bold text-ok">{activeStations}</div>
            <div className="text-[11px] text-muted">Active</div>
          </div>
          <div>
            <div className="text-lg font-bold text-warn">{maintenanceStations}</div>
            <div className="text-[11px] text-muted">Maintenance</div>
          </div>
          <div>
            <div className="text-lg font-bold text-muted">{inactiveStations}</div>
            <div className="text-[11px] text-muted">Offline</div>
          </div>
        </div>
        <div className="mt-3 h-2 w-full rounded-full bg-muted/30 overflow-hidden">
          <div className="h-full bg-ok" style={{ width: `${utilization}%` }} />
        </div>
        <p className="mt-2 text-[11px] text-muted">Network utilization at {utilization}%</p>
      </Card>

      <Card className="p-4">
        <div className="text-xs uppercase tracking-wide text-muted font-semibold">Active Sessions</div>
        <div className="mt-3 text-2xl font-bold">{activeSessions}</div>
        <div className="mt-2 text-[11px] text-muted">
          {activeSessions > 0 ? 'Charging sessions in progress' : 'No active charging sessions'}
        </div>
        <div className="mt-3 text-xs text-muted">
          Energy delivered this month: <span className="font-semibold text-text">{site.energy.toLocaleString()} kWh</span>
        </div>
      </Card>

      <Card className="p-4">
        <div className="text-xs uppercase tracking-wide text-muted font-semibold">Maintenance Alerts</div>
        <div className="mt-3 space-y-2 text-xs">
          {alertStations.length === 0 && (
            <div className="text-muted">No active alerts across this site.</div>
          )}
          {alertStations.slice(0, 3).map(station => (
            <div key={station.id} className="flex items-center justify-between">
              <span className="font-medium">{station.name}</span>
              <span className="pill pending text-[9px]">
                {station.status === 'MAINTENANCE' ? 'Maintenance' : 'Offline'}
              </span>
            </div>
          ))}
          {alertStations.length > 3 && (
            <div className="text-[11px] text-muted">+{alertStations.length - 3} more alerts</div>
          )}
        </div>
      </Card>
    </div>
  )
}
