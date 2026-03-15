
import { apiClient } from './client';

export interface GeographicZone {
    id: string;
    code: string;
    name: string;
    type: 'CONTINENT' | 'SUB_REGION' | 'COUNTRY' | 'ADM1' | 'ADM2' | 'ADM3' | 'CITY' | 'POSTAL_ZONE';
    parentId?: string;
    isActive?: boolean;
    currency?: string;
    timezone?: string;
    postalCodeRegex?: string;
    parent?: GeographicZone | null;
    _count?: {
        children: number;
        stations?: number;
        sites?: number;
        users?: number;
    };
}

export interface GeographicZonesQuery {
    parentId?: string | null;
    type?: GeographicZone['type'];
    active?: boolean;
}

export interface CreateGeographicZoneRequest {
    code: string;
    name: string;
    type: GeographicZone['type'];
    parentId?: string;
    currency?: string;
    timezone?: string;
    postalCodeRegex?: string;
}

export interface UpdateGeographicZoneRequest {
    code?: string;
    name?: string;
    type?: GeographicZone['type'];
    parentId?: string;
    currency?: string | null;
    timezone?: string | null;
    postalCodeRegex?: string | null;
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

export interface GeographyReferenceCountry {
    code2: string;
    code3: string | null;
    name: string;
    officialName: string | null;
    flagUrl: string | null;
    currencyCode: string | null;
    currencyName: string | null;
    currencySymbol: string | null;
    languages: string[];
}

export interface GeographyReferenceState {
    countryCode: string;
    code: string;
    name: string;
}

export interface GeographyReferenceCity {
    countryCode: string;
    stateCode: string;
    name: string;
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
    getZones: async (query?: GeographicZonesQuery): Promise<GeographicZone[]> => {
        return apiClient.get<GeographicZone[]>('/geography/zones', {
            params: {
                parentId: query?.parentId,
                type: query?.type,
                active: query?.active,
            }
        });
    },

    getZoneById: async (id: string): Promise<GeographicZone> => {
        return apiClient.get<GeographicZone>(`/geography/zones/${id}`);
    },

    createZone: async (data: CreateGeographicZoneRequest): Promise<GeographicZone> => {
        return apiClient.post<GeographicZone>('/geography/zones', data);
    },

    updateZone: async (id: string, data: UpdateGeographicZoneRequest): Promise<GeographicZone> => {
        return apiClient.patch<GeographicZone>(`/geography/zones/${id}`, data);
    },

    updateZoneStatus: async (id: string, isActive: boolean): Promise<GeographicZone> => {
        return apiClient.patch<GeographicZone>(`/geography/zones/${id}/status`, { isActive });
    },

    getReferenceCountries: async (query?: { q?: string; refresh?: boolean }): Promise<GeographyReferenceCountry[]> => {
        return apiClient.get<GeographyReferenceCountry[]>('/geography/reference/countries', {
            params: {
                q: query?.q,
                refresh: query?.refresh,
            },
        });
    },

    getReferenceStates: async (countryCode: string, query?: { refresh?: boolean }): Promise<GeographyReferenceState[]> => {
        return apiClient.get<GeographyReferenceState[]>(`/geography/reference/countries/${countryCode}/states`, {
            params: { refresh: query?.refresh },
        });
    },

    getReferenceCities: async (
        countryCode: string,
        stateCode: string,
        query?: { refresh?: boolean }
    ): Promise<GeographyReferenceCity[]> => {
        return apiClient.get<GeographyReferenceCity[]>(
            `/geography/reference/countries/${countryCode}/states/${stateCode}/cities`,
            {
                params: { refresh: query?.refresh },
            },
        );
    },
};
