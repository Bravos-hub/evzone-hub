/**
 * Provider Service
 * Handles battery swapping provider-related API calls
 */

import { apiClient } from '@/core/api/client'
import type { SwapProvider } from '@/core/api/types'

export const providerService = {
    /**
     * Get all swapping providers
     */
    async getAll(query?: { region?: string; standard?: string; status?: string }): Promise<SwapProvider[]> {
        const params = new URLSearchParams()
        if (query?.region) params.append('region', query.region)
        if (query?.standard) params.append('standard', query.standard)
        if (query?.status) params.append('status', query.status)

        const queryString = params.toString()
        return apiClient.get<SwapProvider[]>(`/providers${queryString ? `?${queryString}` : ''}`)
    },

    /**
     * Get provider by ID
     */
    async getById(id: string): Promise<SwapProvider> {
        return apiClient.get<SwapProvider>(`/providers/${id}`)
    },
}
