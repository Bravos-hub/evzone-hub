import { useScopeStore } from '@/core/scope/scopeStore'
import { useSites } from '@/modules/sites/hooks/useSites'
import { useStations } from '@/modules/stations/hooks/useStations'
import { Card } from '@/ui/components/Card'

export function OwnerFiltersWidget() {
  const { scope, setScope } = useScopeStore()
  const { data: sites = [] } = useSites()
  const { data: stations = [] } = useStations()

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-[0.5px] text-muted mb-1.5">Date Range</div>
          <select
            className="w-full rounded-lg border border-border-light bg-panel px-3 py-2 text-sm"
            value={scope.dateRange}
            onChange={(e) => setScope({ dateRange: e.target.value as typeof scope.dateRange })}
          >
            <option value="7D">Last 7 days</option>
            <option value="30D">Last 30 days</option>
          </select>
        </div>
        <div className="flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-[0.5px] text-muted mb-1.5">Site</div>
          <select
            className="w-full rounded-lg border border-border-light bg-panel px-3 py-2 text-sm"
            value={scope.siteId ?? 'ALL'}
            onChange={(e) => setScope({ siteId: e.target.value as string, stationId: 'ALL' })}
          >
            <option value="ALL">All sites</option>
            {sites.map((site) => (
              <option key={site.id} value={site.id}>{site.name}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-[0.5px] text-muted mb-1.5">Station</div>
          <select
            className="w-full rounded-lg border border-border-light bg-panel px-3 py-2 text-sm"
            value={scope.stationId}
            onChange={(e) => setScope({ stationId: e.target.value as string })}
          >
            <option value="ALL">All stations</option>
            {stations
              .filter((station) => !scope.siteId || scope.siteId === 'ALL' || station.orgId === scope.siteId)
              .map((station) => (
                <option key={station.id} value={station.id}>{station.name}</option>
              ))}
          </select>
        </div>
        <div className="flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-[0.5px] text-muted mb-1.5">State</div>
          <select
            className="w-full rounded-lg border border-border-light bg-panel px-3 py-2 text-sm"
            value={scope.state ?? 'ALL'}
            onChange={(e) => setScope({ state: e.target.value as string })}
          >
            <option value="ALL">All states</option>
            <option value="ACTIVE">Active</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>
    </Card>
  )
}
