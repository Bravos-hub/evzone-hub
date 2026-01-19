/**
 * Site Service
 * Handles site-related API calls
 */

import { apiClient } from '../client'
import type { Site, CreateSiteRequest, UpdateSiteRequest } from '../types'

export const siteService = {
    /**
     * Create a new site
     */
    async createSite(data: CreateSiteRequest): Promise<Site> {
        const response = await apiClient.post<Site>('/sites', data)
        return response
    },

    /**
     * Get all sites with optional filters
     */
    async getSites(filters?: { status?: string; city?: string; myOnly?: boolean }): Promise<Site[]> {
        const params = new URLSearchParams()
        if (filters?.status) params.append('status', filters.status)
        if (filters?.city) params.append('city', filters.city)
        if (filters?.myOnly) params.append('myOnly', 'true')

        const queryString = params.toString()
        const url = queryString ? `/sites?${queryString}` : '/sites'

        const response = await apiClient.get<Site[]>(url)
        return response
    },

    /**
     * Get a single site by ID
     */
    async getSite(id: string): Promise<Site> {
        const response = await apiClient.get<Site>(`/sites/${id}`)
        return response
    },

    /**
     * Update a site
     */
    async updateSite(id: string, data: UpdateSiteRequest): Promise<Site> {
        const response = await apiClient.patch<Site>(`/sites/${id}`, data)
        return response
    },

    /**
     * Delete a site (soft delete)
     */
    async deleteSite(id: string): Promise<{ message: string }> {
        const response = await apiClient.delete<{ message: string }>(`/sites/${id}`)
        return response
    },
}
