import { Card } from '@/ui/components/Card'
import { useOwnerDashboardData } from '@/modules/analytics/hooks/useOwnerDashboardData'

function pillClass(severity: string) {
  if (severity === 'CRITICAL') return 'pill rejected'
  if (severity === 'HIGH') return 'pill sendback'
  return 'pill pending'
}

export function OwnerOperationsWidget() {
  const { data, isLoading } = useOwnerDashboardData()
  if (!data) return null

  const { operations } = data

  return (
    <Card className="p-6 flex flex-col gap-5">
      <div>
        <h3 className="text-lg font-bold text-text">Hardware Availability</h3>
        <p className="text-sm text-text-secondary">Asset health, downtime, and recurring faults</p>
      </div>

      {isLoading ? (
        <div className="text-sm text-text-secondary">Loading operations...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-lg border border-border-light bg-panel p-3">
              <div className="text-[11px] font-semibold uppercase text-muted">Online</div>
              <div className="text-xl font-semibold">{operations.statusCounts.online}</div>
            </div>
            <div className="rounded-lg border border-border-light bg-panel p-3">
              <div className="text-[11px] font-semibold uppercase text-muted">Offline</div>
              <div className="text-xl font-semibold">{operations.statusCounts.offline}</div>
            </div>
            <div className="rounded-lg border border-border-light bg-panel p-3">
              <div className="text-[11px] font-semibold uppercase text-muted">Maintenance</div>
              <div className="text-xl font-semibold">{operations.statusCounts.maintenance}</div>
            </div>
            <div className="rounded-lg border border-border-light bg-panel p-3">
              <div className="text-[11px] font-semibold uppercase text-muted">Downtime</div>
              <div className="text-xl font-semibold">{operations.downtimeHours == null ? 'N/A' : `${operations.downtimeHours.toFixed(1)}h`}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border-light bg-panel p-3">
              <div className="text-[11px] font-semibold uppercase text-muted">Open Incidents</div>
              <div className="text-xl font-semibold">{operations.openIncidents}</div>
            </div>
            <div className="rounded-lg border border-border-light bg-panel p-3">
              <div className="text-[11px] font-semibold uppercase text-muted">Recurring Fault Stations</div>
              <div className="text-xl font-semibold">{operations.recurringFaultStations}</div>
            </div>
          </div>

          <div className="space-y-3">
            {operations.incidentSummary.length === 0 ? (
              <div className="text-sm text-text-secondary">No incident hotspots for this range.</div>
            ) : (
              operations.incidentSummary.map((item) => (
                <div key={item.stationId} className="flex items-center justify-between gap-3 rounded-lg border border-border-light bg-panel p-3">
                  <div>
                    <div className="font-semibold text-text">{item.stationName}</div>
                    <div className="text-xs text-text-secondary">
                      {item.openCount} open, {item.recurringCount} recurring
                    </div>
                  </div>
                  <span className={pillClass(item.highestSeverity)}>{item.highestSeverity}</span>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </Card>
  )
}
