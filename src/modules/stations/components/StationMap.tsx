import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { useAuthStore } from '@/core/auth/authStore'
import { hasPermission } from '@/constants/permissions'
import { useStations } from '../hooks/useStations'
import type { Station as ApiStation } from '@/core/api/types'
import { StationMapCanvas, type StationMapData } from './StationMapCanvas'
import { StationFiltersPanel } from './StationFiltersPanel'
import { StationListPanel } from './StationListPanel'
import { mapApiStationToMapData } from '../utils/geo'
import { API_CONFIG } from '@/core/api/config'

type MapBounds = {
  north: number
  south: number
  east: number
  west: number
}

const BOUNDS_FETCH_DEBOUNCE_MS = 500

export function StationMap() {
  const { user } = useAuthStore()
  const role = user?.role ?? 'STATION_OWNER'
  const canView = hasPermission(role, 'stations', 'view')

  // 1. Local State
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null)
  const [popupInfo, setPopupInfo] = useState<StationMapData | null>(null)
  const [showCoverage, setShowCoverage] = useState(false)
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null)
  const [debouncedBounds, setDebouncedBounds] = useState<MapBounds | null>(null)
  const [viewState, setViewState] = useState({
    longitude: 35.0,
    latitude: -1.0,
    zoom: 4
  })
  const boundsFetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 2. Debounced viewport bounds (Discover-style)
  useEffect(() => {
    if (!mapBounds) return
    if (boundsFetchTimeoutRef.current) {
      clearTimeout(boundsFetchTimeoutRef.current)
    }

    boundsFetchTimeoutRef.current = setTimeout(() => {
      setDebouncedBounds(mapBounds)
    }, BOUNDS_FETCH_DEBOUNCE_MS)
  }, [mapBounds])

  useEffect(() => {
    return () => {
      if (boundsFetchTimeoutRef.current) {
        clearTimeout(boundsFetchTimeoutRef.current)
      }
    }
  }, [])

  const searchQuery = q.trim()
  const normalizedSearchQuery = searchQuery.toLowerCase()

  // 3. Viewport data fetch
  const boundsQuery = useMemo(() => {
    if (!debouncedBounds) return undefined
    return {
      north: debouncedBounds.north,
      south: debouncedBounds.south,
      east: debouncedBounds.east,
      west: debouncedBounds.west,
    }
  }, [debouncedBounds])

  const {
    data: apiStations,
    isLoading: isViewportStationsLoading,
    error: viewportError,
  } = useStations(boundsQuery, { enabled: !!debouncedBounds })

  // 4. Derived Data (Normalized & Filtered)
  const allMapStations = useMemo(() =>
    (apiStations || []).map((s) => mapApiStationToMapData(s as ApiStation)),
    [apiStations]
  )

  const locallyFilteredStations = useMemo(() =>
    allMapStations
      .filter((s) => !normalizedSearchQuery ||
        s.name.toLowerCase().includes(normalizedSearchQuery) ||
        s.address.toLowerCase().includes(normalizedSearchQuery) ||
        s.id.toLowerCase().includes(normalizedSearchQuery)
      )
      .filter((s) => statusFilter === 'All' || s.status === statusFilter)
      .filter((s) => typeFilter === 'All' || s.type === typeFilter),
    [allMapStations, normalizedSearchQuery, statusFilter, typeFilter]
  )

  // Discover-style global search fallback when the viewport has no local matches.
  const shouldGlobalSearch = searchQuery.length > 0 && locallyFilteredStations.length === 0

  const {
    data: globalSearchStationsData,
    isLoading: isGlobalSearchLoading,
    error: globalSearchError,
  } = useStations(
    shouldGlobalSearch ? { q: searchQuery } : undefined,
    { enabled: shouldGlobalSearch }
  )

  const globalSearchStations = useMemo(() =>
    (globalSearchStationsData || []).map((s) => mapApiStationToMapData(s as ApiStation))
      .filter((s) => statusFilter === 'All' || s.status === statusFilter)
      .filter((s) => typeFilter === 'All' || s.type === typeFilter)
      .filter((s) =>
        s.name.toLowerCase().includes(normalizedSearchQuery) ||
        s.address.toLowerCase().includes(normalizedSearchQuery) ||
        s.id.toLowerCase().includes(normalizedSearchQuery)
      ),
    [globalSearchStationsData, statusFilter, typeFilter, normalizedSearchQuery]
  )

  const filteredStations = shouldGlobalSearch ? globalSearchStations : locallyFilteredStations
  const totalVisibleSourceCount = shouldGlobalSearch ? globalSearchStations.length : allMapStations.length
  const isLoading = !debouncedBounds || isViewportStationsLoading || (shouldGlobalSearch && isGlobalSearchLoading)
  const error = viewportError || globalSearchError

  const stationsById = useMemo(() => {
    const stationMap = new Map<string, StationMapData>()
    allMapStations.forEach((station) => stationMap.set(station.id, station))
    globalSearchStations.forEach((station) => stationMap.set(station.id, station))
    return stationMap
  }, [allMapStations, globalSearchStations])

  const tileUrl = useMemo(() => {
    const base = `${API_CONFIG.baseURL}/geography/tiles/{z}/{x}/{y}.pbf`
    const params = new URLSearchParams()
    if (statusFilter !== 'All') params.append('status', statusFilter)
    if (typeFilter !== 'All') params.append('type', typeFilter)
    const qs = params.toString()
    return qs ? `${base}?${qs}` : base
  }, [statusFilter, typeFilter])

  // 5. Stats Calculations
  const stats = useMemo(() => {
    const total = filteredStations.length || 1
    const activeCount = filteredStations.filter((s) => s.status === 'ACTIVE').length
    const inactiveCount = filteredStations.filter((s) => s.status === 'INACTIVE').length
    return {
      avgHealth: Math.round((activeCount / total) * 100),
      openIncidents: inactiveCount
    }
  }, [filteredStations])

  // 6. Handlers
  const handleBoundsChanged = useCallback((bounds: MapBounds) => {
    setMapBounds(bounds)
  }, [])

  const handleStationSelect = useCallback((id: string) => {
    const station = stationsById.get(id)
    if (!station) return

    setSelectedStationId(id)
    setPopupInfo(station)
    setViewState((prev) => ({
      ...prev,
      longitude: station.lng,
      latitude: station.lat,
      zoom: 14
    }))
  }, [stationsById])

  const handleClusterClick = useCallback((_: number, coordinates: [number, number], __: string) => {
    setViewState((prev) => ({
      ...prev,
      longitude: coordinates[0],
      latitude: coordinates[1],
      zoom: prev.zoom + 2
    }))
  }, [])

  if (!canView) return (
    <div className="flex items-center justify-center p-20 bg-panel rounded-2xl border border-dashed border-border-light text-muted font-medium">
      Access Restricted: Insufficient permissions to view the stations map.
    </div>
  )

  if (error) return (
    <div className="card bg-danger/5 border-danger/20 p-8 text-center">
      <h3 className="text-danger font-bold text-lg">Infrastructure Link Failed</h3>
      <p className="text-muted text-sm mt-1">{error instanceof Error ? error.message : 'Unable to connect to spatial data services.'}</p>
    </div>
  )

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-140px)] min-h-[600px] animate-in fade-in duration-500">
      {/* Dynamic Header Section */}
      <div className="bg-gradient-to-r from-bg-secondary to-bg-panel border border-border-light rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-sm overflow-hidden relative">
        <div className="z-10">
          <h1 className="text-2xl font-black text-text tracking-tight flex items-center gap-2">
            Stations Explorer <span className="text-accent text-sm font-mono bg-accent/10 px-2 py-0.5 rounded-full">v2.0 (WebGL)</span>
          </h1>
          <p className="text-sm text-muted font-medium mt-1">
            Visualizing {filteredStations.length} of {totalVisibleSourceCount} hyper-connected assets
          </p>
        </div>

        <div className="flex items-center gap-8 z-10">
          <div className="group text-center">
            <div className="text-[10px] text-muted-more uppercase font-black tracking-widest mb-1 group-hover:text-ok transition-colors">Operational Health</div>
            <div className={`text-2xl font-black ${stats.avgHealth > 85 ? 'text-ok' : stats.avgHealth > 60 ? 'text-warn' : 'text-danger'}`}>
              {stats.avgHealth}%
            </div>
          </div>
          <div className="w-px h-10 bg-border-light hidden sm:block opacity-50" />
          <div className="group text-center">
            <div className="text-[10px] text-muted-more uppercase font-black tracking-widest mb-1 group-hover:text-danger transition-colors">Active Incidents</div>
            <div className={`text-2xl font-black ${stats.openIncidents === 0 ? 'text-text/20' : 'text-danger'}`}>
              {stats.openIncidents}
            </div>
          </div>
        </div>

        {/* Subtle background glow */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-accent/5 blur-[100px] rounded-full pointer-events-none" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4 grow min-h-0">
        {/* Interactive Sidebar Layout */}
        <aside className="card border-border-light p-4 flex flex-col gap-5 h-full overflow-hidden bg-panel/40 backdrop-blur-sm">
          <div className="border-b border-border-light pb-4">
            <h2 className="text-xs font-black text-muted uppercase tracking-widest mb-4">Discovery Engine</h2>
            <StationFiltersPanel
              query={q}
              setQuery={setQ}
              status={statusFilter}
              setStatus={setStatusFilter}
              type={typeFilter}
              setType={setTypeFilter}
              showCoverage={showCoverage}
              setShowCoverage={setShowCoverage}
              isLoading={isLoading}
            />
          </div>

          <div className="flex flex-col grow min-h-0">
            <h2 className="text-xs font-black text-muted uppercase tracking-widest mb-4 flex justify-between">
              Connectivity List
              <span className="text-[10px] font-mono text-accent">{filteredStations.length} units</span>
            </h2>
            <StationListPanel
              stations={filteredStations}
              selectedStationId={selectedStationId}
              onSelect={handleStationSelect}
              isLoading={isLoading}
            />
          </div>
        </aside>

        {/* High-Performance Map Canvas */}
        <main className="relative group/map shadow-2xl rounded-2xl overflow-hidden glass-card border border-white/5">
          <StationMapCanvas
            tileUrl={tileUrl}
            viewState={viewState}
            onMove={(evt) => setViewState(evt.viewState)}
            onBoundsChanged={handleBoundsChanged}
            onStationClick={(s) => handleStationSelect(s.id)}
            onClusterClick={handleClusterClick}
            selectedStationId={selectedStationId}
            popupInfo={popupInfo}
            setPopupInfo={setPopupInfo}
            showCoverage={showCoverage}
          />

          {/* Map floating controls layer */}
          <div className="absolute bottom-6 left-6 flex flex-col gap-2 pointer-events-none">
            <div className="bg-panel/80 backdrop-blur-md border border-white/10 p-3 rounded-2xl pointer-events-auto shadow-xl transition-all hover:border-accent/40">
              <div className="flex items-center gap-3 text-[10px] font-bold text-muted uppercase mb-2">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" /> Map Realtime Sync
              </div>
              <div className="flex gap-4">
                <LegendItem color="#03cd8c" label="Active" />
                <LegendItem color="#ef4444" label="Offline" />
                <LegendItem color="#3b82f6" label="Maint" />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function LegendItem({ color, label }: { color: string, label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2 h-2 rounded-full shadow-[0_0_5px_rgba(0,0,0,0.5)]" style={{ backgroundColor: color }} />
      <span className="text-[10px] font-bold text-text/80">{label}</span>
    </div>
  )
}

export default StationMap
