
import { apiClient } from './client';

export interface GeographicZone {
    id: string;
    code: string;
    name: string;
    type: 'CONTINENT' | 'SUB_REGION' | 'COUNTRY' | 'ADM1' | 'ADM2' | 'ADM3' | 'CITY' | 'POSTAL_ZONE';
    parentId?: string;
    currency?: string;
    timezone?: string;
    postalCodeRegex?: string;
}

export interface DetectedLocation {
    countryCode?: string;
    countryName?: string;
    regionCode?: string;
    regionName?: string;
    city?: string;
    postalCode?: string;
    lat?: number;
    lng?: number;
}

export const geographyService = {
    /**
     * Auto-detect location from IP (backend)
     */
    detectLocation: async (): Promise<DetectedLocation | null> => {
        return apiClient.get<DetectedLocation>('/geography/detect');
    },

    /**
     * Reverse geocode precise coordinates
     */
    reverseGeocode: async (lat: number, lng: number): Promise<DetectedLocation | null> => {
        return apiClient.get<DetectedLocation>('/geography/reverse', {
            params: { lat, lng }
        });
    },

    /**
     * Get zones (continents, countries, etc.)
     */
    getZones: async (parentId?: string, type?: string): Promise<GeographicZone[]> => {
        return apiClient.get<GeographicZone[]>('/geography/zones', {
            params: { parentId, type }
        });
    }
};
