import { useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { hasPermission, getPermissionsForFeature } from '@/constants/permissions'
import { StationStatusPill, type StationStatus } from '@/ui/components/StationStatusPill'
import { StationsHeatMap, stationPointFromSeed } from '@/ui/components/StationsHeatMap'
import { ChargePoints } from './ChargePoints'
import { SwapStations } from './SwapStations'
import { SmartCharging } from './SmartCharging'
import { Bookings } from './Bookings'
import { useStations } from '@/core/api/hooks/useStations'
import { getErrorMessage } from '@/core/api/errors'

// ... types and mock data omitted for brevity ...
type StationType = 'Charge' | 'Swap' | 'Both'
type Region = 'AFRICA' | 'EUROPE' | 'AMERICAS' | 'ASIA' | 'MIDDLE_EAST'
type StationsTab = 'overview' | 'charge-points' | 'swap-stations' | 'smart-charging' | 'bookings'

type Station = {
  id: string
  name: string
  region: Region
  country: string
  org: string
  type: StationType
  status: StationStatus
  healthScore: number
  utilization: number
  connectors: number
  swapBays: number
  openIncidents: number
  lastHeartbeat: string
  address: string
  gps: string
}

// Helper function to map API station to Station type
function mapApiStationToStation(apiStation: any): Station {
  return {
    id: apiStation.id,
    name: apiStation.name,
    region: 'AFRICA' as Region, // API doesn't provide region, defaulting
    country: '', // API doesn't provide country
    org: apiStation.orgId || 'N/A',
    type: apiStation.type === 'BOTH' ? 'Both' : apiStation.type === 'SWAP' ? 'Swap' : 'Charge',
    status: apiStation.status === 'ACTIVE' ? 'Online' : apiStation.status === 'INACTIVE' ? 'Offline' : 'Degraded',
    healthScore: 0, // Would come from stats endpoint
    utilization: 0, // Would come from analytics
    connectors: 0, // Would come from charge points
    swapBays: 0, // Would come from swap stations
    openIncidents: 0, // Would come from incidents
    lastHeartbeat: 'N/A', // Would come from real-time data
    address: apiStation.address || '',
    gps: `${apiStation.latitude || 0}, ${apiStation.longitude || 0}`,
  }
}

const regions: Array<{ id: Region | 'ALL'; label: string }> = [
  { id: 'ALL', label: 'All Regions' },
  { id: 'AFRICA', label: 'Africa' },
  { id: 'EUROPE', label: 'Europe' },
  { id: 'AMERICAS', label: 'Americas' },
  { id: 'ASIA', label: 'Asia' },
  { id: 'MIDDLE_EAST', label: 'Middle East' },
]

export function Stations() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'stations')

  const { data: stationsData, isLoading, error } = useStations()

  const activeTab = useMemo<StationsTab>(() => {
    const path = location.pathname
    if (path.includes('/charge-points')) return 'charge-points'
    if (path.includes('/swap-stations')) return 'swap-stations'
    if (path.includes('/smart-charging')) return 'smart-charging'
    if (path.includes('/bookings')) return 'bookings'
    return 'overview'
  }, [location.pathname])

  const [q, setQ] = useState('')
  const [region, setRegion] = useState<Region | 'ALL'>('ALL')
  const [status, setStatus] = useState<StationStatus | 'All'>('All')

  // Map API stations to Station format
  const stations = useMemo(() => {
    if (!stationsData) return []
    return stationsData.map(mapApiStationToStation)
  }, [stationsData])

  const rows = useMemo(() => {
    return stations
      .filter(s => (region === 'ALL' ? true : s.region === region))
      .filter(s => (status === 'All' ? true : s.status === status))
      .filter(s => (q ? (s.name + ' ' + s.id + ' ' + s.country).toLowerCase().includes(q.toLowerCase()) : true))
  }, [stations, q, region, status])

  // Available tabs based on permissions
  const availableTabs = useMemo(() => {
    const tabs: Array<{ id: StationsTab; label: string }> = [{ id: 'overview', label: 'Overview' }]
    if (hasPermission(user?.role, 'chargePoints', 'access')) tabs.push({ id: 'charge-points', label: 'Charge Points' })
    if (hasPermission(user?.role, 'swapStations', 'access')) tabs.push({ id: 'swap-stations', label: 'Swap Stations' })
    return tabs
  }, [user?.role])

  const mapPoints = useMemo(() => {
    return rows.map(r => stationPointFromSeed({
      ...r,
      status: r.status as any
    })).filter(Boolean) as any[]
  }, [rows])

  return (
    <DashboardLayout pageTitle="Stations">
      {/* Tabs - Scrollable on mobile */}
      <div className="flex gap-2 border-b border-border-light mb-4 pb-2 overflow-x-auto scrollbar-hide">
        {availableTabs.map((t) => (
          <button
            key={t.id}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === t.id ? 'bg-accent text-white' : 'text-muted hover:text-text'
              }`}
            onClick={() => navigate(t.id === 'overview' ? '/stations' : `/stations/${t.id}`)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="card mb-4 bg-red-50 border border-red-200">
          <div className="text-red-700 text-sm">
            {getErrorMessage(error)}
          </div>
        </div>
      )}

      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Loading State */}
          {isLoading && (
            <div className="card">
              <div className="text-center py-8 text-muted">Loading stations...</div>
            </div>
          )}

          {/* Filters - Stacked on mobile */}
          {!isLoading && (
            <>
              <div className="card p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search..."
                    className="input sm:col-span-2 lg:col-span-1"
                  />
                  <select className="select" value={region} onChange={e => setRegion(e.target.value as any)}>
                    <option value="ALL">All Regions</option>
                    {regions.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                  </select>
                  <select className="select" value={status} onChange={e => setStatus(e.target.value as any)}>
                    <option value="All">All Status</option>
                    <option value="Online">Online</option>
                    <option value="Offline">Offline</option>
                    <option value="Degraded">Degraded</option>
                  </select>
                  <select className="select">
                    <option>All Orgs</option>
                  </select>
                  <select className="select">
                    <option>All Stations</option>
                  </select>
                  <select className="select">
                    <option>Last 7d</option>
                  </select>
                </div>
              </div>

              {/* Map Section */}
              <div className="card p-0 overflow-hidden">
                <div className="border-b border-border-light p-4">
                  <h3 className="font-semibold">Station Map</h3>
                </div>
                <div className="p-4">
                  <StationsHeatMap title="Stations Map" subtitle={`${rows.length} stations`} points={mapPoints} />
                </div>
              </div>

              {/* Table Container - Horizontal scroll */}
              <div className="overflow-x-auto rounded-xl border border-white/5 bg-panel">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-muted uppercase text-[11px] font-black tracking-wider">
                <tr>
                  <th className="px-6 py-4 w-4"><input type="checkbox" className="rounded border-white/10 bg-white/5" /></th>
                  <th className="px-6 py-4">Station</th>
                  <th className="px-6 py-4">Region</th>
                  <th className="px-6 py-4">Org</th>
                  <th className="px-6 py-4 text-center">Type</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Health</th>
                  <th className="px-6 py-4">Utilization</th>
                  <th className="px-6 py-4 text-center">Incidents</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-muted">
                      No stations found
                    </td>
                  </tr>
                ) : (
                  rows.map(r => (
                  <tr key={r.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4"><input type="checkbox" className="rounded border-white/10 bg-white/5" /></td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-text">{r.id}</div>
                      <div className="text-xs text-muted leading-tight">{r.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-muted font-medium">{r.region}</div>
                      <div className="text-[10px] text-muted-more uppercase">{r.country}</div>
                    </td>
                    <td className="px-6 py-4 text-muted">{r.org}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white/5 border border-white/10">{r.type}</span>
                    </td>
                    <td className="px-6 py-4"><StationStatusPill status={r.status} /></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden min-w-[60px]">
                          <div
                            className={`h-full rounded-full transition-all ${r.healthScore > 80 ? 'bg-ok' : r.healthScore > 50 ? 'bg-warn' : 'bg-danger'
                              }`}
                            style={{ width: `${r.healthScore}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono">{r.healthScore}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-muted font-mono">{r.utilization}%</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {r.openIncidents > 0 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-danger/20 text-danger text-xs font-bold border border-danger/20">
                          {r.openIncidents}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="btn secondary sm:px-4 sm:py-2 px-3 py-1.5 text-xs sm:text-sm">Open</button>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'charge-points' && <ChargePoints />}
      {activeTab === 'swap-stations' && <SwapStations />}
    </DashboardLayout>
  )
}
