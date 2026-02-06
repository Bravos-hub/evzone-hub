import { useRef, useEffect, useCallback, useMemo, useState } from 'react'
import Map, { Source, Layer, Popup, NavigationControl, MapRef } from '@vis.gl/react-maplibre'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import * as h3 from 'h3-js'
import { API_CONFIG } from '@/core/api/config'
import type { FeatureCollection } from 'geojson'
import { ReliabilityTimeline } from './ReliabilityTimeline'

export interface StationMapData {
    id: string
    name: string
    address: string
    status: string
    type: string
    lat: number
    lng: number
    capacity?: number
    lastHeartbeat?: string
}

interface StationMapCanvasProps {
    tileUrl: string
    viewState: {
        longitude: number
        latitude: number
        zoom: number
    }
    onMove: (evt: any) => void
    onStationClick: (station: StationMapData) => void
    onClusterClick: (clusterId: number, coordinates: [number, number], sourceId: string) => void
    selectedStationId?: string | null
    popupInfo: StationMapData | null
    setPopupInfo: (info: StationMapData | null) => void
    showCoverage?: boolean
}

// Custom Icons for charging/swapping (SVG Data URIs)
const CHARGE_ICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M13 2L3 14h9l-1 8 10-12h-9l1-8z'/%3E%3C/svg%3E";
const SWAP_ICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 12V7H5a2 2 0 0 1 0-4h14v4'/%3E%3Cpath d='M3 5v14a2 2 0 0 0 2 2h16v-5'/%3E%3Cpath d='M18 12l3 3-3 3'/%3E%3Cpath d='M3 11a2 2 0 0 1 2-2h14'/%3E%3C/svg%3E";
const HYBRID_ICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M13 2L3 14h9l-1 8 10-12h-9l1-8z'/%3E%3Ccircle cx='18' cy='18' r='3'/%3E%3C/svg%3E";

