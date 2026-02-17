import { useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { useMe } from '@/modules/auth/hooks/useAuth'
import { hasPermission, getPermissionsForFeature } from '@/constants/permissions'
import { canAccessStation, capabilityAllowsCharge, capabilityAllowsSwap } from '@/core/auth/rbac'
import { StationStatusPill, type StationStatus } from '@/ui/components/StationStatusPill'
import { StationsHeatMap, stationPointFromSeed } from '@/ui/components/StationsHeatMap'
import { ChargePoints } from './ChargePoints'
import { SwapStations } from './SwapStations'
import { SmartCharging } from './SmartCharging'
import { Bookings } from './Bookings'
import { useStations } from '@/modules/stations/hooks/useStations'
import { getErrorMessage } from '@/core/api/errors'
import Skeleton from 'react-loading-skeleton'
import { TableSkeleton } from '@/ui/components/SkeletonCards'
import { StationMapCanvas, type StationMapData } from '@/modules/stations/components/StationMapCanvas'
import { API_CONFIG } from '@/core/api/config'
import { PATHS } from '@/app/router/paths'
import {
  canCreateChargeStation,
  canCreateSwapStation,
  resolveViewerContext,
} from '@/modules/stations/utils/stationCreationPolicy'

// ... types and mock data omitted for brevity ...
type StationType = 'Charge' | 'Swap' | 'Both'
type Region = 'AFRICA' | 'EUROPE' | 'AMERICAS' | 'ASIA' | 'MIDDLE_EAST' | 'UNKNOWN'
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
const REGION_VALUES = new Set<Region>(['AFRICA', 'EUROPE', 'AMERICAS', 'ASIA', 'MIDDLE_EAST', 'UNKNOWN'])

function normalizeRegion(value?: string): Region {
  if (!value) return 'UNKNOWN'
  const normalized = value.toUpperCase().replace(/[\s-]+/g, '_')
  if (normalized === 'AMERICA') return 'AMERICAS'
  if (normalized === 'MIDEAST') return 'MIDDLE_EAST'
  return REGION_VALUES.has(normalized as Region) ? (normalized as Region) : 'UNKNOWN'
}

function mapApiStationToStation(apiStation: any): Station {
  return {
    id: apiStation.id,
    name: apiStation.name,
    region: normalizeRegion(apiStation.region),
    country: apiStation.country || apiStation.countryCode || '',
    org: apiStation.orgId || 'N/A',
    type: apiStation.type === 'BOTH' ? 'Both' : apiStation.type === 'SWAP' ? 'Swap' : 'Charge',
    status: apiStation.status === 'ACTIVE' ? 'Online' : apiStation.status === 'INACTIVE' ? 'Offline' : 'Degraded',
    healthScore: Number(apiStation.healthScore ?? apiStation.health ?? 0),
    utilization: Number(apiStation.utilization ?? 0),
    connectors: Number(apiStation.connectors ?? 0),
    swapBays: Number(apiStation.swapBays ?? 0),
    openIncidents: Number(apiStation.openIncidents ?? 0),
    lastHeartbeat: apiStation.lastHeartbeat || 'N/A',
    address: apiStation.address || '',
    gps: `${apiStation.latitude || 0}, ${apiStation.longitude || 0}`,
  }
}

export function Stations() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'stations')

  const { data: stationsData, isLoading, error } = useStations()
  const { data: me, isLoading: meLoading } = useMe()

  const activeTab = useMemo<StationsTab>(() => {
    const path = location.pathname
    if (path.includes('/charge-points')) return 'charge-points'
    if (path.includes('/swap-stations')) return 'swap-stations'
    if (path.includes('/smart-charging')) return 'smart-charging'
    if (path.includes('/bookings')) return 'bookings'
    return 'overview'
  }, [location.pathname])

  const accessContext = useMemo(() => ({
    role: user?.role,
    userId: user?.id,
    orgId: me?.orgId || me?.organizationId,
    assignedStations: me?.assignedStations || [],
    capability: me?.ownerCapability || user?.ownerCapability,
    viewAll: perms.viewAll,
  }), [user?.role, user?.id, me?.orgId, me?.organizationId, me?.assignedStations, me?.ownerCapability, user?.ownerCapability, perms.viewAll])

  const accessibleStationsData = useMemo(() => {
    if (!stationsData) return []
    return stationsData.filter((station) => {
      // We need to pass the raw API fields that might not be in the Station type yet
      const target = { ...station, ownerId: (station as any).ownerId, orgId: (station as any).orgId }
      return canAccessStation(accessContext, target as any, 'ANY')
    })
  }, [stationsData, accessContext])

  // Map API stations to Station format
  const stations = useMemo(() => {
    return accessibleStationsData.map(mapApiStationToStation)
  }, [accessibleStationsData])

  const rows = useMemo(() => stations, [stations])

  // --- Map State & Logic ---
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null)
  const [popupInfo, setPopupInfo] = useState<StationMapData | null>(null)
  const [viewState, setViewState] = useState({
    longitude: 35.0,
    latitude: -1.0,
    zoom: 4
  })

  const mapData = useMemo<StationMapData[]>(() => {
    return rows.map(r => {
      const api = accessibleStationsData.find(st => st.id === r.id) as any
      return {
        id: r.id,
        name: r.name,
        address: r.address,
        status: api?.status || 'ACTIVE',
        type: api?.type || 'CHARGING',
        lat: Number(api?.latitude || 0),
        lng: Number(api?.longitude || 0),
        capacity: Number(api?.capacity || 0)
      }
    })
  }, [rows, accessibleStationsData])

  const tileUrl = `${API_CONFIG.baseURL}/geography/tiles/{z}/{x}/{y}.pbf`

  const handleStationSelect = (id: string) => {
    const station = mapData.find(s => s.id === id)
    if (station) {
      setSelectedStationId(id)
      setPopupInfo(station)
      setViewState(prev => ({
        ...prev,
        longitude: station.lng,
        latitude: station.lat,
        zoom: 12
      }))
    }
  }

  // Available tabs based on permissions
  const availableTabs = useMemo(() => {
    const tabs: Array<{ id: StationsTab; label: string }> = [{ id: 'overview', label: 'Overview' }]
    const capability = me?.ownerCapability || user?.ownerCapability
    const needsScope = user?.role === 'STATION_OWNER' || user?.role === 'STATION_OPERATOR'
    const allowCharge = !needsScope || capabilityAllowsCharge(capability)
    const allowSwap = !needsScope || capabilityAllowsSwap(capability)

    if (hasPermission(user?.role, 'chargePoints', 'access') && allowCharge) {
      tabs.push({ id: 'charge-points', label: 'Charge Points' })
    }
    if (hasPermission(user?.role, 'swapStations', 'access') && allowSwap) {
      tabs.push({ id: 'swap-stations', label: 'Swap Stations' })
    }
    return tabs
  }, [user?.role, user?.ownerCapability, me?.ownerCapability])

  const mapPoints = useMemo(() => {
    return rows.map(r => stationPointFromSeed({
      ...r,
      status: r.status as any
    })).filter(Boolean) as any[]
  }, [rows])

  const needsScope = user?.role === 'STATION_OWNER' || user?.role === 'STATION_OPERATOR'
  const accessLoading = needsScope && meLoading
  const stationCreationContext = useMemo(() => resolveViewerContext(user, me), [user, me])
  const showAddStationButton =
    stationCreationContext.requiresOwnerCapabilityChoice ||
    canCreateChargeStation(stationCreationContext) ||
    canCreateSwapStation(stationCreationContext)

  if (!perms.access) {
    return (
      <DashboardLayout pageTitle="Stations">
        <div className="card">
          <p className="text-muted">You don't have permission to view this page.</p>
        </div>
      </DashboardLayout>
    )
  }

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
          {(isLoading || accessLoading) && (
            <div className="space-y-4">
              <div className="card p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} height={36} />
                  ))}
                </div>
              </div>
              <div className="table-wrap">
                <TableSkeleton rows={8} cols={10} />
              </div>
            </div>
          )}

          {/* Filters - Stacked on mobile */}
          {!isLoading && !accessLoading && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Station List</h2>
                {showAddStationButton && (
                  <button onClick={() => navigate(PATHS.OWNER.ADD_STATION_ENTRY)} className="btn primary flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" /></svg>
                    Add Station
                  </button>
                )}
              </div>

              {/* Map Section - High Performance WebGL MapLibre */}
              {!['SITE_OWNER', 'STATION_OWNER'].includes(user?.role || '') && (
                <div className="card p-0 overflow-hidden border-border-light shadow-xl">
                  <div className="border-b border-border-light p-4 bg-white/5 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-sm tracking-tight">Geospatial Distribution</h3>
                      <p className="text-[10px] text-muted-more uppercase font-black">{rows.length} Active nodes</p>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-ok" />
                        <span className="text-[10px] font-bold text-muted uppercase">Live</span>
                      </div>
                    </div>
                  </div>
                  <div className="h-[400px] w-full">
                    <StationMapCanvas
                      tileUrl={tileUrl}
                      viewState={viewState}
                      onMove={evt => setViewState(evt.viewState)}
                      onStationClick={s => handleStationSelect(s.id)}
                      onClusterClick={(id, coords) => setViewState(v => ({ ...v, longitude: coords[0], latitude: coords[1], zoom: v.zoom + 2 }))}
                      selectedStationId={selectedStationId}
                      popupInfo={popupInfo}
                      setPopupInfo={setPopupInfo}
                    />
                  </div>
                </div>
              )}

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
                      rows.map(r => {
                        const primaryStationLabel = r.name && r.name.trim() ? r.name : r.id
                        const showSecondaryId = Boolean(r.name && r.name.trim() && r.name !== r.id)
                        return (
                        <tr key={r.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4"><input type="checkbox" className="rounded border-white/10 bg-white/5" /></td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-text">{primaryStationLabel}</div>
                            {showSecondaryId && <div className="text-xs text-muted leading-tight">ID: {r.id}</div>}
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
                            <button
                              className="btn secondary sm:px-4 sm:py-2 px-3 py-1.5 text-xs sm:text-sm"
                              onClick={() => navigate(`/stations/${r.id}`)}
                            >
                              Open
                            </button>
                          </td>
                        </tr>
                        )
                      })
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

