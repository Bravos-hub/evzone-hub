import type { FeatureCollection } from 'geojson'
import type { StationMapData } from '../components/StationMapCanvas'
import type { Station as ApiStation } from '@/core/api/types'

/**
 * Maps API station data to the structure expected by the map components.
 */
export function mapApiStationToMapData(s: ApiStation): StationMapData {
    return {
        id: s.id,
        name: s.name,
        address: s.address,
        status: s.status,
        type: s.type,
        lat: s.latitude,
        lng: s.longitude,
        capacity: s.capacity,
        lastHeartbeat: (s as any).lastHeartbeat
    }
}

/**
 * Normalizes filtered stations into a GeoJSON FeatureCollection
 * This design makes the map layers independent of the backend structure,
 * facilitating Phase 2's transition to Vector Tiles (MVT).
 */
export function toStationsGeoJSON(stations: StationMapData[]): FeatureCollection {
    return {
        type: 'FeatureCollection',
        features: stations.map(s => ({
            type: 'Feature',
            properties: { ...s },
            geometry: { type: 'Point', coordinates: [s.lng, s.lat] }
        }))
    }
}