export function StationMapCanvas({
    tileUrl,
    viewState,
    onMove,
    onStationClick,
    onClusterClick,
    selectedStationId,
    popupInfo,
    setPopupInfo,
    showCoverage
}: StationMapCanvasProps) {
    const mapRef = useRef<MapRef>(null)
    const [h3Data, setH3Data] = useState<any[]>([])
    const [statusHistory, setStatusHistory] = useState<any[]>([])

    // Fetch H3 Density Data
    useEffect(() => {
        if (!showCoverage) return

        const fetchH3 = async () => {
            try {
                const res = await fetch(`${API_CONFIG.baseURL}/geography/tiles/h3-density?res=4`)
                const data = await res.json()
                setH3Data(data)
            } catch (err) {
                console.error('Failed to fetch H3 data', err)
            }
        }
        fetchH3()
    }, [showCoverage])

    // Convert H3 cells to GeoJSON for rendering
    const h3GeoJson = useMemo(() => {
        if (!showCoverage || !h3Data.length) return null

        const features = h3Data.map(d => ({
            type: 'Feature',
            properties: { count: d.count },
            geometry: {
                type: 'Polygon',
                coordinates: [h3.cellToBoundary(d.hex).map(([lat, lng]) => [lng, lat])]
            }
        }))

        return {
            type: 'FeatureCollection',
            features
        } as FeatureCollection
    }, [h3Data, showCoverage])

    // Fetch Status History for Popup
    useEffect(() => {
        if (!popupInfo) {
            setStatusHistory([]);
            return;
        }

        const fetchHistory = async () => {
            try {
                const res = await fetch(`${API_CONFIG.baseURL}/stations/${popupInfo.id}/reliability-history`)
                const data = await res.json()
                setStatusHistory(data)
            } catch (err) {
                console.error('Failed to fetch status history', err)
            }
        }
        fetchHistory()
    }, [popupInfo])

    useEffect(() => {
        const map = mapRef.current?.getMap()
        if (!map) return

        const loadImages = async () => {
            // Create and add images to the map style
            const addImage = (name: string, url: string) => {
                if (!map.hasImage(name)) {
                    const img = new Image(24, 24);
                    img.src = url;
                    img.onload = () => map.addImage(name, img);
                }
            }

            addImage('charge-icon', CHARGE_ICON);
            addImage('swap-icon', SWAP_ICON);
            addImage('hybrid-icon', HYBRID_ICON);
        }

        // We might need to wait for the map to load or style to be set
        if (map.isStyleLoaded()) {
            loadImages();
        } else {
            map.once('styledata', loadImages);
        }
    }, [])

    const onMapClick = useCallback((event: maplibregl.MapLayerMouseEvent) => {
        const feature = event.features?.[0]
        if (!feature) return

        const clusterId = feature.properties?.cluster_id
        if (clusterId) {
            onClusterClick(clusterId, (feature.geometry as any).coordinates, 'stations-source')
            return
        }

        const props = feature.properties as StationMapData
        if (props && props.id) {
            onStationClick(props)
        }
    }, [onClusterClick, onStationClick])

    return (
        <section className="card overflow-hidden relative min-h-[400px] border border-border-light h-full w-full bg-black/20">
            <Map
                ref={mapRef}
                {...viewState}
                onMove={onMove}
                mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
                interactiveLayerIds={['clusters', 'unclustered-point']}
                onClick={onMapClick}
                cursor="pointer"
                style={{ width: '100%', height: '100%' }}
            >
                <NavigationControl position="top-right" />

                {/* 0. H3 Coverage Layer (Background) */}
                {showCoverage && h3GeoJson && (
                    <Source id="h3-source" type="geojson" data={h3GeoJson}>
                        <Layer
                            id="h3-layer"
                            type="fill"
                            paint={{
                                'fill-color': [
                                    'interpolate',
                                    ['linear'],
                                    ['get', 'count'],
                                    1, 'rgba(3, 205, 140, 0.1)',
                                    10, 'rgba(3, 205, 140, 0.4)',
                                    50, 'rgba(3, 205, 140, 0.8)'
                                ],
                                'fill-outline-color': 'rgba(255,255,255,0.1)'
                            }}
                        />
                    </Source>
                )}

                <Source
                    id="stations-source"
                    type="vector"
                    tiles={[tileUrl]}
                >
                    {/* 1. Clusters (Density Circles) */}
                    <Layer
                        id="clusters"
                        type="circle"
                        source-layer="stations"
                        filter={['has', 'point_count']}
                        paint={{
                            'circle-color': [
                                'step',
                                ['get', 'point_count'],
                                'rgba(81, 187, 214, 0.6)', 100,
                                'rgba(241, 240, 117, 0.6)', 750,
                                'rgba(242, 140, 177, 0.6)'
                            ],
                            'circle-radius': [
                                'step',
                                ['get', 'point_count'],
                                20, 100, 30, 750, 40
                            ],
                            'circle-stroke-width': 2,
                            'circle-stroke-color': 'rgba(255,255,255,0.4)',
                            'circle-blur': 0.1
                        }}
                    />

                    <Layer
                        id="cluster-count"
                        type="symbol"
                        source-layer="stations"
                        filter={['has', 'point_count']}
                        layout={{
                            'text-field': '{point_count_abbreviated}',
                            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                            'text-size': 12
                        }}
                        paint={{ 'text-color': '#fff' }}
                    />

                    {/* 2. Unclustered Points (Individual Stations) */}
                    {/* Confidence Glow (Soft aura for high-uptime stations) */}
                    <Layer
                        id="station-confidence-glow"
                        type="circle"
                        source-layer="stations"
                        filter={['match', ['get', 'status'], 'ACTIVE', true, false]}
                        paint={{
                            'circle-color': '#03cd8c',
                            'circle-radius': [
                                'interpolate', ['linear'], ['zoom'],
                                8, 8,
                                14, 15,
                                20, 30
                            ],
                            'circle-opacity': [
                                'interpolate', ['linear'], ['zoom'],
                                10, 0.1,
                                14, 0.2,
                                18, 0.05
                            ],
                            'circle-blur': 1.5
                        }}
                    />

                    {/* Base Glow / Pulse Effect for selection */}
                    <Layer
                        id="station-selection-glow"
                        type="circle"
                        source-layer="stations"
                        filter={['==', ['get', 'id'], selectedStationId || '']}
                        paint={{
                            'circle-color': '#03cd8c',
                            'circle-radius': [
                                'interpolate', ['linear'], ['zoom'],
                                10, 15,
                                14, 30,
                                22, 60
                            ],
                            'circle-opacity': 0.2,
                            'circle-blur': 1
                        }}
                    />

                    {/* Main Station Circle */}
                    <Layer
                        id="unclustered-point"
                        type="circle"
                        source-layer="stations"
                        filter={['!', ['has', 'point_count']]}
                        paint={{
                            'circle-color': [
                                'match',
                                ['get', 'status'],
                                'ACTIVE', '#03cd8c',
                                'INACTIVE', '#ef4444',
                                'MAINTENANCE', '#3b82f6',
                                '#94a3b8'
                            ],
                            'circle-radius': [
                                'interpolate', ['linear'], ['zoom'],
                                8, 4,
                                14, 8,
                                20, 15
                            ],
                            'circle-stroke-width': [
                                'case',
                                ['==', ['get', 'id'], selectedStationId || ''], 4,
                                1.5
                            ],
                            'circle-stroke-color': '#fff',
                            'circle-pitch-alignment': 'map'
                        }}
                    />

                    {/* Type Icons Layer (High Zoom Only) */}
                    <Layer
                        id="station-icons"
                        type="symbol"
                        source-layer="stations"
                        filter={['all', ['!', ['has', 'point_count']], ['>=', ['zoom'], 13]]}
                        layout={{
                            'icon-image': [
                                'match',
                                ['get', 'type'],
                                'CHARGING', 'charge-icon',
                                'SWAP', 'swap-icon',
                                'BOTH', 'hybrid-icon',
                                'charge-icon'
                            ],
                            'icon-size': [
                                'interpolate', ['linear'], ['zoom'],
                                13, 0.4,
                                16, 0.7,
                                20, 1.2
                            ],
                            'icon-allow-overlap': true
                        }}
                    />

                    {/* Station Labels (High Zoom Only) */}
                    <Layer
                        id="station-labels"
                        type="symbol"
                        source-layer="stations"
                        filter={['all', ['!', ['has', 'point_count']], ['>=', ['zoom'], 15]]}
                        layout={{
                            'text-field': ['get', 'name'],
                            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                            'text-offset': [0, 1.2],
                            'text-anchor': 'top',
                            'text-size': 11
                        }}
                        paint={{
                            'text-color': '#fff',
                            'text-halo-color': 'rgba(0,0,0,0.8)',
                            'text-halo-width': 1
                        }}
                    />
                </Source>

                {popupInfo && (
                    <Popup
                        anchor="top"
                        longitude={popupInfo.lng}
                        latitude={popupInfo.lat}
                        onClose={() => setPopupInfo(null)}
                        closeOnClick={false}
                        className="station-popup z-50"
                        offset={[0, -10]}
                    >
                        <div className="p-4 min-w-[280px] bg-white rounded-xl shadow-2xl relative overflow-hidden group dark:text-gray-900 border border-gray-100">
                            {/* Header with Type & Status */}
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase text-accent/70 tracking-tighter mb-1">
                                        {popupInfo.type} STATION
                                    </span>
                                    <h3 className="font-black text-lg text-gray-900 leading-tight group-hover:text-accent transition-colors">
                                        {popupInfo.name}
                                    </h3>
                                </div>
                                <div className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase flex items-center gap-1.5 ${popupInfo.status === 'ACTIVE' ? 'bg-ok/10 text-ok' : 'bg-danger/10 text-danger'
                                    }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${popupInfo.status === 'ACTIVE' ? 'bg-ok animate-pulse' : 'bg-danger'}`} />
                                    {popupInfo.status}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-start gap-2.5 text-xs text-gray-500 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                                    <span className="text-base">📍</span>
                                    <span className="line-clamp-2 leading-relaxed">{popupInfo.address}</span>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex flex-col p-2.5 bg-gray-50 rounded-xl border border-gray-100 group-hover:border-accent/20 transition-all">
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Asset ID</span>
                                        <span className="text-[11px] font-mono font-bold text-gray-700 truncate">{popupInfo.id.split('-')[0]}...</span>
                                    </div>
                                    <div className="flex flex-col p-2.5 bg-gray-50 rounded-xl border border-gray-100 group-hover:border-accent/20 transition-all text-right">
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Capacity</span>
                                        <span className="text-[11px] font-black text-gray-900">{popupInfo.capacity || 0} kW</span>
                                    </div>
                                </div>

                                {/* Reliability Timeline */}
                                <ReliabilityTimeline history={statusHistory} />

                                <div className="flex gap-2 pt-2">
                                    <button className="flex-1 bg-gray-900 text-white py-2 px-3 rounded-xl text-xs font-black uppercase tracking-tight hover:bg-black hover:scale-[1.02] active:scale-95 transition-all outline-none">
                                        Full Analytics
                                    </button>
                                    <button className="flex-1 bg-accent text-white py-2 px-3 rounded-xl text-xs font-black uppercase tracking-tight hover:shadow-lg hover:shadow-accent/20 hover:scale-[1.02] active:scale-95 transition-all outline-none">
                                        Remote Ops
                                    </button>
                                </div>
                            </div>

                            {/* Decorative accent line */}
                            <div className="absolute top-0 left-0 w-1 h-full bg-accent opacity-50" />
                        </div>
                    </Popup>
                )}
            </Map>
        </section>
    )
}
