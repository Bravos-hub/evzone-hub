/**
 * Provider Service
 * Handles battery swapping provider-related API calls
 */

import { apiClient } from '@/core/api/client'
import type {
    CreateProviderDocumentRequest,
    CreateProviderRelationshipRequest,
    CreateSwapProviderRequest,
    ProviderDocument,
    ProviderRelationship,
    ProviderSettlementSummary,
    SwapProvider,
    UpdateSwapProviderRequest,
} from '@/core/api/types'

export type ProviderListFilters = {
    region?: string
    standard?: string
    status?: string
    orgId?: string
    ownerOrgId?: string
    relationshipStatus?: string
    includeOnlyEligible?: boolean
    my?: boolean
}

type RelationshipFilters = {
    ownerOrgId?: string
    providerId?: string
    status?: string
    my?: boolean
}

type SettlementFilters = {
    providerId?: string
    ownerOrgId?: string
    startDate?: string
    endDate?: string
    my?: boolean
}

type DocumentFilters = {
    providerId?: string
    relationshipId?: string
    my?: boolean
}

const appendQueryValue = (params: URLSearchParams, key: string, value?: string | boolean) => {
    if (value === undefined || value === null || value === '') return
    params.append(key, String(value))
}

export const providerService = {
    /**
     * Get all swapping providers
     */
    async getAll(query?: ProviderListFilters): Promise<SwapProvider[]> {
        const params = new URLSearchParams()
        appendQueryValue(params, 'region', query?.region)
        appendQueryValue(params, 'standard', query?.standard)
        appendQueryValue(params, 'status', query?.status)
        appendQueryValue(params, 'orgId', query?.orgId)
        appendQueryValue(params, 'ownerOrgId', query?.ownerOrgId)
        appendQueryValue(params, 'relationshipStatus', query?.relationshipStatus)
        appendQueryValue(params, 'includeOnlyEligible', query?.includeOnlyEligible)
        appendQueryValue(params, 'my', query?.my)

        const queryString = params.toString()
        return apiClient.get<SwapProvider[]>(`/providers${queryString ? `?${queryString}` : ''}`)
    },

    /**
     * Get provider by ID
     */
    async getById(id: string): Promise<SwapProvider> {
        return apiClient.get<SwapProvider>(`/providers/${id}`)
    },

    async create(data: CreateSwapProviderRequest): Promise<SwapProvider> {
        return apiClient.post<SwapProvider>('/providers', data)
    },

    async update(id: string, data: UpdateSwapProviderRequest): Promise<SwapProvider> {
        return apiClient.patch<SwapProvider>(`/providers/${id}`, data)
    },

    async submitForReview(id: string): Promise<SwapProvider> {
        return apiClient.post<SwapProvider>(`/providers/${id}/submit`, {})
    },

    async approve(id: string, notes?: string): Promise<SwapProvider> {
        return apiClient.post<SwapProvider>(`/providers/${id}/approve`, notes ? { notes } : {})
    },

    async reject(id: string, reason: string): Promise<SwapProvider> {
        return apiClient.post<SwapProvider>(`/providers/${id}/reject`, { reason })
    },

    async suspend(id: string, reason?: string): Promise<SwapProvider> {
        return apiClient.post<SwapProvider>(`/providers/${id}/suspend`, reason ? { reason } : {})
    },

    async listDocuments(filters?: DocumentFilters): Promise<ProviderDocument[]> {
        const params = new URLSearchParams()
        appendQueryValue(params, 'providerId', filters?.providerId)
        appendQueryValue(params, 'relationshipId', filters?.relationshipId)
        appendQueryValue(params, 'my', filters?.my)
        const queryString = params.toString()
        return apiClient.get<ProviderDocument[]>(`/provider-documents${queryString ? `?${queryString}` : ''}`)
    },

    async uploadDocument(data: CreateProviderDocumentRequest & { providerId?: string; relationshipId?: string }): Promise<ProviderDocument> {
        return apiClient.post<ProviderDocument>('/provider-documents', data)
    },

    async deleteDocument(id: string): Promise<void> {
        return apiClient.delete<void>(`/provider-documents/${id}`)
    },

    async getRelationships(filters?: RelationshipFilters): Promise<ProviderRelationship[]> {
        const params = new URLSearchParams()
        appendQueryValue(params, 'ownerOrgId', filters?.ownerOrgId)
        appendQueryValue(params, 'providerId', filters?.providerId)
        appendQueryValue(params, 'status', filters?.status)
        appendQueryValue(params, 'my', filters?.my)
        const queryString = params.toString()
        return apiClient.get<ProviderRelationship[]>(`/provider-relationships${queryString ? `?${queryString}` : ''}`)
    },

    async requestRelationship(data: CreateProviderRelationshipRequest): Promise<ProviderRelationship> {
        return apiClient.post<ProviderRelationship>('/provider-relationships', data)
    },

    async respondToRelationship(id: string, action: 'ACCEPT' | 'REJECT', notes?: string): Promise<ProviderRelationship> {
        return apiClient.post<ProviderRelationship>(`/provider-relationships/${id}/respond`, { action, notes })
    },

    async approveRelationship(id: string, notes?: string): Promise<ProviderRelationship> {
        return apiClient.post<ProviderRelationship>(`/provider-relationships/${id}/approve`, notes ? { notes } : {})
    },

    async suspendRelationship(id: string, reason?: string): Promise<ProviderRelationship> {
        return apiClient.post<ProviderRelationship>(`/provider-relationships/${id}/suspend`, reason ? { reason } : {})
    },

    async terminateRelationship(id: string, reason?: string): Promise<ProviderRelationship> {
        return apiClient.post<ProviderRelationship>(`/provider-relationships/${id}/terminate`, reason ? { reason } : {})
    },

    async getSettlementSummary(filters?: SettlementFilters): Promise<ProviderSettlementSummary> {
        const params = new URLSearchParams()
        appendQueryValue(params, 'providerId', filters?.providerId)
        appendQueryValue(params, 'ownerOrgId', filters?.ownerOrgId)
        appendQueryValue(params, 'startDate', filters?.startDate)
        appendQueryValue(params, 'endDate', filters?.endDate)
        appendQueryValue(params, 'my', filters?.my)
        const queryString = params.toString()
        return apiClient.get<ProviderSettlementSummary>(`/providers/settlements/summary${queryString ? `?${queryString}` : ''}`)
    },

    async getEligibleForOwner(ownerOrgId?: string): Promise<SwapProvider[]> {
        const params = new URLSearchParams()
        appendQueryValue(params, 'ownerOrgId', ownerOrgId)
        const queryString = params.toString()
        return apiClient.get<SwapProvider[]>(`/providers/eligible${queryString ? `?${queryString}` : ''}`)
    },
}
