import { useState, useMemo, useRef, useCallback } from 'react'
import { useAuthStore } from '@/core/auth/authStore'
import { hasPermission } from '@/constants/permissions'
import Map, { Source, Layer, Popup, NavigationControl, MapRef } from '@vis.gl/react-maplibre'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { FeatureCollection } from 'geojson'
import { useStations } from '../hooks/useStations'
import type { Station as ApiStation } from '@/core/api/types'

/* ─────────────────────────────────────────────────────────────────────────────
   Station Map — Owner/Operator station map view with MapLibre GL JS
   RBAC: Owners, Operators, Site Owners
───────────────────────────────────────────────────────────────────────────── */

// Map the backend Station type to our display needs
interface StationMapData {
  id: string
  name: string
  address: string
  status: string
  lat: number
  lng: number
}

function mapApiStationToDisplay(station: ApiStation): StationMapData {
  return {
    id: station.id,
    name: station.name,
    address: station.address,
    status: station.status,
    lat: station.latitude,
    lng: station.longitude,
  }
}

export function StationMap() {
  const { user } = useAuthStore()
  const role = user?.role ?? 'STATION_OWNER'
  const canView = hasPermission(role, 'stations', 'view')

  // Fetch stations from backend
  const { data: apiStations, isLoading, error } = useStations()

  // Filters
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  // Map State
  const mapRef = useRef<MapRef>(null)
  const [popupInfo, setPopupInfo] = useState<StationMapData | null>(null)
  const [viewState, setViewState] = useState({
    longitude: 35.0,
    latitude: -1.0,
    zoom: 4
  })

  // Transform API data
  const stations = useMemo(() =>
    (apiStations || []).map(mapApiStationToDisplay),
    [apiStations]
  )

  // 1. Data Processing - Filter the stations
  const filteredStations = useMemo(() =>
    stations
      .filter(s => !q || s.name.toLowerCase().includes(q.toLowerCase()) || s.address.toLowerCase().includes(q.toLowerCase()))
      .filter(s => statusFilter === 'All' || s.status === statusFilter)
    , [stations, q, statusFilter])

  // Convert to GeoJSON for MapLibre
  // In Phase 2, this will be replaced by a vector tile source URL
  const stationsGeoJson = useMemo<FeatureCollection>(() => ({
    type: 'FeatureCollection',
    features: filteredStations.map(s => ({
      type: 'Feature',
      properties: { ...s }, // Pass all props for popups/styling
      geometry: { type: 'Point', coordinates: [s.lng, s.lat] }
    }))
  }), [filteredStations])


  // Stats
  const avgHealth = Math.round((filteredStations.filter(s => s.status === 'ACTIVE').length / (filteredStations.length || 1)) * 100)
  const openIncidents = filteredStations.filter(s => s.status === 'INACTIVE').length

  // Handlers
  const onSelectStation = useCallback((stationId: string) => {
    const station = stations.find(s => s.id === stationId)
    if (station && mapRef.current) {
      mapRef.current.flyTo({
        center: [station.lng, station.lat],
        zoom: 14,
        essential: true
      })
      setPopupInfo(station)
    }
  }, [stations])

  const onMapClick = useCallback(async (event: maplibregl.MapLayerMouseEvent) => {
    const feature = event.features?.[0]
    if (!feature) return

    // Check if clicked cluster
    const clusterId = feature.properties?.cluster_id
    if (clusterId && mapRef.current) {
      const source = mapRef.current.getSource('stations-source') as maplibregl.GeoJSONSource
      try {
        const zoom = await source.getClusterExpansionZoom(clusterId)
        mapRef.current.flyTo({
          center: (feature.geometry as any).coordinates,
          zoom: zoom ?? 10,
          essential: true
        })
      } catch (err) {
        console.error('Error getting cluster expansion zoom:', err)
      }
      return
    }

    // Check if clicked unclustered point
    const props = feature.properties as StationMapData
    if (props && props.id) {
      setPopupInfo(props)
    }
  }, [])

  if (!canView) return <div className="p-8 text-center text-muted">No permission to view stations.</div>

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-danger mb-2">Failed to load stations</div>
        <div className="text-sm text-muted">{error instanceof Error ? error.message : 'Unknown error'}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-140px)]">
      {/* Header Stats */}
      <div className="bg-bg-secondary border border-border-light rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-text">Stations Map</h1>
          <p className="text-sm text-muted">{filteredStations.length} stations found</p>
        </div>
        <div className="flex gap-6">
          <div className="text-center">
            <div className="text-xs text-muted uppercase">Avg Health</div>
            <div className={`text-lg font-bold ${avgHealth > 90 ? 'text-ok' : 'text-warn'}`}>{avgHealth}%</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted uppercase">Incidents</div>
            <div className={`text-lg font-bold ${openIncidents === 0 ? 'text-muted' : 'text-danger'}`}>{openIncidents}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 grow min-h-0">

        {/* Sidebar Controls */}
        <aside className="card p-4 flex flex-col gap-4 h-full overflow-hidden">
          <div className="shrink-0 space-y-4">
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search station or address..."
              className="input w-full"
              disabled={isLoading}
            />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="select w-full"
              disabled={isLoading}
            >
              <option value="All">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="MAINTENANCE">Maintenance</option>
            </select>
          </div>

          <div className="grow overflow-y-auto pr-1 space-y-2">
            {isLoading ? (
              // Loading skeleton
              <>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="p-3 border border-border-light rounded-lg animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                ))}
              </>
            ) : filteredStations.length === 0 ? (
              <div className="text-center text-muted text-sm py-4">No stations match your filters.</div>
            ) : (
              filteredStations.map(s => (
                <div
                  key={s.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${popupInfo?.id === s.id ? 'border-accent bg-accent/5' : 'border-border-light hover:border-accent/50'
                    }`}
                  onClick={() => onSelectStation(s.id)}
                >
                  <div className="flex justify-between font-medium text-sm">
                    <span className="text-text">{s.name}</span>
                    <StatusPill status={s.status} />
                  </div>
                  <div className="text-xs text-muted mt-1">
                    {s.address}
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Map Canvas */}
        <section className="card overflow-hidden relative min-h-[400px] border border-border-light">
          <Map
            ref={mapRef}
            initialViewState={viewState}
            onMove={evt => setViewState(evt.viewState)}
            mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
            interactiveLayerIds={['clusters', 'unclustered-point']}
            onClick={onMapClick}
            cursor="pointer"
          >
            <NavigationControl position="top-right" />

            {/* Source: Phase 1 (GeoJSON) -> Phase 2 (Vector Tiles) */}
            <Source
              id="stations-source"
              type="geojson"
              data={stationsGeoJson}
              cluster={true}
              clusterMaxZoom={14}
              clusterRadius={50}
            >
              {/* Layer 1: Clusters (Circles) */}
              <Layer
                id="clusters"
                type="circle"
                filter={['has', 'point_count']}
                paint={{
                  'circle-color': [
                    'step',
                    ['get', 'point_count'],
                    '#51bbd6', // < 100
                    100,
                    '#f1f075', // 100+
                    750,
                    '#f28cb1'  // 750+
                  ],
                  'circle-radius': [
                    'step',
                    ['get', 'point_count'],
                    20,
                    100,
                    30,
                    750,
                    40
                  ]
                }}
              />

              {/* Layer 2: Cluster Counts (Text) */}
              <Layer
                id="cluster-count"
                type="symbol"
                filter={['has', 'point_count']}
                layout={{
                  'text-field': '{point_count_abbreviated}',
                  'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                  'text-size': 12
                }}
              />

              {/* Layer 3: Unclustered Points (Individual Stations) */}
              {/* Color coded by status: Active=Green (#03cd8c), Offline=Red (#ef4444), etc */}
              <Layer
                id="unclustered-point"
                type="circle"
                filter={['!', ['has', 'point_count']]}
                paint={{
                  'circle-color': [
                    'match',
                    ['get', 'status'],
                    'Active', '#03cd8c',
                    'Paused', '#f59e0b',
                    'Offline', '#ef4444',
                    'Maintenance', '#3b82f6',
                    /* default */ '#94a3b8'
                  ],
                  'circle-radius': 6,
                  'circle-stroke-width': 1,
                  'circle-stroke-color': '#fff'
                }}
              />
            </Source>

            {/* Popup for selected station */}
            {popupInfo && (
              <Popup
                anchor="top"
                longitude={popupInfo.lng}
                latitude={popupInfo.lat}
                onClose={() => setPopupInfo(null)}
                closeOnClick={false}
              >
                <div className="p-1 min-w-[200px]">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-sm text-gray-900">{popupInfo.name}</h3>
                    <StatusPill status={popupInfo.status} size="xs" />
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p>📍 {popupInfo.address}</p>
                    <p className="mt-2 pt-2 border-t border-gray-100 flex gap-2">
                      <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-1 px-2 rounded transition-colors text-center">
                        Details
                      </button>
                      <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1 px-2 rounded transition-colors text-center">
                        Manage
                      </button>
                    </p>
                  </div>
                </div>
              </Popup>
            )}
          </Map>
        </section>
      </div>
    </div>
  )
}

function StatusPill({ status, size = 'sm' }: { status: string, size?: 'sm' | 'xs' }) {
  const colors: Record<string, string> = {
    ACTIVE: 'bg-ok/20 text-ok',
    INACTIVE: 'bg-danger/20 text-danger',
    MAINTENANCE: 'bg-warn/20 text-warn',
  }
  const sizeClasses = size === 'xs' ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5'
  const displayText = status === 'ACTIVE' ? 'Active' : status === 'INACTIVE' ? 'Inactive' : 'Maintenance'
  return <span className={`${sizeClasses} rounded-full font-bold uppercase ${colors[status] || 'bg-gray/20 text-gray'}`}>{displayText}</span>
}

export default StationMap
